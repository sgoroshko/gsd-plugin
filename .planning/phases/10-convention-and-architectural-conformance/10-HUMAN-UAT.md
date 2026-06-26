---
status: partial
phase: 10-convention-and-architectural-conformance
source: [10-VERIFICATION.md]
started: 2026-06-26T17:00:00Z
updated: 2026-06-26T17:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Live /gsd:code-review surfaces a CONVENTION finding
expected: Run a real `/gsd:code-review` on a branch containing a deliberately convention-violating changed JS/TS file. An advisory CONVENTION-tier finding appears in REVIEW.md (states the deviation + the derived convention + a suggested fix) and does NOT block or gate the review.
result: [pending]

### 2. gsd-pattern-mapper writes the additive ## Conventions section
expected: Run gsd-pattern-mapper on the repo and inspect the resulting PATTERNS.md. An additive `## Conventions` section appears with the 4-axis table (Dominant / Share / Entropy / Status) and a Contested-hotspots note naming the CJS<->SDK dual resolver; the existing analog-mapping output is unchanged (D-02).
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
