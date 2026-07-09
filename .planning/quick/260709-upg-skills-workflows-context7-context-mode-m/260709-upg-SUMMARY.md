---
phase: quick-260709-upg
plan: 01
subsystem: tooling
tags: [context7, context-mode, mcp, skills, workflows, plugin-namespacing]

# Dependency graph
requires:
  - phase: a40be70 (fix commit)
    provides: mirrored substitution pattern already applied to agents/*.md
provides:
  - skills/*/SKILL.md and workflows/*.md now reference plugin-namespaced Context7 tool IDs and context-mode fetch/search tools, consistent with agents/*.md
affects: [any future skill/workflow/agent touching Context7 or WebFetch tool references]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Plugin-namespaced MCP tool IDs (mcp__plugin_<server>_<server>__<method>) replace bare/un-namespaced tool IDs post-plugin-split", "context-mode ctx_fetch_and_index + ctx_search pair replaces bare WebFetch for doc fetching"]

key-files:
  created: []
  modified:
    - skills/plan-phase/SKILL.md
    - skills/mvp-phase/SKILL.md
    - skills/ui-phase/SKILL.md
    - skills/ai-integration-phase/SKILL.md
    - skills/spike/SKILL.md
    - skills/sketch/SKILL.md
    - skills/discuss-phase/SKILL.md
    - workflows/discuss-phase/modes/default.md
    - workflows/discovery-phase.md

key-decisions:
  - "Mirrored the exact substitution pattern from commit a40be70 (already applied to agents/*.md) rather than inventing a new convention"
  - "workflows/discovery-phase.md required a method/param rename (get-library-docs/context7CompatibleLibraryID -> query-docs/libraryId), not just a prefix rename, since the plugin API retired the old method name"

patterns-established:
  - "Plugin-namespaced Context7 tool IDs: mcp__plugin_context7_context7__resolve-library-id / mcp__plugin_context7_context7__query-docs"
  - "context-mode fetch pair for doc URLs not covered by Context7: mcp__plugin_context-mode_context-mode__ctx_fetch_and_index + mcp__plugin_context-mode_context-mode__ctx_search"

requirements-completed: []

# Metrics
duration: ~3min
completed: 2026-07-09
---

# Quick Task 260709-upg: Skills/Workflows Context7 + Context-Mode Fix Summary

**Renamed all 9 remaining `mcp__context7__*`/bare-`WebFetch` references in `skills/*/SKILL.md` and `workflows/*.md` to the plugin-namespaced Context7 tools and context-mode fetch/search pair, matching the `a40be70` fix already applied to `agents/*.md`.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-07-09T19:09:04Z
- **Completed:** 2026-07-09T19:11:32Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- 7 SKILL.md files (`plan-phase`, `mvp-phase`, `ui-phase`, `ai-integration-phase`, `spike`, `sketch`, `discuss-phase`) now list `mcp__plugin_context7_context7__*` (wildcard or individual methods, matching each file's original style) in `allowed-tools`
- 6 of those files (all but `discuss-phase`, which never had it) had their bare `WebFetch` entry replaced with `mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` + `mcp__plugin_context-mode_context-mode__ctx_search`
- `workflows/discuss-phase/modes/default.md` prose reference renamed (pure prefix rename)
- `workflows/discovery-phase.md` fully migrated off the retired `get-library-docs`/`context7CompatibleLibraryID` API to `query-docs`/`libraryId`, in both the Level 1 Quick Verification and Level 2 Standard Discovery blocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename Context7 tool IDs + WebFetch in skill frontmatter allowed-tools lists** - `4f27a7c` (fix)
2. **Task 2: Fix Context7 references in workflow prose (prefix rename + method/param rename)** - `d2bce43` (fix)

_Note: Plan metadata commit (docs) handled separately by the orchestrator._

## Files Created/Modified
- `skills/plan-phase/SKILL.md` - allowed-tools: WebFetch -> ctx_fetch_and_index/ctx_search, mcp__context7__* -> mcp__plugin_context7_context7__*
- `skills/mvp-phase/SKILL.md` - same substitution as plan-phase
- `skills/ui-phase/SKILL.md` - same substitution (WebFetch and mcp__context7__* on separate lines, AskUserQuestion preserved between)
- `skills/ai-integration-phase/SKILL.md` - same substitution; WebSearch line left untouched
- `skills/spike/SKILL.md` - WebFetch -> ctx pair; individual resolve-library-id/query-docs methods renamed (not wildcard)
- `skills/sketch/SKILL.md` - identical substitution to spike
- `skills/discuss-phase/SKILL.md` - no WebFetch present; only resolve-library-id/query-docs prefix renamed
- `workflows/discuss-phase/modes/default.md` - inline-code `mcp__context7__*` -> `mcp__plugin_context7_context7__*` in the "Context7 for library choices" bullet
- `workflows/discovery-phase.md` - Level 1 block: resolve-library-id gained a `query` param, get-library-docs -> query-docs with `libraryId`/`query` params; Level 2 block: same rename pair, with a note replacing the retired `mode` param guidance

## Decisions Made
- Followed the plan's exact substitution mapping (mirrored from `a40be70`); no deviations needed since the plan had already enumerated every file/line precisely.

## Deviations from Plan

None - plan executed exactly as written. Every substitution matched the plan's `<action>` instructions line-for-line, and all `<verify>`/`<done>` criteria passed on first attempt.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Final Verification

Per the execution constraints, ran the plan's full-scope grep after all edits:

```
$ grep -rn 'mcp__context7__' skills/ workflows/
(no output — zero matches)
```

Confirmed zero matches across `skills/` and `workflows/`. Also confirmed:
- No bare `WebFetch` remains in the 6 skill files that previously had it (`grep -n 'WebFetch' skills/plan-phase/SKILL.md skills/mvp-phase/SKILL.md skills/ui-phase/SKILL.md skills/ai-integration-phase/SKILL.md skills/spike/SKILL.md skills/sketch/SKILL.md` returns no output)
- `workflows/discovery-phase.md` no longer references `get-library-docs` or `context7CompatibleLibraryID`
- `git diff --stat acaf398 HEAD` shows exactly the 9 declared files changed, nothing else
- All declared out-of-scope files (`sdk/src/tool-scoping.ts(.test.ts)`, `templates/discovery.md`, `templates/research.md`, `templates/research-project/SUMMARY.md`, `templates/research-project/STACK.md`, `references/context-budget.md`, `README.md`, `hooks/hooks.json`, `CHANGELOG.md`, `skills/bundled/claudeApi.ts`) are untouched

## Next Phase Readiness
- No follow-on phase dependency; this quick task fully closes the `agents/*.md`-vs-`skills/workflows` inconsistency introduced by the plugin-namespace split.
- No blockers or concerns.

---
*Phase: quick-260709-upg*
*Completed: 2026-07-09*

## Self-Check: PASSED

- Commit 4f27a7c: FOUND
- Commit d2bce43: FOUND
- All 9 modified files (7 SKILL.md + 2 workflows): FOUND
- SUMMARY.md: FOUND
