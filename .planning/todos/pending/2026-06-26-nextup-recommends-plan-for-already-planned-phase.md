---
created: 2026-06-26T18:40:00.000Z
title: Next-Up recap recommends plan-phase for an already-planned phase (should recommend execute-phase)
area: ux
files:
  - references/continuation-format.md
  - workflows/plan-phase.md (offer_next / Next-Up block)
  - workflows/execute-phase.md (offer_next step)
  - workflows/transition.md
  - skills/*/SKILL.md (output_format Next-Up blocks)
---

## Problem

The Next-Up / recap generator can recommend `/gsd:plan-phase N` for a phase that
**already has a `N-PLAN.md`**, where the correct next verb is `/gsd:execute-phase N`.

Observed in the field (pmt.linuxbe.com / Proxmox migration toolkit, 2026-06-26):
the session status table correctly said *"awaiting `/gsd:plan-phase 21/22` +
`/gsd:execute-phase 20`"* (Phase 20 had a PLAN.md ready, 21/22 had CONTEXT only),
but the recap footer immediately below contradicted it with *"Next: `/clear` then
`/gsd:plan-phase 20`"* — telling the user to re-plan a phase that was already
planned. The contradiction made "which phase do I plan, 20/21/22?" genuinely
ambiguous and the user couldn't tell which guidance was authoritative.

Impact: contradictory next-step guidance at the plan->execute boundary. A user
who follows the footer re-plans completed planning work (or, worse, the planner's
closed-phase/existing-plan gate fires and they think GSD is broken). This is
exactly the kind of cross-session "which command next?" drift that erodes trust
in the recap.

## Solution

TBD — reconcile the recommended verb against on-disk plan state before emitting it:

- The Next-Up recommender MUST check `has_plans` / the presence of `{N}-PLAN.md`
  for the target phase. If a phase already has a plan and is not yet executed,
  the recommended next step is `/gsd:execute-phase N`, NEVER `/gsd:plan-phase N`.
- When several phases are in flight (some planned-not-executed, some context-only),
  the recap should disambiguate per phase rather than emit a single bare
  `plan-phase N` line — e.g. "execute 20 (planned) / plan 21, 22 (context only)".
- Make the table and the footer consistent: they are generated from the same
  phase state, so the footer should never contradict the table above it. Consider
  deriving the footer line FROM the table rather than independently.
- Candidate single source of truth: a `gsd-sdk query` verb that returns, per phase,
  the correct next verb (plan | execute | discuss | done) from on-disk artifacts,
  consumed by every Next-Up block instead of each workflow re-deriving it.

Cross-AI/cross-session UX defect; not tied to a milestone. Good fit for a v1.x
recap-hardening pass alongside the other Next-Up / recommended-default todos
(see auto-accept-recommended-default-prompts, auto-advance-default-and-gap-escalation).
