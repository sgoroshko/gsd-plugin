---
title: auto_advance default-on (context-aware) + auto-escalate blocking gaps
date: 2026-06-20
priority: medium
scope: bigger than a prompt-collapse — all-user default change + verification routing
---

# auto_advance default + context-aware chain + gap auto-escalation

Part of the "less GSD housekeeping prompts" feature, but larger than the sub-class-2
collapses: this changes default behavior for ALL users and touches core routing +
the dual resolver. Plan/verify properly; do not free-hand.

## STATUS 2026-06-20: DONE. Ask 1 (B1-B4) + Ask 2 (B5) both shipped & committed.

Ask 2 (B5) shipped: per-gap severity (decided "precise"). The verifier already had
BLOCKER vs WARNING; it now writes `has_blocking_gaps` + per-gap `severity` to
VERIFICATION.md frontmatter (authoritative, fail-safe to blocking). `check.verification-status`
parses it (10 tests). `execute-phase` gaps_found AUTO-routes (blocking -> escalate
hand-off; minor-only -> park) with no prompt; inverse printed as a one-line override.
Anti-ballooning scope discipline preserved (only minor gaps park; blocking escalate
because they break the goal). Guard: `tests/gap-auto-routing.test.cjs`. Commit 05e69fa.
Whole feature is code-complete (Stream A commit 702a1e5, B1-B4 + this). Remaining:
RELEASE ceremony (version bump plugin.json + marketplace.json, README features row,
CHANGELOG, tag) when batched.

## STATUS 2026-06-20: Ask 1 DONE (B1-B4). Ask 2 (gaps, B5) still open.

Ask 1 shipped + verified: resolver default flipped in sync (CJS `config.cjs:176`,
`core.cjs:566`; SDK `config.ts:110`, `config-gates.ts:51`), SDK rebuilt (tsc),
`config-gates.test.ts` + `check-auto-mode.test.ts` expectations updated & passing,
CJS `loadConfig` functionally returns `auto_advance: true`. Context-aware routing in
`plan-phase.md` step 15 (cheap silent / big /clear) + `--no-auto`; discuss->plan
interactive-by-default in `chain.md`. Docs (`planning-config.md`, `settings.md`
recommendation flipped to Yes). Guard: `tests/auto-advance-context-aware.test.cjs`.
NOTE: pre-existing SDK failures unrelated to this work — `config-mutation` commit_docs
test + the whole golden subprocess-parity suite fail on baseline too (environmental).

## Ask 1 — auto_advance default true + `--no-auto` (decided: context-aware) [DONE]

User directive: "make auto_advance default and add --no-auto." Decided variant
(2026-06-20): **context-aware**, not blanket-silent.

- Flip default `false -> true` in BOTH resolvers (keep in sync, the known
  desync trap): `bin/lib/config.cjs:176`, `bin/lib/core.cjs:566`,
  `sdk/src/query/config-gates.ts:51`. **SDK edit needs a rebuild of sdk/dist**
  (gsd-sdk runs dist, not source) — and the installed shim is the cache, not the
  repo. Schema already lists `workflow.auto_advance`.
- Add `--no-auto` flag: plan-phase step 15 (`plan-phase.md:1615+`) and
  discuss-phase chain (`modes/chain.md`) -> force manual Next-Up, no advance.
- **Context-aware hand-off** (the reconciliation that keeps it safe):
  - plan->execute: `plan_count <= 2` -> silent `Skill(... --auto ...)` dispatch
    (current); `plan_count > 2` -> fall through to `offer_next` /clear hand-off
    (clean context + live wave checkpoints).
  - discuss->plan: config-default advance -> /clear hand-off (keeps plan-phase's
    scope prompts interactive, honoring the earlier "discuss -> resume plan
    interactive" decision); explicit `--chain`/`--auto` stays silent for power users.
  - Net effect is SMALL + safe: only cheap plan->execute boundaries auto-run
    silently; every heavy/interactive boundary keeps today's /clear hand-off.
- Constraint: keeping prompts live THROUGH dispatch (vs /clear hand-off) is still
  blocked by #1009 (see spike 001 probe). Context-aware sidesteps it by using the
  /clear hand-off for the interactive boundaries.

## Ask 2 — auto-run gap-closure when recommended

User: "gap-closure should auto-run without asking when it is recommended."
Current `execute-phase.md:1510-1576` gaps_found prompt recommends **Park**
STATICALLY (deliberate anti-ballooning — see scope-asymmetry decision). To
auto-follow "the recommendation," the recommendation must first become DYNAMIC:

- Need a structured per-gap **blocking** signal from the verifier / VERIFICATION.md
  (example had CR-01..03 critical/blocking vs WR-03 non-blocking — confirm the
  verifier emits this structurally, not just prose).
- Then: any blocking gap -> recommend + AUTO-RUN escalate (`/gsd:plan-phase {X}
  --gaps`); else -> AUTO-RUN park-to-backlog. Announce + "decide manually" escape.
  Only prompt when the blocking signal is absent/ambiguous.
- This IMPROVES scope discipline (non-blocking gaps auto-park, never escalate)
  while removing the rubber-stamp — reconciles with the park-default design.
- Chain tie-in: plan-phase step 15 "GAPS FOUND" should then auto-run --gaps for
  blocking gaps instead of stopping the chain.

## Recommended path

Plan as one increment (it's coherent): resolver flip + SDK rebuild, --no-auto,
context-aware routing, verifier blocking signal, dynamic gap recommendation,
tests for each, docs (`references/planning-config.md`). Ships as the next part of
the feature after the 2 already-done collapses.

Context: [[minimize-gsd-plumbing-interactions]] note,
[[project_less_housekeeping_prompts_release]] memory,
sibling collapses: [[auto-accept-recommended-default-prompts]].
