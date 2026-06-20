---
title: Convert "(Recommended)"-default rubber-stamp prompts into announced auto-actions
date: 2026-06-19
priority: medium
---

# Auto-accept "(Recommended)"-default prompts

A class of GSD prompts blocks on a choice where one option is already marked
`(Recommended)` and the action is reversible/low-stakes. The label is the tell:
if GSD is confident enough to recommend, making the user press enter on it is
plumbing, not a build decision. Convert these to: DO the recommended thing,
announce it, keep it overridable — block only when genuinely ambiguous or
irreversible.

## SCOPE GUARD (read first — this bounds the whole todo)

Collapse ONLY prompts that decide **how the GSD workflow runs** (process /
plumbing: research-or-not, continue-or-capture, resume hand-offs). NEVER collapse
**discussion-like prompts that decide WHAT gets built** (design choices,
gray-area resolution, scope prioritization, which-approach) — those stay fully
interactive even with a `(Recommended)` option; the recommendation is a hint, not
a default. Discriminator before touching any prompt: "does this change the
product, or just GSD's own process?" Product -> LEAVE IT. Process -> candidate.

## Anchor example — SHIPPED 2026-06-19 (first increment of the release feature)

`workflows/plan-phase.md` research gate marked "Research first" `(Recommended)`
**unconditionally**, so the prompt carried no signal. DONE:
- When no `--research`/`--skip-research` flag and not `--auto`: the blocking
  AskUserQuestion is removed; the gate now honors the EXISTING `workflow.research`
  config (`research_enabled`, default `true`) and auto-researches with an
  announced `[research] Auto (...)` line. `workflow.research=false` skips by default.
- Reused `workflow.research` — deliberately NO new knob (avoids redundancy +
  config-schema/docs churn across the dual CJS/SDK resolvers).
- `--research` / `--skip-research` remain the per-run escapes.
- Guard: `tests/research-prompt-autofollow.test.cjs`.

Note: dropped the "ask me each time" mode (a new tri-state knob would have
duplicated `workflow.research`). Flags cover per-run choice; revisit only if a
user actually wants a persistent "always prompt" preference.

## Then sweep the class — CLASSIFIED 2026-06-20

`(Recommended)` appears in ~14 workflows, but scope-guarded the actionable set is
SMALL. Decisive cut: **collapse runtime flow-control gates; KEEP configuration
surfaces** (where choosing IS the task) and build/irreversible prompts.

- **DONE (clean runtime collapses):** plan-phase research gate; discuss-phase
  "explore more / ready for context?" gate.
- **Already non-blocking (no-op):** `ui-phase.md:71`, `ai-integration-phase.md:67`
  "Recommended: run discuss-phase first" — both print a note and Continue; not prompts.
- **Round-trip class -> Stream B / [[collapse-plan-phase-upstream-gates]]:**
  plan-phase CONTEXT-missing gate (335-375) and UI-SPEC-missing gate (653-665).
  These recommend RUNNING an upstream command (discuss/ui-phase) + exit, so
  "auto-follow" = the chain/handoff machinery, not a simple proceed. NOTE: 3.5.0's
  UI-SPEC gate recommends RUN (not Skip); matching the user's "Skip (Recommended)"
  example needs ADDED dynamic skip-vs-run computation (like gaps) -> Stream B.
- **gaps-handling** (`execute-phase.md:1533`) -> Stream B (dynamic blocking signal),
  see [[auto-advance-default-and-gap-escalation]].
- **KEEP — configuration surfaces:** all of `settings.md` (30+ hits — the customize
  surface), `settings-integrations.md`. Collapsing these defeats their purpose.
- **KEEP — build / irreversible:** `complete-milestone.md:643` squash-merge,
  `new-ddd.md:185` approve-SPEC, `do.md`/`new-project.md` approach selection.
- **DONE 2026-06-20 — new-project setup gauntlet -> single defaults gate.** The
  "Use these defaults?" gate (new-project.md:504) already existed but only fired
  when `~/.gsd/defaults.json` existed; first-time users fell through to the ~8-question
  gauntlet. Fix: seed built-in **recommended defaults** (mode yolo, granularity
  coarse, parallel, commit_docs, balanced, research/plan_check/verifier yes) when no
  saved file exists, so the single gate fires for everyone. "Modify"/"Configure fresh"
  still fully customize. Removed the doesn't-exist gauntlet fall-through. Guard added
  to `tests/housekeeping-prompt-reduction.test.cjs`. (new-milestone has only 1
  `(Recommended)` prompt, no gauntlet — left as-is.)

Net: **Stream A is DONE** — 3 collapses shipped (research, discuss "ready?",
new-project gauntlet). Everything else is Stream B (round-trip/dynamic-rec gates,
gaps) or correctly KEPT (settings, build/irreversible).

Per-prompt classification rule (retained):

### General rule (covers all confirmed examples)

Wherever a **process** prompt already marks one option `(Recommended)`, auto-select
that option, announce it, keep a one-step escape — do not block. Works for both
static recommendations (research: always "research") and dynamic ones (UI-SPEC,
gaps: the workflow already computed the recommendation from phase signals).

### Confirmed process targets (from user examples, 2026-06-19/20)

- **DONE** — plan-phase research gate (static "research" rec).
- **DONE** — discuss-phase "explore more / ready for context?" gate.
- **UI-SPEC gate** (`plan-phase.md:672-680`) — "Skip UI-SPEC, plan now
  (Recommended)" with a *computed* rec (e.g. "/preview reuses the real renderer ->
  little net-new design"). Auto-follow the computed rec; this also collapses the
  round-trip (see [[collapse-plan-phase-upstream-gates]]). Skip-rec -> just proceed
  to plan; spec-rec -> hand off to ui-phase.
- **gaps-handling** (`execute-phase.md:1510-1576`) — needs the rec made DYNAMIC
  first (blocking signal); see [[auto-advance-default-and-gap-escalation]].

Add a test asserting the converted prompts no longer hard-block in non-`--auto`
runs, and that a config/flag escape exists for each.

Context: [[minimize-gsd-plumbing-interactions]] note — bucket-3 sub-class 2.
Sibling fix (sub-class 1, round-trips): [[collapse-plan-phase-upstream-gates]].
