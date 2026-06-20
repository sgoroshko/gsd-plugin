---
title: Generalize next.md's SlashCommand forward-chaining as the standard for upstream-artifact gates
trigger_condition: when next touching orchestrator handoffs or any "upstream artifact missing -> run other command" gate
planted_date: 2026-06-19
---

# SlashCommand forward-chaining pattern

`workflows/next.md:170` auto-invokes the next command via SlashCommand
(`"Then invoke via SlashCommand. Do not continue."`) with zero manual re-run.
Multiple other workflows instead **dead-end and tell the user to run a command
then come back** (plan-phase's CONTEXT.md and UI-SPEC.md gates are the clearest;
there may be more once the audit is widened).

When forward-chaining proves safe (pending the #1009 / SlashCommand-re-dispatch
question — see [[collapse-plan-phase-upstream-gates]]), promote next.md's
auto-invoke into a documented standard pattern: any "required upstream artifact
is missing" gate should either auto-chain via SlashCommand or hand off via
HANDOFF.json auto-resume — never leave the user to manually re-run the
downstream command.

Why a seed not a todo: the generalization is only worth doing once the pilot fix
(plan-phase) validates the mechanism. Proving the pattern once de-risks the rest.

Context: [[minimize-gsd-plumbing-interactions]] (note, 3-bucket rule + audit).
