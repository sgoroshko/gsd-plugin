---
spike: 001
name: slashcommand-rechain-askuserquestion
type: standard
validates: "Given plan-phase's missing-CONTEXT gate, when it hands off to discuss-phase, then the manual 'come back and re-run plan-phase' round-trip can be removed WITHOUT losing the interactive discussion — i.e. without tripping #1009 (AskUserQuestion in a nested subcontext)."
verdict: PARTIAL
related: []
tags: [askuserquestion, slashcommand, skill-dispatch, 1009, auto-chain, plan-phase, plumbing]
---

# Spike 001: SlashCommand re-chain vs AskUserQuestion (#1009)

## What This Validates

Given plan-phase's missing-CONTEXT gate, when it hands off to discuss-phase,
can we remove the manual "run discuss-phase, then come back and re-run
plan-phase" round-trip WITHOUT losing the interactive discussion the user
values — i.e. without tripping #1009 (AskUserQuestion failing in a nested
subcontext)?

This is a binary runtime-behavior question, so evidence is the shipped codebase
convention + official Claude Code docs, not a UI. One residual is left for an
empirical follow-up (see Open Question).

## Research

### A. What the GSD codebase already does (grep-verified, 3.5.0)

- `--auto` is defined as: *"Claude picks recommended option for every question;
  no AskUserQuestion"* (`workflows/discuss-phase.md:345`).
- **Every** nested dispatch of an interactive command appends `--auto` and goes
  through the **`Skill()` tool**:
  - `workflows/plan-phase.md:1664` → `Skill(gsd-execute-phase, "... --auto ...")`
  - `workflows/plan-phase.md:658`  → `Skill(gsd-ui-phase, "... --auto ...")`
  - `workflows/new-project.md:1406` → `SlashCommand("/gsd:discuss-phase 1 --auto")`
  - `workflows/transition.md:402,414` → `SlashCommand(".../gsd:plan-phase|discuss-phase ... --auto ...")`
- `workflows/plan-phase.md:24`: *"`--chain`/`--auto` suppress interactive prompts only."*
- `workflows/plan-phase.md:367`: the #1009 workaround — *"Do NOT invoke
  discuss-phase as a nested Skill/Task call — AskUserQuestion does not work
  correctly in nested subcontexts (#1009)."*
- **Counter-example:** `workflows/next.md:170,247` dispatches commands
  (incl. execute-phase, which has 3 AskUserQuestion checkpoints) via the
  **`SlashCommand` tool WITHOUT `--auto`** — implying its author believed
  SlashCommand dispatch preserves the interactive main context.
- Existing auto-advance pipeline: `discuss-phase.md:467,493` — a top-level
  discuss-phase flagged `--chain` auto-advances into plan-phase on completion.

Convention summary: **nested dispatch ⇒ prompts suppressed via `--auto`.** The
GSD authors do not rely on AskUserQuestion surviving a nested dispatch.

### B. Official Claude Code behavior (via claude-code-guide agent, from docs)

| Mechanism | Runs in | AskUserQuestion reaches user? |
|-----------|---------|-------------------------------|
| Subagent (Task / Agent tool) | isolated subcontext | **No** — docs: "not available to subagents"; only final result returns |
| `Skill` tool | **main conversation** (docs: "Executes a skill within the main conversation") | Docs imply **yes** |
| `SlashCommand` tool | **not covered in public docs** | Unknown from docs |

### C. The contradiction

Official docs say `Skill()` runs in the main context where AskUserQuestion
works. GSD's `#1009` workaround says nested Skill/Task dispatch breaks
AskUserQuestion. Both can't be fully true today. Likely explanations:
1. #1009 was a real bug on an older CC build, since fixed → the workaround is now
   over-conservative (stale).
2. The break only manifests at deeper nesting (Skill→Skill→Skill orchestrator
   chains), not a single Skill call.

Unresolved without an empirical test (see Open Question).

## How to Run

No code to run — this is a documentation + codebase-convention spike. Evidence
is reproducible via the grep citations in Research section A and the official
docs cited in section B.

## Investigation Trail

1. Started from the explore-session question "does SlashCommand re-dispatch trip
   #1009?" Expected a simple yes/no.
2. Grepped SlashCommand/Skill/AskUserQuestion/`--auto` usage across 91 workflows.
   Found the unanimous `--auto`-on-nested-dispatch convention — strong shipped
   evidence that GSD deliberately suppresses prompts when chaining. This already
   answers the core design question: you canNOT auto-chain INTO an interactive
   discussion via nested dispatch; the dispatch is what forces prompts off.
3. Found the `next.md` counter-example (SlashCommand without `--auto` to an
   AskUserQuestion-bearing command) — suggested SlashCommand != Skill re: context.
4. Spawned claude-code-guide for authoritative CC semantics. Confirmed subagents
   definitively can't prompt; confirmed Skill runs in main context (docs imply
   AskUserQuestion works there); SlashCommand context semantics undocumented.
5. Surfaced the docs-vs-#1009 contradiction — reframed from "simple yes/no" to
   "the safe fix holds regardless; one optimization depends on resolving #1009's
   currency."

## Results

**Verdict: PARTIAL ⚠**

- **VALIDATED — the round-trip's re-entry half is removable with existing
  machinery.** A top-level interactive discuss-phase flagged `--chain` already
  auto-advances into plan-phase (`discuss-phase.md:467,493`). plan-phase's
  no-CONTEXT exit just needs to hand off `/gsd:discuss-phase {X} --chain` instead
  of bare command + "come back and re-run plan-phase {X}". Discussion stays
  interactive (top-level); the manual re-run disappears. No new mechanism.
- **INVALIDATED — you cannot auto-launch an interactive discussion from inside
  plan-phase.** Subagents can't prompt (definitive); and the GSD convention forces
  `--auto` (prompts off) on every nested dispatch. The interactive discussion MUST
  remain a top-level command. This is a real CC constraint, not a GSD shortcoming.
- **OPEN — whether a single nested `Skill()` dispatch can keep AskUserQuestion
  interactive.** Docs say yes; #1009 says no. Determines whether a more aggressive
  fix (and a HANDOFF→resume→plan-phase re-entry that keeps plan-phase's OWN
  scope-decision prompts interactive) is available. Not needed for the recommended
  fix.

**Recommended fix (robust to the open question):** plan-phase's missing-CONTEXT
gate (`plan-phase.md:335-375`) and missing-UI-SPEC gate (`:672-680`) should set
`--chain` on their upstream hand-off rather than dead-ending with a manual
re-run. Cost: a few lines per gate, all existing machinery.

## Open Question (empirical follow-up)

**Is #1009 still real on current Claude Code, or stale?**

Test: create a throwaway project command `.claude/commands/aq-probe.md` whose body
is a single AskUserQuestion; from a parent skill, dispatch it via (a) the `Skill`
tool and (b) the `SlashCommand` tool; observe whether the prompt renders to the
user or silently no-ops/errors. Caveat: newly-written commands/skills may not
register until session reload — account for that so "not found" isn't mistaken
for "#1009 broke it." If both render the prompt, #1009 is stale and GSD's
`--auto`-on-dispatch gymnastics can be revisited (separate, larger cleanup).
