---
status: complete
quick_id: 260628-3hr
date: 2026-06-28
---

# Quick Task 260628-3hr: wire checkpoint write-guards test into pre-release CI gate

**One-liner:** Made the issue #17 regression test a pre-release guarantee by running it in CI on every push and documenting the pre-release checklist in a new RELEASING.md.

## What Was Built

- **CI step** in `.github/workflows/check-drift.yml` `handoff-schema` job: `Run checkpoint write-guards test (regression for #17)` runs `node tests/checkpoint-write-guards.test.cjs`. CI runs on every push and PR, so the #17 failure mode now fails the build before any tag is cut.
- **RELEASING.md**: a pre-release checklist naming CI as the source-of-truth gate, listing the full node regression suite (including the #17 test), and the version-bump/tag/release steps.

## Context

This task was queued behind the `/gsd:debug 17` session, which found the root cause (no guards in `writeCheckpoint()`), applied the fix, and added the regression test `tests/checkpoint-write-guards.test.cjs` (8/8) in commit 79c5f63. This quick task closes the loop by making that test a pre-release gate rather than just a file in the tree.

## Verification

- `check-drift.yml` parses (PyYAML); the new step references the real test.
- `node tests/checkpoint-write-guards.test.cjs` exits 0 (8/8).
- `tests/session-start-skip-trivial-handoff.test.cjs` still 6/6 (no regression).
- RELEASING.md contains no em-dashes (project rule).

## Self-Check: PASSED

- CI step present: FOUND (check-drift.yml:32)
- RELEASING.md exists and references the #17 test + version-bump/tag steps: CONFIRMED
- Regression test green: CONFIRMED
