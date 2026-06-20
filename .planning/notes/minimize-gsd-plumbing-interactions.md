---
title: Minimize GSD plumbing interactions (3-bucket prompt classification)
date: 2026-06-19
context: /gsd:explore session on the plan-phase -> discuss-phase round-trip friction
---

# Minimize GSD plumbing interactions

## Principle

Human interaction should be reserved for what the user is **building**. GSD's own
plumbing should require manual hand-offs as rarely as possible. Not zero (some
plumbing is fine), but **minimal**.

## The 3-bucket classification

Every prompt / forced interaction falls into one bucket:

| Bucket | Verdict | Examples |
|--------|---------|----------|
| **Build decision** | KEEP — this is the product | discuss-phase questions, requirement confirmation, scope prioritization, "which approach" |
| **Safety / irreversible** | KEEP, but minimal | overwrite confirms, commit-to-shared-branch, anything you can't undo |
| **Pure plumbing / flow-control** | AUTOMATE or COLLAPSE | "run X then come back", "/clear then re-run", "continue or capture first?", resume hand-offs, "(Recommended)"-default rubber-stamps |

The job is to make bucket-3 prompts vanish wherever a handoff or a sensible
default can replace them, while leaving buckets 1 and 2 alone.

## Two distinct bucket-3 sub-classes

1. **Round-trip hand-offs** — workflow dead-ends and makes the user run another
   command then manually return (plan-phase's CONTEXT.md / UI-SPEC.md gates). Fix:
   route into the existing chain / HANDOFF-resume so re-entry is automatic.
2. **"(Recommended)"-default rubber-stamps** — a blocking prompt where the system
   already marks one option recommended and the action is reversible/low-stakes.
   The `(Recommended)` label is the tell: if GSD is confident enough to recommend,
   asking the user to press enter on it is plumbing. Fix: DO the recommended thing,
   announce it, keep it overridable (flag / interrupt / persistent config) — only
   block when genuinely ambiguous (no confident recommendation) or irreversible
   (bucket 2).

   **HARD GUARD (scoping constraint):** this collapse applies ONLY when the prompt
   decides **how the GSD workflow runs** (process / plumbing — research-or-not,
   continue-or-capture, resume hand-offs). It must NEVER touch **discussion-like
   prompts that decide WHAT gets built** (design choices, gray-area resolution,
   scope prioritization, which-approach). Those are bucket 1 and stay fully
   interactive even when one option carries a `(Recommended)` label — the
   recommendation is a hint, not a default to auto-accept. Discriminator: "does
   this prompt change the product, or just GSD's own process?" Product -> keep.
   Process -> collapse. Example: `plan-phase.md:455` "Research before planning Phase X?"
   marks "Research first" recommended UNCONDITIONALLY (same every time), so the
   prompt never carries real signal — it should auto-research with a
   `--skip-research` escape + a `workflow.research_default` (ask|always|never) knob.
   `(Recommended)` appears in ~14 workflows; only the reversible ones collapse —
   destructive-action confirmations where recommended = the safe option stay (bucket 2).

## Audit findings (3.5.0, 91 workflows)

- ~40 workflows use AskUserQuestion; ~50 "re-run" hits exist. **Most are NOT
  friction** — they are internal control-flow (orchestrator re-running `init` to
  re-check its own state) or error recovery ("test failed, fix and re-run").
- The real happy-path plumbing surface is small and concentrated: **one
  anti-pattern, in one file, two instances** —
  - `workflows/plan-phase.md:369` — missing CONTEXT.md -> "run /gsd:discuss-phase {X}, then re-run plan-phase"
  - `workflows/plan-phase.md:680` — missing UI-SPEC.md -> "run /gsd:ui-phase {N}, then re-run plan-phase"
  - Same shape: plan-phase detects a missing upstream artifact, dead-ends, and
    makes the user both run the upstream command AND manually return.
- The `/clear then ...` continuation hints (49 across 26 files) are bucket 2 —
  soft hygiene suggestions, not hard gates. Leave them.

## The constraint, and the two escape hatches

- **Why it can't naively auto-chain:** `plan-phase.md:367` — nested
  AskUserQuestion breaks (#1009). discuss-phase / ui-phase are interactive, so
  plan-phase can't call them as a nested Skill/Task. Same root cause as
  forks-can't-prompt the user. See [[reference_context_fork_breaks_orchestrators]].
- **Forward-chaining already exists in-repo:** `workflows/next.md:170` does
  `"Then invoke via SlashCommand. Do not continue."` — auto-routes into the next
  command with zero manual re-run. SlashCommand re-dispatch is a top-level
  re-entry, not a nested Skill/Task call.
- **HANDOFF auto-resume:** discuss-phase writes CONTEXT.md to disk, so the
  planner never needs the discussion transcript in context (that's WHY there is
  a /clear boundary). discuss-phase could write HANDOFF.json {next: plan-phase N}
  -> /clear -> SessionStart/resume-work auto-launches planning. Human only does
  the discussion; re-entry is automated.

**Open question that gates the fix:** does SlashCommand re-dispatch trip #1009
the way a nested Skill/Task call does? next.md routing to execute-phase suggests
it is safe — confirm before relying on it.

Related: [[collapse-plan-phase-upstream-gates]] (todo),
[[slashcommand-forward-chaining-pattern]] (seed).

## Release packaging — "Less GSD housekeeping prompts"

Bundled as a named user-facing feature for the upcoming release (likely the next
minor, 3.6.0; confirm at ship). Tagline: **fewer interactions about GSD's own
plumbing, none about what you're building.**

The feature = both bucket-3 sub-class fixes shipped under one banner:

| Sub-class | Fix (todo) | Release-readiness |
|-----------|------------|-------------------|
| 2. `(Recommended)`-default + flow-control rubber-stamps | `auto-accept-recommended-default-prompts` | **Stream A DONE — 3 collapses SHIPPED 2026-06-19/20**: (a) plan-phase research gate (reuses `workflow.research`); (b) discuss-phase "explore more / ready for context?" gate; (c) new-project setup gauntlet -> single defaults gate with built-in recommended defaults. Guard `tests/housekeeping-prompt-reduction.test.cjs`. Scope guard held: settings/config surfaces KEPT, round-trip/gaps gates deferred to Stream B (`auto-advance-default-and-gap-escalation`). |
| 1. Round-trip hand-offs | `collapse-plan-phase-upstream-gates` | **Gated** — decided design is "discuss -> resume plan interactive"; needs the #1009-currency probe (spike 001) to pick seamless vs one-/clear before building. |

Suggested build order: ship the research-prompt conversion first (establishes the
announce-and-auto pattern + the config knob), then the wider `(Recommended)` sweep,
then the round-trip fix once #1009 is settled. Can ship sub-class 2 alone as the
first increment of the feature if the round-trip work isn't ready.

**Ship-time requirements (do not skip):**
- Add a row to README `## Added features beyond upstream` (every user-facing
  capability — see [[feedback_release_readme_features_sync]]).
- Bump BOTH `plugin.json` AND `marketplace.json`; ship as a git tag
  (see [[feedback_release_marketplace_and_tags]]).
- CHANGELOG entry, em-dash-free (see [[feedback_no_emdashes_in_docs]]).
- Batch related prompt-reduction work into this one release, not per-change bumps
  (see [[feedback_less_aggressive_version_bumping]]).
