---
status: complete
quick_id: 260628-hyu
date: 2026-06-28
---

# Quick Task 260628-hyu: third-party contribution policy

**One-liner:** Encoded a standing policy for contributing to non-owned repos (run all feasible checks, minimal patch, produce a patch file, manual review before submit) in the project CLAUDE.md and as a cross-session memory.

## What Was Built

- **CLAUDE.md** `## Third-Party Contributions` section (after GSD Workflow Enforcement): the four-point policy, enforced every session.
- **Memory** `feedback_third_party_contribution_policy` + MEMORY.md index line, so the policy persists for future sessions and links to the upstream-contribution stance.

## The policy

For any repo the user does not own (upstream gsd-core, VibeDrift, workspace.json spec, external repos):
1. Run every feasible check first (target repo tests/lint/build), report what passed and what could not run.
2. Keep the patch minimal, matching the target repo's conventions.
3. Produce a `.patch` file instead of pushing or opening a PR directly.
4. Hand it to the user for manual review and explicit approval before any submission. Never auto-submit.

## Verification

- CLAUDE.md contains the section with all four points (no em-dashes).
- Memory file + MEMORY.md pointer created.

## Self-Check: PASSED

- CLAUDE.md `## Third-Party Contributions`: FOUND (line 48)
- Memory `feedback_third_party_contribution_policy` + index: CONFIRMED
