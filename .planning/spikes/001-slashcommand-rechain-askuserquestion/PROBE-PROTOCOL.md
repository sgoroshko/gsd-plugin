# PROBE PROTOCOL — Is #1009 still real? (AskUserQuestion under dispatch)

Settles spike 001's Open Question: when a command/skill is **dispatched by another
command** (not typed by the user), does its `AskUserQuestion` prompt still reach the
user? Tests the two dispatch mechanisms GSD uses at flat nesting:
- **(a) Skill-tool dispatch** — `Skill(skill="...")`, what plan-phase/discuss-phase chaining uses.
- **(b) SlashCommand-tool dispatch** — `SlashCommand("/...")`, what `next.md:170` uses without `--auto`.

NOT tested here: Task/Agent subagents — those definitively cannot prompt (docs-confirmed); not in question.

## Scaffold (all THROWAWAY — created by spike, uncommitted)

- `.claude/skills/aq-probe-leaf/SKILL.md` — leaf skill, one AskUserQuestion (path a leaf)
- `.claude/commands/aq-probe-leaf-cmd.md` — leaf command, one AskUserQuestion (path b leaf + baseline)
- `.claude/commands/aq-probe-via-skill.md` — parent, dispatches leaf via Skill tool (path a)
- `.claude/commands/aq-probe-via-slashcommand.md` — parent, dispatches leaf via SlashCommand tool (path b)

## Steps

1. **START A FRESH SESSION first.** Claude Code registers project commands
   (`.claude/commands/`) and project skills (`.claude/skills/`) at session start.
   These files were written mid-session, so the CURRENT session does not know them.
   Running them now would fail with "command/skill not found" — which is a
   REGISTRATION failure, NOT a #1009 result. Do not conflate the two. Open a new
   session in this repo before step 2.

2. **Baseline (sanity — confirms the leaf itself works when typed directly):**
   Type: `/aq-probe-leaf-cmd`
   Expect: the A/B prompt renders; you pick one; agent prints
   `LEAF-CMD: AskUserQuestion RENDERED (answer=A)`.
   - If the baseline does NOT render, STOP — something unrelated is wrong
     (AskUserQuestion unavailable in this runtime); the dispatch tests would be
     uninterpretable.

3. **Path (a) — Skill-tool dispatch:**
   Type: `/aq-probe-via-skill`
   Watch whether the leaf's A/B prompt renders DURING the dispatched skill.
   Agent prints `RESULT(skill-dispatch): RENDERED ...` or `... DID NOT RENDER ...`.

4. **Path (b) — SlashCommand-tool dispatch:**
   Type: `/aq-probe-via-slashcommand`
   Watch whether the leaf's A/B prompt renders.
   Agent prints `RESULT(slashcommand-dispatch): RENDERED ...` or `... DID NOT RENDER ...`.

## Decision table

| Observation during dispatch | Verdict for that path |
|---|---|
| The A/B AskUserQuestion prompt RENDERS and you can pick | **#1009 STALE** for that path — interactive nested dispatch works |
| Prompt never appears: silent no-op, tool error, or only a final text result returns | **#1009 REAL** for that path — dispatch suppresses/blocks AskUserQuestion |

Record both path verdicts in spike 001 README Results.

## What each outcome means for the round-trip fix

Target: `collapse-plan-phase-upstream-gates` (decided design: "discuss -> resume
plan interactive" — keep BOTH the discussion AND plan-phase's own prompts live).

- **Either path RENDERS (#1009 stale):** the **seamless** re-entry is available —
  plan-phase can be dispatched (via that mechanism, no `--auto`) after the
  discussion with its prompts intact. No `/clear` needed. Prefer the mechanism
  that rendered (Skill if both).
- **Both paths DO NOT RENDER (#1009 real):** fall back to **HANDOFF/resume** —
  discuss-phase writes `HANDOFF.json {next: plan-phase N}`, user `/clear`s,
  SessionStart/resume-work relaunches plan-phase as a TOP-LEVEL command (interactive
  guaranteed). Costs one `/clear` (also sheds the discussion transcript — real
  hygiene). The decided design still ships; it just isn't seamless.

Bonus: if Skill dispatch RENDERS, GSD's blanket `--auto`-on-dispatch convention and
the `plan-phase.md:367` "#1009" warning are over-conservative and a broader cleanup
is on the table (separate, larger work).

## Faithfulness caveats

1. **Project skill vs plugin skill.** GSD dispatches installed PLUGIN skills
   (`gsd:` namespace, from the cache), whereas `aq-probe-leaf` is a PROJECT skill
   (`.claude/skills/`). The #1009 question is about execution CONTEXT
   (main-conversation vs isolated subcontext), which official docs tie to the Skill
   tool itself ("executes a skill within the main conversation"), not to where the
   skill was discovered. So this is a faithful test of the *mechanism*, with a small
   discovery-source gap. If you want zero gap, repeat path (a) from inside a real
   plugin by temporarily adding an equivalent throwaway skill to the plugin and
   dispatching it — heavier, usually unnecessary.
2. **Single-level dispatch.** Real GSD chains can nest deeper (and use `--auto`).
   This isolates the core #1009 claim: ONE level of dispatch + ONE AskUserQuestion.
   If single-level already fails, deeper definitely does; if it works, deeper nesting
   is a separate question (#686 freeze territory) not covered here.
3. **Observer = the agent.** "RENDERED" must be judged by whether YOU (the human)
   actually saw and answered the A/B prompt — not solely by the agent's self-report,
   since a confused agent could mislabel. Trust your own screen over the printed line.

## Cleanup (after recording verdicts)

Delete the scaffold:
```
rm -rf .claude/skills/aq-probe-leaf \
       .claude/commands/aq-probe-leaf-cmd.md \
       .claude/commands/aq-probe-via-skill.md \
       .claude/commands/aq-probe-via-slashcommand.md
```
Keep this PROBE-PROTOCOL.md and the recorded verdicts in spike 001. If `.claude/`
is now otherwise empty, you can remove it too (the repo had none before this probe).
