#!/usr/bin/env node
/**
 * Version Alignment Check
 *
 * Guards against the "internal version numbering diverging from actual
 * versioning" failure mode: GSD milestones are free-form `vX.Y` text, so it is
 * easy to end up with a parallel internal milestone line (e.g. milestones
 * v1.0..v1.3) that has nothing to do with the real shipped product version
 * (plugin 4.x). That divergence forces everyone to track two numbers and
 * describe releases as "milestone v1.3 shipped as plugin v4.0.0".
 *
 * This detector asserts the active milestone version sits on the SAME line as
 * the real product version:
 *   1. milestone major == plugin major            (current line), OR
 *   2. milestone major == plugin major + 1        (next major, in progress
 *                                                   before the release bump)
 * Anything else (a milestone two-or-more majors away, or behind) is a parallel
 * line and fails. It also verifies plugin.json and marketplace.json agree, since
 * a split there is the other half of "actual versioning" drifting.
 *
 * General by design: if there is no version manifest (.claude-plugin/plugin.json)
 * or no active milestone, there is nothing to align — the check SKIPS (exit 0).
 * So it is safe in any GSD project, not just this one.
 *
 * Escape hatch for deliberate transitions: set VERSION_ALIGNMENT_ALLOW=1 or
 * commit a `.version-alignment-allow` file at repo root to downgrade a mismatch
 * to a warning.
 *
 * Usage (from repo root):
 *   node bin/maintenance/check-version-alignment.cjs
 *
 * Exit codes (maintenance-script convention):
 *   0 — PASS or SKIP (aligned, or nothing to compare)
 *   1 — FAIL (internal milestone version diverges from the product version line,
 *             or plugin.json/marketplace.json disagree)
 *   2 — ENV ERROR (not at repo root)
 *
 * Pattern-matches bin/maintenance/check-handoff-schema.cjs (exit codes, env
 * guard, 'use strict'). Pairs with tests/version-alignment.test.cjs.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/** Parse a leading integer major from a version like "v4.1" or "4.0.1". */
function parseMajor(version) {
  if (typeof version !== 'string') return null;
  const m = version.trim().match(/^v?(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Decide whether an internal milestone version is on the product version line.
 * Pure + exported so tests can exercise it without disk or process.exit.
 *
 * @returns {{ok: boolean, reason: string|null}}
 */
function evaluateAlignment(pluginVersion, milestoneVersion) {
  const pMajor = parseMajor(pluginVersion);
  const mMajor = parseMajor(milestoneVersion);
  if (pMajor === null || mMajor === null) {
    return { ok: true, reason: null }; // nothing comparable — caller treats as skip
  }
  if (mMajor === pMajor || mMajor === pMajor + 1) {
    return { ok: true, reason: null };
  }
  return {
    ok: false,
    reason:
      `milestone ${milestoneVersion} (major ${mMajor}) is on a different line than ` +
      `the product version ${pluginVersion} (major ${pMajor}). Milestones must track ` +
      `the real version line: milestone major should be ${pMajor} (current) or ` +
      `${pMajor + 1} (next major in progress). Renumber the milestone to the product ` +
      `version line, or set VERSION_ALIGNMENT_ALLOW=1 for a deliberate transition.`,
  };
}

/** Read JSON, returning null on any failure. */
function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/** Active milestone version: STATE.md frontmatter `milestone:` wins; else latest MILESTONES.md heading. */
function readMilestoneVersion() {
  const statePath = path.join('.planning', 'STATE.md');
  if (fs.existsSync(statePath)) {
    const m = fs.readFileSync(statePath, 'utf8').match(/^milestone:\s*"?(v\d+(?:\.\d+)*)"?/m);
    if (m) return m[1];
  }
  const milestonesPath = path.join('.planning', 'MILESTONES.md');
  if (fs.existsSync(milestonesPath)) {
    // First `## vX.Y ...` heading — MILESTONES.md lists the newest milestone first.
    const m = fs.readFileSync(milestonesPath, 'utf8').match(/^##\s+(v\d+(?:\.\d+)*)\b/m);
    if (m) return m[1];
  }
  return null;
}

function overrideActive() {
  return process.env.VERSION_ALIGNMENT_ALLOW === '1' || fs.existsSync('.version-alignment-allow');
}

function main() {
  if (!fs.existsSync('.git') || !fs.existsSync('bin/maintenance')) {
    console.error('error: run from repo root (expected .git/ and bin/maintenance/)');
    process.exit(2);
  }

  console.log('Version alignment check');
  console.log('=======================');

  const pluginPath = path.join('.claude-plugin', 'plugin.json');
  const plugin = readJson(pluginPath);
  if (!plugin || typeof plugin.version !== 'string') {
    console.log('SKIP — no .claude-plugin/plugin.json version to compare against.');
    process.exit(0);
  }
  const pluginVersion = plugin.version;

  // Half 2: actual versioning must be internally consistent (plugin vs marketplace).
  const marketplace = readJson(path.join('.claude-plugin', 'marketplace.json'));
  let marketplaceVersion = null;
  if (marketplace && Array.isArray(marketplace.plugins)) {
    const entry = marketplace.plugins.find((p) => p && typeof p.version === 'string');
    if (entry) marketplaceVersion = entry.version;
  }

  const milestoneVersion = readMilestoneVersion();
  if (!milestoneVersion) {
    console.log(`SKIP — no active milestone version found (plugin ${pluginVersion}).`);
    // Still validate plugin/marketplace parity below before exiting.
  }

  const problems = [];

  if (marketplaceVersion && marketplaceVersion !== pluginVersion) {
    problems.push(
      `plugin.json (${pluginVersion}) and marketplace.json (${marketplaceVersion}) disagree — ` +
        `bump both together on every release.`,
    );
  }

  if (milestoneVersion) {
    const verdict = evaluateAlignment(pluginVersion, milestoneVersion);
    console.log(`  plugin version:    ${pluginVersion}`);
    if (marketplaceVersion) console.log(`  marketplace:       ${marketplaceVersion}`);
    console.log(`  milestone version: ${milestoneVersion}`);
    if (!verdict.ok) problems.push(verdict.reason);
  }

  if (problems.length === 0) {
    console.log('\nStatus: PASS — versions aligned.');
    process.exit(0);
  }

  console.log('');
  for (const p of problems) console.log(`  [FAIL] ${p}`);
  if (overrideActive()) {
    console.log('\nStatus: WARN — mismatch overridden (VERSION_ALIGNMENT_ALLOW / .version-alignment-allow).');
    process.exit(0);
  }
  console.log(`\nStatus: FAIL — ${problems.length} version-alignment problem(s).`);
  process.exit(1);
}

// Export pure helpers for tests; run main only when invoked directly.
module.exports = { parseMajor, evaluateAlignment };
if (require.main === module) main();
