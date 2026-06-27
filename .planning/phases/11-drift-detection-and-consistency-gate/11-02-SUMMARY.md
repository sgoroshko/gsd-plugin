---
phase: 11-drift-detection-and-consistency-gate
plan: "02"
subsystem: bin/lib
tags: [drift-detection, phantom-scaffolding, allowlist, tdd, zero-dep, never-throw]
dependency_graph:
  requires: []
  provides:
    - bin/lib/phantom-scaffolding.cjs
    - bin/lib/drift-allowlist.cjs
    - .gsd/drift-allowlist.json
    - .vibedriftignore
    - tests/phantom-scaffolding.test.cjs
    - tests/drift-allowlist.test.cjs
  affects:
    - Plan 11-04 (cmdVerifyDrift calls phantom.detect() and allowlist.load())
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN per task
    - Never-throw + skipped-sentinel (mirrors conventions.cjs)
    - blankSpans string-safety pre-pass (reuse conventions.cjs.blankSpans)
    - Single-pass imported-names Set (Pitfall 3, linear not O(files^2))
    - Symmetric glob-prefix pair matching (.** at end of pattern)
key_files:
  created:
    - bin/lib/phantom-scaffolding.cjs
    - bin/lib/drift-allowlist.cjs
    - .gsd/drift-allowlist.json
    - .vibedriftignore
    - tests/phantom-scaffolding.test.cjs
    - tests/drift-allowlist.test.cjs
  modified: []
decisions:
  - "blankSpans blanks both strings AND comments; placeholder TODO detection checks the original source for comment-form TODO using a comment-matching regex, then uses blankSpans on the function body for return-value detection (string-safe)"
  - "glob ** at end of pattern translates to .* (matches any file in subtree) not (?:.*/)?$ which would require a trailing slash"
  - "TODO in a comment above a function (not inside the body) is detected by searching a 200-char pre-function window in the original source"
metrics:
  duration_seconds: 415
  completed_date: "2026-06-27"
  tasks_completed: 2
  files_created: 6
---

# Phase 11 Plan 02: Drift Allowlist + Phantom Scaffolding Detector Summary

Shipped the two DRIFT-03/DRIFT-05 building blocks independent of Plan 11-01: `bin/lib/drift-allowlist.cjs` (never-throw loader + symmetric pair suppression) and `bin/lib/phantom-scaffolding.cjs` (CRUD-export-never-routed + placeholder-stub detector), plus committed data files and tests. Both follow TDD: RED commit (failing tests), then GREEN commit (implementation).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | drift-allowlist (RED) | 86eb9a5 | tests/drift-allowlist.test.cjs |
| 1 | drift-allowlist (GREEN) | a5663c0 | bin/lib/drift-allowlist.cjs, .gsd/drift-allowlist.json, .vibedriftignore |
| 2 | phantom-scaffolding (RED) | 16f75f3 | tests/phantom-scaffolding.test.cjs |
| 2 | phantom-scaffolding (GREEN) | 30f2941 | bin/lib/phantom-scaffolding.cjs |

## What Was Built

### bin/lib/drift-allowlist.cjs
Never-throw loader + symmetric suppression matcher (DRIFT-03). `load(cwd)` reads `.gsd/drift-allowlist.json` (pair-allowlist) and `.vibedriftignore` (portable gitignore-syntax exclusions) in separate try/catch blocks; returns `{ pairs:[], ignore:[] }` on any missing/malformed file. `isSuppressed(fileA, fileB, allow)` tests each pair entry with a glob matcher that handles `**` (at end of pattern = match entire subtree) and `*` (non-slash run); matching is symmetric so `(A,B)` and `(B,A)` both suppress.

### .gsd/drift-allowlist.json
Pre-seeded committed allowlist (DRIFT-03, D-07 auditability): contains the `bin/lib/**` <-> `sdk/src/**` intentional-pair rule for the two-resolver split. Verified by `JSON.parse` acceptance test.

### .vibedriftignore
Portable gitignore-syntax path exclusions: `node_modules/`, `dist/`, `build/`, `coverage/`, `sdk/dist/`, `**/*.test.cjs`, `tests/drift-baseline.json`.

### bin/lib/phantom-scaffolding.cjs
CRUD-export-never-routed + placeholder-stub detector (DRIFT-05 layer 2). Key design choices:
- **Single-pass import graph**: builds a flat `Set` of all imported names across the ENTIRE corpus in one pass before doing per-file export analysis (Pitfall 3, linear).
- **ESM + CJS coverage**: `IMPORT_PATTERNS` covers `import { x } from`, `import x from`, `import * as ns from`, `const { x } = require(...)`, and `const x = require(...)`.
- **D-09 compliance**: only CRUD-verb-named exports are flagged as phantom; non-CRUD unused exports are never emitted.
- **blankSpans string-safety**: `return null` inside a string is not detected (blanked source used for return scan); TODO inside a string is not detected (original-source comment-regex check ensures the TODO was in a comment, not a string literal).
- **Placeholder window scan**: the TODO comment may appear ABOVE the function declaration (common style); a 200-char pre-function window of original source is checked for comment-form TODO.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Block comment doc contained `**/` sequences terminating block comment early**
- **Found during:** Task 1 GREEN (first run of drift-allowlist.cjs)
- **Issue:** `/** ... prefix/**/glob-star ... */` doc comment had `*/` inside which terminated the `/**` block early, causing a SyntaxError
- **Fix:** Rewrote the doc comment to describe glob-star without using the `/**/` sequence
- **Files modified:** bin/lib/drift-allowlist.cjs
- **Commit:** included in a5663c0

**2. [Rule 1 - Bug] Glob `**` at end translated to `(?:.*/)?` which required trailing slash**
- **Found during:** Task 1 GREEN (isSuppressed failing tests)
- **Issue:** `bin/lib/**` was generating regex `^bin\/lib\/(?:.*\/)?$` which only matched paths ending in `/` (directories), not files like `bin/lib/x.cjs`
- **Fix:** When `**` appears at end of the glob pattern (no characters after the optional trailing slash), translate to `.*` instead of `(?:.*/)?`
- **Files modified:** bin/lib/drift-allowlist.cjs
- **Commit:** included in a5663c0

**3. [Rule 1 - Bug] blankSpans blanks comment-TODO preventing placeholder detection**
- **Found during:** Task 2 GREEN (placeholder tests failing)
- **Issue:** `conventions.blankSpans` blanks both string contents AND comment contents. Checking the blanked source for TODO meant comment-form TODOs (which should trigger placeholder detection) were invisible
- **Fix:** Placeholder detection uses a comment-matching regex against the ORIGINAL source to detect TODO-in-comment, and uses the blanked source only for the placeholder-return detection. A 200-char window before the function declaration captures the `// TODO: implement this` pattern common in stubs
- **Files modified:** bin/lib/phantom-scaffolding.cjs
- **Commit:** included in 30f2941

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (drift-allowlist tests) | 86eb9a5 | PASS -- tests fail because module not found |
| GREEN (drift-allowlist impl) | a5663c0 | PASS -- 8/8 checks pass |
| RED (phantom-scaffolding tests) | 16f75f3 | PASS -- tests fail because module not found |
| GREEN (phantom-scaffolding impl) | 30f2941 | PASS -- 16/16 checks pass |

## Self-Check

### Files Created

- [x] bin/lib/drift-allowlist.cjs
- [x] bin/lib/phantom-scaffolding.cjs
- [x] .gsd/drift-allowlist.json
- [x] .vibedriftignore
- [x] tests/drift-allowlist.test.cjs
- [x] tests/phantom-scaffolding.test.cjs

### Commits

- [x] 86eb9a5 (test drift-allowlist RED)
- [x] a5663c0 (feat drift-allowlist GREEN)
- [x] 16f75f3 (test phantom-scaffolding RED)
- [x] 30f2941 (feat phantom-scaffolding GREEN)

### Known Stubs

None. All exported functions are fully implemented and tested.

### Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. All mitigations from the plan threat model are implemented (path sanitization via conventions.cjs.sanitizePaths, MAX_SCAN_BYTES cap, never-throw contracts, blankSpans string-safety).

## Self-Check: PASSED
