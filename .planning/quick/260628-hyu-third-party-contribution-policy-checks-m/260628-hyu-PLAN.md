---
quick_id: 260628-hyu
slug: third-party-contribution-policy-checks-m
date: 2026-06-28
type: quick
---

<objective>
Encode a standing policy for contributing to third-party (non-owned) repositories: run all feasible checks first, keep the patch minimal, produce a patch file, and hand it to the user for manual review before anything is submitted. Make it a durable, enforced convention (project CLAUDE.md) and a cross-session memory.
</objective>

<tasks>

<task>
  <name>Task 1: Add a "Third-Party Contributions" section to CLAUDE.md</name>
  <files>CLAUDE.md</files>
  <action>
    Add a "## Third-Party Contributions" section after "## GSD Workflow Enforcement" with the four-point policy: (1) run every feasible check first (target repo tests/lint/build), (2) minimal patch matching the target repo conventions, (3) produce a .patch file rather than pushing/PR-ing directly, (4) surface to the user for manual review and explicit approval before any submission; never auto-submit. No em-dashes.
  </action>
  <verify>CLAUDE.md contains the section with all four points.</verify>
</task>

<task>
  <name>Task 2: Save a feedback memory for cross-session persistence</name>
  <files>~/.claude/projects/.../memory/feedback_third_party_contribution_policy.md</files>
  <action>
    Write a feedback-type memory capturing the policy + why, link to reference_upstream_gsd_contribution, and add a MEMORY.md index line.
  </action>
  <verify>Memory file + MEMORY.md pointer exist.</verify>
</task>

</tasks>

<success_criteria>
- CLAUDE.md has the four-point third-party contribution policy
- Memory persists the policy for future sessions
- Patch-file + manual-review-before-submit is the documented default for non-owned repos
</success_criteria>
