---
slug: 260427-rat-resume-at-skill
type: quick
created: 2026-04-27
status: in-progress
---

# Quick: Add `/gsd:resume-at` skill + README "Added features beyond upstream" section

## Problem / Goal

Two related asks from the user:

1. **A scheduled-resume command.** When Claude hits a token / usage cap, the user wants
   to ask Claude to **come back at a specific time** and resume the project. Claude
   Code already ships a `/schedule` skill (cron-style scheduling via `CronCreate`)
   and a `/loop` skill (interval re-firing). We just need a **GSD-flavored thin
   wrapper** that says "schedule `/gsd:resume-work` at time T" so the workflow
   feels native to the plugin's command surface.

2. **Visibility for plugin-only commands.** The README has tables comparing the
   plugin to upstream GSD, but plugin-only headline features get buried inside
   them. The user wants an **"Added features beyond upstream"** section near the
   top so a fresh visitor immediately sees what the plugin adds.

## Approach

### A. New skill: `skills/resume-at/SKILL.md`

Frontmatter:
- `name: gsd:resume-at`
- `description: Schedule a future resume of work — wraps Claude Code's /schedule for GSD continuity.`
- `argument-hint: "<HH:MM | ISO 8601 | +<duration>> [--cmd <command>]"`
- `allowed-tools: [Skill, AskUserQuestion]`

Process body (what Claude does when invoked):

1. **Parse the time argument.** Accept three forms:
   - `HH:MM` — today at that local time (or tomorrow if already past)
   - ISO 8601 (`2026-04-28T08:00`) — absolute timestamp
   - `+<duration>` (`+2h`, `+45m`, `+90m`) — relative offset
2. **Resolve the command to schedule.** Default is `/gsd:resume-work`. If the user
   passed `--cmd "<command>"`, use that instead — lets you schedule any GSD
   command (e.g. `/gsd:next`, `/gsd:execute-phase 9`).
3. **Hand off to Claude Code's `/schedule` skill** via the `Skill` tool with args
   that translate the GSD-friendly time form into the cron expression `/schedule`
   expects.
4. **Confirm what was scheduled.** Print the absolute UTC + local time and the
   command that will fire.

The skill is intentionally thin — it does NOT reimplement scheduling. All the
durability (cron persistence, replay-after-restart, etc.) is owned by Claude
Code's built-in `/schedule`. Resume-at just translates `+2h` and `/gsd:resume-work`
into the form `/schedule` accepts.

### B. README "Added features beyond upstream" section

Insert a new top-level section directly after `## Session continuity + drift resilience` (existing line 21–27 area) and before `## Installation`. Catalog the
plugin-only commands and behaviors a fresh user benefits from immediately:

- `/gsd:resume-at <time>` — scheduled resume (NEW in this task)
- Auto-resume across `/compact` (PreCompact + SessionStart hooks)
- Periodic mid-session checkpoints (PostToolUse, ≤1/min)
- Plugin-version churn fallback (newest-cached resolver)
- File-layout / HANDOFF / namespace drift detectors
- 92% per-turn token reduction vs upstream's CLAUDE.md form

Keep it scannable — bullet list with one-liner each, link to the deeper "For
users of upstream GSD" tables for details.

### C. Bookkeeping

- README "What GSD Plugin provides" — bump `81 slash commands` → `82 slash commands`
- CHANGELOG.md — `## [2.38.8] - 2026-04-27` entry: `Added: /gsd:resume-at skill (wraps /schedule for GSD-flavored future-resume).`
- Version bump 2.38.7 → 2.38.8 in:
  - `package.json`
  - `.claude-plugin/plugin.json`
  - `.claude-plugin/marketplace.json`
  - `README.md` "Plugin version" line
- Run `node bin/maintenance/check-drift.cjs` — must stay green
- Verify skill discovery: `ls skills/resume-at/SKILL.md` exists, frontmatter
  parses (no `\n` issues), and the plugin's command count machinery picks it up

## Files affected

- `skills/resume-at/SKILL.md` (new)
- `README.md` (new section + version bump + slash-command count)
- `CHANGELOG.md` (new entry)
- `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (version)

## Out of scope

- **Reimplementing `/schedule`.** The user's own scheduler suggestion ("queue a
  message with a delay") is already what `/schedule` does. We wrap, we don't
  rebuild.
- **Persisting GSD-specific state on the scheduled run.** When the cron fires,
  the new session opens fresh and runs `/gsd:resume-work` — which already loads
  HANDOFF.json. No new persistence layer needed.
- **A `/gsd:resume-when-quota-resets` command.** Different problem (quota-window
  detection, not absolute time). Note for future work, not this task.

## Smoke tests

1. `node bin/maintenance/check-drift.cjs` — all 3 detectors PASS
2. Skill file parses (frontmatter loads cleanly)
3. README "Added features beyond upstream" section renders before "Installation"
4. Version refs aligned across package.json / plugin.json / marketplace.json / README
