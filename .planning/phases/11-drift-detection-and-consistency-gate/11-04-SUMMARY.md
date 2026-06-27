---
phase: 11-drift-detection-and-consistency-gate
plan: "04"
subsystem: drift-detection
tags: [verify-drift, cjs-sdk-parity, drift-gate, native-detectors, ci]
dependency_graph:
  requires: [11-01, 11-02]
  provides: [verify-drift-subcommand, drift-config-keys, drift-detectors-ci-job]
  affects: [scan-drift, audit-milestone-gate]
tech_stack:
  added: []
  patterns:
    - cmdVerifyDrift mirrors cmdVerifyConventions (never-throw, never-exit-nonzero except --fail-on-score)
    - SDK bridge handlers (verifyConventions + verifyDrift) forward to CJS via execFileSync
    - CJS<->SDK dual-sync: single plan owns both edits + dist rebuild
key_files:
  created: []
  modified:
    - bin/lib/verify.cjs
    - bin/lib/verify-command-router.cjs
    - bin/lib/command-aliases.generated.cjs
    - bin/lib/config-schema.cjs
    - sdk/src/query/command-manifest.verify.ts
    - sdk/src/query/command-aliases.generated.ts
    - sdk/src/query/command-family-handlers.ts
    - sdk/src/query/verify.ts
    - sdk/src/query/config-schema.ts
    - sdk/scripts/check-command-aliases-fresh.mjs
    - sdk/dist/cli.js (rebuilt)
    - .github/workflows/check-drift.yml
decisions:
  - "SDK bridge handlers (verifyConventions, verifyDrift) forward to CJS via execFileSync, mirroring verifyCodebaseDrift — avoids duplicating logic and satisfies the registry invariant"
  - "Phantom 'warning' severity mapped to 'medium' for scoring since SEVERITY_WEIGHTS only handles standard tiers (critical/high/medium/low/info)"
  - "semantic-dup pair.a/pair.b are objects with .file property (not strings) — cmdVerifyDrift extracts fileA = pair.a.file rather than String(pair.a)"
metrics:
  duration: 559s
  completed: "2026-06-27"
  tasks_completed: 3
  files_modified: 12
---

# Phase 11 Plan 04: verify drift Integration Seam Summary

Wired the three Phase 11 native detectors (semantic-dup, phantom-scaffolding, conventions) into a single `verify drift` JSON subcommand — the integration seam consumed by `/gsd:scan --drift` and the audit-milestone gate (Plan 11-05).

## What Was Built

**Task 1: `cmdVerifyDrift` + router case** (`eeb3887`)

Added `cmdVerifyDrift(cwd, opts, raw)` to `bin/lib/verify.cjs` immediately after `cmdVerifyConventions`, copying its exact structure:
- Builds a single bounded corpus via `collectConventionCorpus(root, cwd)` (scope-sanitized per T-11-01)
- Loads the allowlist via `drift-allowlist.cjs` (never throws, returns empty-but-valid)
- Runs all three detectors over the single corpus; individual detector skips fold to `payload.warnings`, never abort the whole report (T-11-03)
- Score formula: `max(0, 100 - sum(severity_weight * count))` with weights `{critical:20, high:10, medium:5, low:2, info:1}`; documented in a comment
- Ranks findings by severity descending then file; applies `--top N` slice
- Suppressed pairs always appear in `suppressed:[]` — never dropped (D-07 auditability)
- D-06 sanctioned non-zero exit: only when `opts.failOnScore` is set AND `score < opts.failOnScore`, sets `process.exitCode = 1` (a comment marks this as the single sanctioned path)
- Added drift router case to `verify-command-router.cjs` mirroring the conventions case (parses `--scope`, `--top`, `--fail-on-score`)
- Exported `cmdVerifyDrift` in `module.exports` block

**Task 2: CJS<->SDK parity** (`d471078`)

All dual-sync edits in one plan:
- `sdk/src/query/command-manifest.verify.ts`: added `verify.drift` entry
- `sdk/src/query/command-aliases.generated.ts`: added `verify.conventions` + `verify.drift` (TS generated file was behind the CJS file from Plan 11-03)
- `bin/lib/command-aliases.generated.cjs`: hand-synced `verify.drift` block
- Both config schema files: added `workflow.drift_gate` + `workflow.drift_fail_on_score`
- Fixed `sdk/scripts/check-command-aliases-fresh.mjs` path (Rule 3): was hardcoded to `get-shit-done/bin/lib/` (upstream layout) rather than `bin/lib/` (plugin flat layout)
- Added `verifyConventions` + `verifyDrift` SDK bridge handlers to `sdk/src/query/verify.ts` (Rule 3): registry invariant `assertAliasCanonicalsHaveHandlers` requires every manifest alias to have a handler; `verify.conventions` was added in Plan 11-03 without a handler, breaking all SDK tests (92/93 test files failing)
- Wired both handlers into `sdk/src/query/command-family-handlers.ts`
- Rebuilt `sdk/dist`: all 1813 SDK tests pass; `npm run check:alias-drift` passes

**Task 3: CI job** (`9e6bb25`)

Added `drift-detectors` job to `.github/workflows/check-drift.yml` mirroring the `conventions` job (zero-dep, no `npm ci`): runs the three detector tests + a `verify drift --json` smoke step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] semantic-dup pair.a/pair.b are objects, not strings**
- **Found during:** Task 1 verification (first test run returned exception)
- **Issue:** `pair.a || ''` in the findings loop returned an object (semantic-dup's pairs have shape `{a: {file, startLine}, b: {file, startLine}}`), causing `"".localeCompare is not a function` in the sort
- **Fix:** Extract `fileA = pair.a.file` when pair.a is an object; extracted to a local const with explicit type guard
- **Files modified:** `bin/lib/verify.cjs`
- **Commit:** `eeb3887` (included in Task 1 commit)

**2. [Rule 1 - Bug] phantom-scaffolding uses 'warning' severity not in SEVERITY_WEIGHTS**
- **Found during:** Task 1 (code review of phantom-scaffolding output shape)
- **Issue:** phantom-scaffolding emits `severity: 'warning'` but `SEVERITY_WEIGHTS` only handles `critical/high/medium/low/info`; would produce `undefined` weight and incorrect scoring
- **Fix:** Map `'warning'` to `'medium'` on ingestion; documented in comment
- **Files modified:** `bin/lib/verify.cjs`
- **Commit:** `eeb3887`

**3. [Rule 3 - Blocking] check-command-aliases-fresh.mjs had wrong CJS path**
- **Found during:** Task 2 when running `npm run check:alias-drift`
- **Issue:** Script was hardcoded to `../../get-shit-done/bin/lib/command-aliases.generated.cjs` (upstream layout), but this plugin uses flat layout at `../../bin/lib/command-aliases.generated.cjs`; the file path doesn't exist, causing `MODULE_NOT_FOUND`
- **Fix:** Updated path to use `../../bin/lib/command-aliases.generated.cjs`
- **Files modified:** `sdk/scripts/check-command-aliases-fresh.mjs`
- **Commit:** `d471078`

**4. [Rule 3 - Blocking] SDK registry invariant broken by previous session (verify.conventions missing handler)**
- **Found during:** Task 2 SDK test run
- **Issue:** Plan 11-03 added `verify.conventions` to the CJS aliases and SDK dist manifest but did NOT add an SDK handler; `assertAliasCanonicalsHaveHandlers` in `buildRegistry()` threw on every SDK query, causing 92 test files and 1720 tests to fail
- **Fix:** Added `verifyConventions` + `verifyDrift` SDK bridge handlers to `sdk/src/query/verify.ts` (both delegate to CJS via `execFileSync`, matching the `verifyCodebaseDrift` pattern); wired both into `FAMILY_HANDLERS` in `command-family-handlers.ts`
- **Files modified:** `sdk/src/query/verify.ts`, `sdk/src/query/command-family-handlers.ts`
- **Commit:** `d471078`

## Known Stubs

None — all detector invocations use real implementations from Plans 11-01 and 11-02.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond the planned config keys.

## Self-Check: PASSED

Files confirmed present:
- `/Users/jnuyens/src/gsd-plugin/bin/lib/verify.cjs` — FOUND (cmdVerifyDrift exported)
- `/Users/jnuyens/src/gsd-plugin/bin/lib/verify-command-router.cjs` — FOUND (drift case present)
- `/Users/jnuyens/src/gsd-plugin/bin/lib/command-aliases.generated.cjs` — FOUND (verify.drift entry)
- `/Users/jnuyens/src/gsd-plugin/bin/lib/config-schema.cjs` — FOUND (workflow.drift_gate)
- `/Users/jnuyens/src/gsd-plugin/sdk/src/query/command-manifest.verify.ts` — FOUND (verify.drift)
- `/Users/jnuyens/src/gsd-plugin/sdk/src/query/config-schema.ts` — FOUND (workflow.drift_gate)
- `/Users/jnuyens/src/gsd-plugin/.github/workflows/check-drift.yml` — FOUND (drift-detectors job)

Commits confirmed present:
- `eeb3887` Task 1: cmdVerifyDrift + router case
- `d471078` Task 2: CJS/SDK parity + config keys + dist rebuild
- `9e6bb25` Task 3: CI drift-detectors job
