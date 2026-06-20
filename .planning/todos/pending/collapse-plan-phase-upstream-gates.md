---
title: Collapse plan-phase's two upstream-artifact dead-ends into auto-chaining
date: 2026-06-19
priority: medium
decided: 2026-06-19 — "Discuss → resume plan interactive" (keep BOTH discussion and plan-phase prompts live)
---

# Collapse plan-phase upstream-artifact gates

plan-phase has two happy-path dead-ends that force a manual round-trip (run the
upstream command, then manually re-run plan-phase). Replace the bounce-back so
the user only does the build-work (the discussion / UI spec), never the plumbing
re-entry — AND keep plan-phase's own scope-decision prompts interactive.

## Targets

- `workflows/plan-phase.md:335-375` — missing CONTEXT.md -> discuss-phase round-trip
- `workflows/plan-phase.md:672-680` — missing UI-SPEC.md -> ui-phase round-trip

Same anti-pattern; fix together.

## Chosen approach (decided 2026-06-19)

**"Discuss → resume plan interactive."** The discussion stays top-level
interactive (required — #1009), and plan-phase ALSO runs with its prompts live
afterward. This RULES OUT the simple `--chain`/`--auto` path, because `--auto`
suppresses plan-phase's prompts (`discuss-phase.md:345`, `plan-phase.md:24`).
The existing `chain.md` flow (discuss interactive -> `Skill(plan-phase, --auto)`)
is therefore NOT sufficient on its own — it would default plan-phase's
source-audit / scope-prioritization decisions.

Implication: keeping plan-phase interactive after the discussion needs one of:
- **(b) HANDOFF/resume (guaranteed):** discuss-phase writes HANDOFF.json
  `{next: plan-phase N}` -> user `/clear` -> SessionStart/resume-work relaunches
  plan-phase as a TOP-LEVEL command (interactive prompts work). Costs one /clear,
  which also serves context hygiene (sheds the discussion transcript before the
  planner runs). Works regardless of #1009.
- **(a) seamless upgrade (only if #1009 is stale):** dispatch plan-phase via
  SlashCommand/Skill WITHOUT --auto and have its prompts survive. Removes the
  /clear entirely. Gated on the empirical test below.

## Steps

1. **Run the #1009-currency probe FIRST** (spike 001 Open Question / aq-probe).
   It decides seamless (a) vs one-/clear (b). If stale -> build (a). If real ->
   build (b).
2. Implement the chosen re-entry for BOTH gates identically. Keep the "discuss
   first vs continue without context" choice (it's a build decision).
3. Ensure plan-phase, on resume, does NOT carry --auto (prompts must stay live).
4. Add/extend a test guarding that neither gate re-introduces a bare manual
   "re-run /gsd:plan-phase" round-trip, and that the resume path does not pin
   --auto onto plan-phase.

Context: [[minimize-gsd-plumbing-interactions]] (note),
spike 001 (`.planning/spikes/001-slashcommand-rechain-askuserquestion/`).
Pattern to generalize: [[slashcommand-forward-chaining-pattern]] (seed).
