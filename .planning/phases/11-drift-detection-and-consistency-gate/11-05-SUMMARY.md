---
phase: 11-drift-detection-and-consistency-gate
plan: "05"
subsystem: workflows
tags: [drift, scan, audit-milestone, workflow, gate]
requirements-completed: [DRIFT-04, DRIFT-02]

dependency-graph:
  requires: [11-04]
  provides: [/gsd:scan --drift report surface, audit-milestone §5.6 drift gate]
  affects: [workflows/scan.md, workflows/audit-milestone.md]

tech-stack:
  added: []
  patterns: [config-flag-gate, non-agent-pure-compute, warn-first-gate, audit-yaml-extension]

key-files:
  created: []
  modified:
    - workflows/scan.md
    - workflows/audit-milestone.md

decisions:
  - "scan.md --drift parsed first (before --focus) to ensure it short-circuits the mapper path"
  - "suppressed pairs section always emitted (even when count=0) to satisfy D-07 auditability"
  - "audit-milestone §5.6 mirrors §5.5 Nyquist skeleton exactly for internal consistency"
  - "drift: overall field in audit YAML uses pass/warn/fail to avoid conflating with milestone status"

metrics:
  duration: 100s
  completed: "2026-06-27"
  tasks: 2
  files_modified: 2
---

# Phase 11 Plan 05: Drift Consumer Surface Wiring Summary

Surface `verify drift` (from 11-04) through two consumer workflows: `/gsd:scan --drift` ranked stdout report and `audit-milestone §5.6` opt-in warn-first gate.

## What Was Built

### Task 1: /gsd:scan --drift branch (commit 1c0f0ea)

Added a `--drift` mode to `workflows/scan.md` handled at the top of Step 1, before any focus validation or mapper-agent spawn:

- Mutually exclusive with `--focus` (different execution path entirely)
- Parses `--top N` (default 20) and optional `--fail-on-score N`
- Runs `gsd-tools verify drift --scope . --top {N} --json` (appends `--fail-on-score` only when supplied)
- If `skipped: true`: prints a one-line skip message and stops
- Otherwise renders ranked markdown report: header (composite score + counts), findings table (kind, file:line, severity), and a clearly-labelled "Suppressed (allowlisted) pairs" section (always present, D-07)
- No agent spawn, no `.planning/codebase/` writes

### Task 2: audit-milestone §5.6 Drift Integrity Gate (commit 8b93428)

Added `## 5.6. Drift Integrity Gate (opt-in)` to `workflows/audit-milestone.md` immediately after §5.5, mirroring the §5.5 skeleton:

- Reads `workflow.drift_gate` (absent/false = skip entirely, default OFF, D-05)
- Reads `workflow.drift_fail_on_score` for optional hard cutoff (D-06)
- Runs `gsd-tools verify drift --scope . [--fail-on-score N] --json`
- Reports findings with recommended-fix framing; suppressed list auditable (D-07)
- Adds `drift: { score, findings_count, suppressed_count, overall }` to audit YAML
- Notes that the committed `.gsd/drift-allowlist.json` suppresses the intentional CJS/SDK dual resolver so the gate does not trip on it (success criterion 1)
- "Never blocks the milestone" stated explicitly; hard cutoff requires `workflow.drift_fail_on_score` or explicit `--fail-on-score N` (D-06)

## Verification

All automated checks passed:

- `grep -- "--drift" workflows/scan.md` (4 matches)
- `grep "verify drift" workflows/scan.md` (5 matches)
- `grep -i "suppress" workflows/scan.md` (6 matches)
- `grep "Drift Integrity Gate" workflows/audit-milestone.md`
- `grep "workflow.drift_gate" workflows/audit-milestone.md`
- `grep "drift_fail_on_score" workflows/audit-milestone.md`
- `grep -i "never block" workflows/audit-milestone.md`

End-to-end: `node bin/gsd-tools.cjs verify drift --scope . --top 5 --json` returns valid JSON with `skipped: false`, confirming the command the workflow references is working on the gsd-plugin repo.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Coverage

T-11-08 (gate silently failing milestone): mitigated — `drift_gate` default OFF, hard cutoff never imposed by default.
T-11-10 (suppressed pairs hidden): mitigated — both surfaces render suppressed list as auditable section.
T-11-01 (flag tampering): mitigated — flags forwarded to `gsd-tools verify drift` which sanitizes.
T-11-SC (package installs): N/A — workflow-markdown only, zero packages.

## Self-Check: PASSED

- workflows/scan.md: committed at 1c0f0ea, modified lines confirmed
- workflows/audit-milestone.md: committed at 8b93428, §5.6 present
- Both commits exist in git log (verified via git show --stat)
