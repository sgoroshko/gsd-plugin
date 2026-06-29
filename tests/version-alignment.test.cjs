#!/usr/bin/env node
'use strict';

// Unit tests for bin/maintenance/check-version-alignment.cjs.
//
// Covers the "internal milestone version vs actual product version" guard:
// milestone major must equal the plugin major (current line) or plugin major + 1
// (next major in progress). Anything else is a parallel line and fails.
//
// Zero-dep harness mirroring tests/drift-allowlist.test.cjs: node:assert,
// a bare check(name, fn) runner, a failure counter, and a process.exit(1)
// footer. CI runs this directly via `node tests/version-alignment.test.cjs`.

const assert = require('node:assert');

const { parseMajor, evaluateAlignment } = require('../bin/maintenance/check-version-alignment.cjs');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log(`  ok - ${name}`); }
  catch (e) { console.error(`  FAIL - ${name}: ${e.message}`); failures++; }
}

// ─── exports ─────────────────────────────────────────────────────────────────

check('exports the pure helpers', () => {
  assert.strictEqual(typeof parseMajor, 'function', 'missing parseMajor');
  assert.strictEqual(typeof evaluateAlignment, 'function', 'missing evaluateAlignment');
});

// ─── parseMajor ──────────────────────────────────────────────────────────────

check('parseMajor handles v-prefixed milestone and bare semver', () => {
  assert.strictEqual(parseMajor('v4.1'), 4);
  assert.strictEqual(parseMajor('4.0.1'), 4);
  assert.strictEqual(parseMajor('v12.3'), 12);
});

check('parseMajor returns null on junk', () => {
  assert.strictEqual(parseMajor(''), null);
  assert.strictEqual(parseMajor('latest'), null);
  assert.strictEqual(parseMajor(null), null);
  assert.strictEqual(parseMajor(undefined), null);
});

// ─── evaluateAlignment: aligned cases ────────────────────────────────────────

check('same major is aligned (v4.1 vs 4.0.1) — the post-fix state', () => {
  assert.strictEqual(evaluateAlignment('4.0.1', 'v4.1').ok, true);
});

check('next major in progress is aligned (v5.0 vs 4.0.1)', () => {
  assert.strictEqual(evaluateAlignment('4.0.1', 'v5.0').ok, true);
});

check('exact equality is aligned (v4.0 vs 4.0.0)', () => {
  assert.strictEqual(evaluateAlignment('4.0.0', 'v4.0').ok, true);
});

// ─── evaluateAlignment: divergent cases ──────────────────────────────────────

check('parallel internal line fails (v1.3 vs 4.0.1) — the bug this prevents', () => {
  const v = evaluateAlignment('4.0.1', 'v1.3');
  assert.strictEqual(v.ok, false);
  assert.match(v.reason, /different line/);
});

check('two majors ahead fails (v6.0 vs 4.0.1)', () => {
  assert.strictEqual(evaluateAlignment('4.0.1', 'v6.0').ok, false);
});

check('milestone behind product fails (v3.0 vs 4.0.1)', () => {
  assert.strictEqual(evaluateAlignment('4.0.1', 'v3.0').ok, false);
});

// ─── evaluateAlignment: uncomparable → treated as ok (caller skips) ───────────

check('uncomparable inputs return ok so the caller can SKIP', () => {
  assert.strictEqual(evaluateAlignment('4.0.1', 'latest').ok, true);
  assert.strictEqual(evaluateAlignment(null, 'v4.1').ok, true);
});

// ─── footer ──────────────────────────────────────────────────────────────────

if (failures > 0) {
  console.error(`\n${failures} test(s) failed`);
  process.exit(1);
}
console.log('\nAll version-alignment tests passed');
