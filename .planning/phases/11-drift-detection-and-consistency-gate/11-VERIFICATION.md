---
phase: 11-drift-detection-and-consistency-gate
verified: 2026-06-27T10:15:00Z
status: human_needed
score: 5/5 must-haves verified
has_blocking_gaps: false
re_verification:
  previous_status: gaps_found
  previous_score: 3/5
  gaps_closed:
    - "audit-milestone runs an optional, config-gated integrity gate that the intentional CJS<->SDK dual resolver does NOT trip (allowlist suppresses it)"
    - "CJS<->SDK dual resolver never trips the gate"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Confirm the cron entry and ~/.vibedrift-last-known-version seed are installed on the maintainer's machine (or explicitly deferred per Plan 11-03 Task 3)."
    expected: "bash ~/claude-code-gsd/check-vibedrift-release.sh returns exit=0 with no email sent."
    why_human: "Touches maintainer machine state; cannot verify programmatically from the repo."
---

# Phase 11: Drift Detection and Consistency Gate Verification Report

**Phase Goal:** Surface existing cross-session drift repo-wide and gate the pre-1.0 release ceremony. Detection is 100% native (D-01/D-04 retired the "fallback" framing): three native layers (Phase 10 conventions reuse + phantom/placeholder + MinHash+LCS structural-dup) are the primary sweep, and VibeDrift is treated as a second upstream whose heuristics are ported and watched, never invoked.
**Verified:** 2026-06-27T10:15:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (globMatch `**` fix in bin/lib/semantic-dup.cjs)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | audit-milestone runs an optional, config-gated integrity gate that the intentional CJS<->SDK dual resolver does NOT trip (allowlist suppresses it) | VERIFIED | `node bin/gsd-tools.cjs verify drift --scope . --json` exits 0, suppressed:21, cross-resolver pairs in findings:0. All 21 bin/lib<->sdk/src pairs land in suppressed with correct reason text. |
| 2 | /gsd:scan --drift produces a ranked drift report | VERIFIED | workflows/scan.md lines 38-84 document a --drift branch running gsd-tools verify drift; command exits 0 and returns 149 ranked findings |
| 3 | Native-primary: sweep runs entirely via native checks (zero runtime dep, VibeDrift never invoked at runtime) | VERIFIED | bin/check-vibedrift-release.sh is confirmed ops/cron-only (not on any GSD workflow path); no exec/spawn of vibedrift in gsd-tools.cjs; all three detectors are pure Node.js with no external package deps |
| 4 | /gsd:scan --drift branch does NOT spawn the codebase-mapper agent | VERIFIED | workflows/scan.md line 42: "Do NOT spawn gsd-codebase-mapper, Do NOT write to .planning/codebase/" |
| 5 | CJS<->SDK dual resolver never trips the gate | VERIFIED | verify drift --json: suppressed:21, cross-resolver in findings:0. globMatch `**` fix confirmed: escapes special chars first (excluding *), then replaces `**` with `__DSTAR__`, then `*` with `[^/]*`, then `__DSTAR__` with `.*`. sdk/src/query/*.ts paths now correctly matched and suppressed. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `bin/lib/semantic-dup.cjs` | MinHash+LCS near-clone detector (min 150 lines) | WIRED | 468 lines; exports detect, buildShingles, minHashSignature, findLshCandidatePairs, lcsSimilarity, findDuplicatePairs; required by verify.cjs cmdVerifyDrift; globMatch() now correctly handles `**` |
| `bin/lib/phantom-scaffolding.cjs` | CRUD-export-never-routed + placeholder detector (min 120 lines) | WIRED | 433 lines; exports detect, extractExports, extractImportedNames, classifyVerb; required by verify.cjs |
| `bin/lib/drift-allowlist.cjs` | Never-throw loader + pair suppression (min 50 lines) | WIRED | 161 lines; exports load, isSuppressed; required by verify.cjs |
| `.gsd/drift-allowlist.json` | Committed pre-seeded allowlist with bin/lib<->sdk/src rule | VERIFIED | Parses as valid JSON; contains intentional entry with a:bin/lib/**, b:sdk/src/**, reason present |
| `.vibedriftignore` | Portable gitignore-syntax path exclusions | VERIFIED | File present; loaded by drift-allowlist.cjs |
| `bin/check-vibedrift-release.sh` | Standalone second-upstream release watch (D-02) | VERIFIED | Syntax valid (bash -n passes); executable; references @vibedrift/cli (scoped); VERSION_FILE=$HOME/.vibedrift-last-known-version; first-run seed-and-exit present; offline guards with || exit 0 |
| `tests/semantic-dup.test.cjs` | Unit tests for near-clone detection (min 80 lines) | VERIFIED | 362 lines; 19 checks all pass (including new multi-level `**` suppression test at line 319); exits 0 |
| `tests/phantom-scaffolding.test.cjs` | Unit tests for phantom + placeholder (min 70 lines) | VERIFIED | 281 lines; 16 checks all pass; exits 0 |
| `tests/drift-allowlist.test.cjs` | Unit tests for loader never-throw + suppression (min 50 lines) | VERIFIED | 122 lines; 8 checks all pass; exits 0 |
| `bin/lib/verify.cjs` | cmdVerifyDrift handler | VERIFIED | Function at line 1563; exported at line 1722; composes all three detectors |
| `bin/lib/verify-command-router.cjs` | drift subcommand route | VERIFIED | Line 39: else if (subcommand === 'drift') |
| `bin/lib/config-schema.cjs` | workflow.drift_gate + workflow.drift_fail_on_score | VERIFIED | Lines 46-47 |
| `sdk/src/query/config-schema.ts` | Same two keys (SDK parity) | VERIFIED | Lines 48-49 |
| `sdk/src/query/command-manifest.verify.ts` | verify.drift entry | VERIFIED | Line 16: 'verify.drift', aliases ['verify drift'] |
| `bin/lib/command-aliases.generated.cjs` | verify.drift in CJS generated aliases | VERIFIED | Lines 251-255: canonical verify.drift, subcommand drift |
| `sdk/src/query/command-aliases.generated.ts` | verify.drift in SDK generated aliases | VERIFIED | Line 47 |
| `.github/workflows/check-drift.yml` | drift-detectors CI job (zero-dep) | VERIFIED | Lines 66-82; no npm ci in drift-detectors job; runs three test files + smoke test |
| `workflows/scan.md` | --drift non-agent branch | VERIFIED | Lines 21, 38-84; suppressed section documented (lines 72-82) |
| `workflows/audit-milestone.md` | §5.6 Drift Integrity Gate | VERIFIED | Lines 165-202; OFF by default; drift_gate config read; never-blocks prose present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| tests/semantic-dup.test.cjs | bin/lib/semantic-dup.cjs | require('../bin/lib/semantic-dup.cjs') | WIRED | Confirmed |
| bin/lib/semantic-dup.cjs | bin/lib/conventions.cjs blankSpans | require('./conventions.cjs').blankSpans | WIRED | line 273: blanked = conventions.blankSpans(src) |
| bin/lib/semantic-dup.cjs | PERM_SEEDS / deterministic | FNV-1a seeded table, no Math.random | WIRED | Math.random appears only in comments; PERM_SEEDS constant at line 49 |
| bin/lib/drift-allowlist.cjs | .gsd/drift-allowlist.json | fs.readFileSync path.resolve(cwd, .gsd/drift-allowlist.json) | WIRED | Confirmed in load() |
| tests/phantom-scaffolding.test.cjs | bin/lib/phantom-scaffolding.cjs | require('../bin/lib/phantom-scaffolding.cjs') | WIRED | Confirmed |
| bin/lib/verify-command-router.cjs | verify.cmdVerifyDrift | subcommand === 'drift' dispatch | WIRED | Line 39 |
| bin/lib/verify.cjs cmdVerifyDrift | semantic-dup + phantom-scaffolding + drift-allowlist | require() calls inside cmdVerifyDrift | WIRED | Lines 1593, 1602, 1610 |
| workflows/scan.md --drift branch | gsd-tools verify drift | Bash: gsd-tools verify drift --scope . --top N --json | WIRED | Lines 50, 84 |
| workflows/audit-milestone.md §5.6 | workflow.drift_gate config + verify drift | config-get + verify drift --json | WIRED | Lines 170, 178, 182 |
| bin/lib/semantic-dup.cjs allowlist suppression | .gsd/drift-allowlist.json intentional pairs | globMatch() applied to pair files vs allow.pairs entries | WIRED | Fixed: globMatch() now correctly translates ** to .* (escaping non-star chars first, then ** to __DSTAR__, then * to [^/]*, then __DSTAR__ to .*). Confirmed: suppressed:21, cross-resolver in findings:0 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| bin/lib/verify.cjs cmdVerifyDrift | dupResult.pairs, dupResult.suppressed | semantic-dup.detect(corpus, {cwd, allow}) | Yes (real MinHash+LCS) | FLOWING — suppressed:21 confirmed |
| bin/lib/verify.cjs cmdVerifyDrift | phantomResult.findings | phantom-scaffolding.detect(corpus, {cwd}) | Yes (real CRUD + placeholder scan) | FLOWING |
| workflows/audit-milestone.md §5.6 | DRIFT_JSON | gsd-tools verify drift --json | Yes (live detector output) | FLOWING — suppressed section now accurate with 21 cross-resolver pairs |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| verify drift emits valid JSON, exits 0 | node bin/gsd-tools.cjs verify drift --scope . --json | score:0, findings:149, suppressed:21, exit:0 | PASS |
| suppressed > 0, cross-resolver in findings = 0 | verify drift --json parse | suppressed:21, cross-resolver in findings:0 | PASS |
| --fail-on-score 999 exits 1 | node bin/gsd-tools.cjs verify drift --scope . --json --fail-on-score 999 | exit 1 | PASS |
| semantic-dup tests pass (19 checks) | node tests/semantic-dup.test.cjs | 19 checks passed including new multi-level ** test | PASS |
| phantom-scaffolding tests pass | node tests/phantom-scaffolding.test.cjs | 16 checks passed | PASS |
| drift-allowlist tests pass | node tests/drift-allowlist.test.cjs | 8 checks passed | PASS |
| Multi-level ** glob suppresses sdk/src/query/ paths | tests/semantic-dup.test.cjs check "DRIFT-03: ** allow pattern..." | ok | PASS |
| globMatch ** correctness in semantic-dup.cjs | lines 342-346: escape non-star chars, then ** -> __DSTAR__, then * -> [^/]*, then __DSTAR__ -> .* | Implementation verified in code | PASS |
| bin/check-vibedrift-release.sh syntax valid + executable | bash -n + test -x | SYNTAX_OK, EXECUTABLE_OK | PASS |
| unknown subcommand help lists drift | node bin/gsd-tools.cjs verify foo 2>&1 | grep -i drift | "Available: ... drift" | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DRIFT-01 | 11-03, 11-04 | VibeDrift as second upstream; GSD never calls vibedrift CLI at runtime; CJS<->SDK parity for new subcommand | SATISFIED | check-vibedrift-release.sh is ops-only; no exec of vibedrift in runtime path; verify.drift registered in both resolvers |
| DRIFT-02 | 11-05 | audit-milestone opt-in, warn-first gate with recommended-fix framing; --fail-on-score explicit only | SATISFIED | audit-milestone.md §5.6 is OFF by default; drift_gate config gate; never blocks statement present |
| DRIFT-03 | 11-02 | Committed auditable allowlist; suppresses CJS<->SDK dual resolver; suppressed pairs visible in report | SATISFIED | .gsd/drift-allowlist.json committed and correct; globMatch() now correctly handles ** multi-level paths; verify drift --json returns suppressed:21 with all cross-resolver pairs suppressed; 0 in findings |
| DRIFT-04 | 11-04, 11-05 | /gsd:scan --drift produces ranked top-N markdown report; no agent spawn | SATISFIED | workflows/scan.md --drift branch documented; verify drift command works and produces ranked JSON |
| DRIFT-05 | 11-01, 11-02, 11-04 | Three native detection layers as primary sweep (conventions reuse + phantom/placeholder + MinHash+LCS); zero runtime dep | SATISFIED | All three detectors implemented, wired via cmdVerifyDrift, zero external package deps |

### Anti-Patterns Found

No new anti-patterns found in the fixed file. bin/lib/semantic-dup.cjs has no TBD/FIXME/XXX markers. The previously-blocking globMatch bug is resolved.

### Human Verification Required

### 1. Cron install for check-vibedrift-release.sh

**Test:** Confirm the cron entry and ~/.vibedrift-last-known-version seed are installed on the maintainer's machine (or explicitly deferred per Plan 11-03 Task 3).
**Expected:** bash ~/claude-code-gsd/check-vibedrift-release.sh returns exit=0 with no email sent.
**Why human:** Touches maintainer machine state; cannot verify programmatically from the repo.

### Gaps Summary

No gaps. The single blocking gap from the initial verification (globMatch `**` bug in bin/lib/semantic-dup.cjs) is resolved.

**Fix applied (commit fix(11-01)):** globMatch() now escapes special regex characters excluding `*` in step 1 (using `/[.+^${}()|[\]\\]/g`), then replaces `**` with `__DSTAR__` before replacing single `*` with `[^/]*`, then restores `__DSTAR__` as `.*`. This correctly handles multi-level paths: `sdk/src/**` now matches `sdk/src/query/dup-b.ts`.

**Regression test (commit test(11-01)):** tests/semantic-dup.test.cjs check "DRIFT-03: `**` allow pattern suppresses a pair nested more than one level deep" (line 319) uses `deepCorpus = ['bin/lib/dup-a.cjs', 'sdk/src/query/dup-b.ts']` with allowlist entry `{ a: 'bin/lib/**', b: 'sdk/src/**' }` and asserts `suppressed.length >= 1` and `pairs.length === 0`. Passes (19/19 checks).

**End-to-end confirmation:** `node bin/gsd-tools.cjs verify drift --scope . --json` returns `suppressed:21`, `cross-resolver in findings:0`, exit code 0. The intentional CJS<->SDK dual resolver does not trip the gate.

---

_Verified: 2026-06-27T10:15:00Z_
_Verifier: Claude (gsd-verifier)_
