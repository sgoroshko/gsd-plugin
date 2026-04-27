---
slug: 260427-rat-resume-at-skill
type: quick
created: 2026-04-27
completed: 2026-04-27
status: complete
---

# Summary: `/gsd:resume-at` skill + README "Added features beyond upstream" section

## What changed

### New skill: `skills/resume-at/SKILL.md`

Added `/gsd:resume-at <time>` — schedules a future Claude Code session to auto-run `/gsd:resume-work` (or any GSD command via `--cmd`) at a specific time. Thin wrapper over Claude Code's built-in `/schedule` / `CronCreate` primitive.

Time formats accepted:
- `HH:MM` — today (or tomorrow if past)
- ISO 8601 — absolute timestamp
- `+<duration>` — relative offset (`+30m`, `+2h`, `+1d`)

Default scheduled command is `/gsd:resume-work`. Override with `--cmd "<any GSD command>"`.

### README "Added features beyond upstream" section

New top-level section inserted between "Session continuity + drift resilience" and "Installation". Single scannable table catalogs 9 plugin-only headliners with one-liner each:

1. Scheduled resume (`/gsd:resume-at`)
2. Auto-resume across `/compact`
3. Mid-session checkpoints (PostToolUse, ≤1/min)
4. Plugin-version-churn fallback
5. CI-enforced drift detection
6. 92% per-turn token reduction
7. Plugin-local workflow bodies
8. Standardized continuation prompts
9. Cross-session memory

Replaces the previous structure where these features were buried inside the deep-dive comparison tables. Fresh visitors now see plugin value immediately.

### Bookkeeping

- README slash-command count: 81 → 82
- README plugin version: 2.38.7 → 2.38.8
- `package.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`: 2.38.7 → 2.38.8
- `CHANGELOG.md`: new `## [2.38.8] - 2026-04-27` entry under Added (skill + README section) and Changed (slash count bump)

## Why

Two related asks:
1. User wanted a way to resume work at a future time when hitting token caps. CC already has `/schedule` and `/loop` for this — we just needed a GSD-flavored on-ramp that defaults to `/gsd:resume-work`.
2. User noted that plugin-only features were buried inside comparison tables; wanted them surfaced near the top for visibility. New section near `## Installation` accomplishes that.

## Verification

- `node bin/maintenance/check-drift.cjs` — all 3 detectors PASS
  - File-layout: clean (baseline 122/122/0)
  - HANDOFF schema: 19/19 fields valid
  - Namespace: skill registry shows **82 entries** (was 81), 0 stale dash-style refs
- `ls skills/*/SKILL.md | wc -l` → 82 ✓
- New skill frontmatter parses (`name: gsd:resume-at`, argument-hint with three time formats, allowed-tools includes Skill / AskUserQuestion / Bash)

## Out of scope (noted for future)

- A `/gsd:resume-when-quota-resets` command — different problem (quota-window detection vs absolute time).
- Reimplementing `/schedule` — CC already does this correctly. Resume-at is a wrapper, not a rebuild.

## Next step

Commit all changes, tag `v2.38.8`, push, create GitHub release.
