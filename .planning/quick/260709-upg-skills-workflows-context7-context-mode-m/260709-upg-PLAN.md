---
quick_id: 260709-upg
slug: skills-workflows-context7-context-mode-m
date: 2026-07-09
type: quick
---

<objective>
Mirror the `a40be70` fix ("use context7 from plugin and use context-mode for web-fetch") from `agents/*.md` onto `skills/*/SKILL.md` and `workflows/*.md`. Nine files still reference the un-namespaced `mcp__context7__*` tool IDs and/or bare `WebFetch` for doc fetching; both are stale post-plugin-split conventions. Replace with the plugin-namespaced Context7 tools (`mcp__plugin_context7_context7__resolve-library-id` / `query-docs`) and the context-mode fetch/search pair (`mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` / `ctx_search`), matching how `agents/gsd-phase-researcher.md` and `agents/gsd-planner.md` were updated.
</objective>

<context>
Reference commit: `git show a40be70` (already applied to `agents/*.md`). Key substitution used there:
- `mcp__context7__resolve-library-id` -> `mcp__plugin_context7_context7__resolve-library-id`
- `mcp__context7__query-docs` -> `mcp__plugin_context7_context7__query-docs`
- `mcp__context7__*` (wildcard) -> `mcp__plugin_context7_context7__*`
- bare `WebFetch` in allowed-tools -> `mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` + `mcp__plugin_context-mode_context-mode__ctx_search`
- `agents/gsd-planner.md` documentation_lookup line (already the exact pattern used elsewhere in this repo, e.g. this planner's own prompt): "For library docs: `mcp__plugin_context7_context7__resolve-library-id` (libraryName + query) then `mcp__plugin_context7_context7__query-docs` (libraryId + query). For official docs URLs not covered by Context7, use `mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` then `mcp__plugin_context-mode_context-mode__ctx_search`."

Confirmed via grep that exactly 9 files under `skills/` and `workflows/` still match `mcp__context7__`:
skills/mvp-phase/SKILL.md, skills/ui-phase/SKILL.md, skills/plan-phase/SKILL.md, skills/ai-integration-phase/SKILL.md, skills/spike/SKILL.md, skills/discuss-phase/SKILL.md, skills/sketch/SKILL.md, workflows/discuss-phase/modes/default.md, workflows/discovery-phase.md.

Out of scope (verified, do not touch): sdk/src/tool-scoping.ts(.test.ts), templates/discovery.md, templates/research.md, templates/research-project/SUMMARY.md, templates/research-project/STACK.md, references/context-budget.md, README.md, hooks/hooks.json, CHANGELOG.md, skills/bundled/claudeApi.ts.
</context>

<tasks>

<task>
  <name>Task 1: Rename Context7 tool IDs + WebFetch in skill frontmatter allowed-tools lists</name>
  <files>skills/plan-phase/SKILL.md, skills/mvp-phase/SKILL.md, skills/ui-phase/SKILL.md, skills/ai-integration-phase/SKILL.md, skills/spike/SKILL.md, skills/sketch/SKILL.md, skills/discuss-phase/SKILL.md</files>
  <action>
    In each file's YAML frontmatter `allowed-tools:` list, apply the mirrored substitution:

    - `skills/plan-phase/SKILL.md` (lines 14-15): replace the `- WebFetch` line with two lines `- mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` and `- mcp__plugin_context-mode_context-mode__ctx_search`; replace `- mcp__context7__*` with `- mcp__plugin_context7_context7__*`.
    - `skills/mvp-phase/SKILL.md` (lines 14-15): same substitution as plan-phase.
    - `skills/ui-phase/SKILL.md` (lines 12, 14): same substitution — WebFetch line becomes the two ctx_fetch_and_index/ctx_search lines, `mcp__context7__*` becomes `mcp__plugin_context7_context7__*`.
    - `skills/ai-integration-phase/SKILL.md` (lines 12, 15): same substitution (note this file also lists `WebSearch` on a separate line — leave `WebSearch` untouched, only replace the `WebFetch` line and the `mcp__context7__*` line).
    - `skills/spike/SKILL.md` (lines 14-16): replace `- WebFetch` with the two ctx_fetch_and_index/ctx_search lines; replace `- mcp__context7__resolve-library-id` with `- mcp__plugin_context7_context7__resolve-library-id` and `- mcp__context7__query-docs` with `- mcp__plugin_context7_context7__query-docs` (these are listed individually here, not as a wildcard — keep them individual, just rename the prefix).
    - `skills/sketch/SKILL.md` (lines 14-16): identical substitution to spike/SKILL.md.
    - `skills/discuss-phase/SKILL.md` (lines 13-14): this file has no `WebFetch` line — only rename `- mcp__context7__resolve-library-id` -> `- mcp__plugin_context7_context7__resolve-library-id` and `- mcp__context7__query-docs` -> `- mcp__plugin_context7_context7__query-docs`.

    Do not touch any other lines in these files (objective/body content untouched). Preserve existing YAML list ordering/indentation style (two-space indent, `- ` prefix).
  </action>
  <verify>
    <automated>grep -rn 'mcp__context7__' skills/plan-phase/SKILL.md skills/mvp-phase/SKILL.md skills/ui-phase/SKILL.md skills/ai-integration-phase/SKILL.md skills/spike/SKILL.md skills/sketch/SKILL.md skills/discuss-phase/SKILL.md | grep -v '^#' | grep -c mcp__context7__ ; echo "expect 0 above"</automated>
  </verify>
  <done>All 7 SKILL.md files use `mcp__plugin_context7_context7__*` (wildcard or individual method names, matching each file's original style) and none of the 6 files that previously had bare `WebFetch` retain it — replaced by the ctx_fetch_and_index/ctx_search pair.</done>
</task>

<task>
  <name>Task 2: Fix Context7 references in workflow prose (prefix rename + method/param rename)</name>
  <files>workflows/discuss-phase/modes/default.md, workflows/discovery-phase.md</files>
  <action>
    `workflows/discuss-phase/modes/default.md` (~line 58): in the "Context7 for library choices" bullet, replace the inline-code reference `mcp__context7__*` with `mcp__plugin_context7_context7__*`. Prose wording around it stays the same — this is a pure prefix rename, no method/param changes.

    `workflows/discovery-phase.md` has TWO occurrences that require more than a prefix rename, because the old method name `get-library-docs` with param `context7CompatibleLibraryID` no longer exists in the plugin API (new method is `query-docs` with param `libraryId`), matching the rename already applied to `agents/gsd-phase-researcher.md` and `agents/gsd-planner.md` in commit a40be70:

    1. Level 1 Quick Verification block (~lines 52-64): replace `mcp__context7__resolve-library-id with libraryName: "[library]"` with `mcp__plugin_context7_context7__resolve-library-id with libraryName: "[library]", query: "[specific concern]"`. Replace the `mcp__context7__get-library-docs with: - context7CompatibleLibraryID: [from step 1] - topic: [specific concern]` block with `mcp__plugin_context7_context7__query-docs with: - libraryId: [from step 1] - query: [specific concern]`.

    2. Level 2 Standard Discovery block (~lines 92-98): replace the `- mcp__context7__resolve-library-id` / `- mcp__context7__get-library-docs (mode: "code" for API, "info" for concepts)` pair with `- mcp__plugin_context7_context7__resolve-library-id (libraryName + query)` / `- mcp__plugin_context7_context7__query-docs (libraryId + query — scope the query text to API usage or concepts/overview as needed, replacing the old mode param)`.

    Do not alter surrounding step numbering, headings, or unrelated WebSearch/official-docs guidance in this file.
  </action>
  <verify>
    <automated>grep -rn 'mcp__context7__' workflows/discuss-phase/modes/default.md workflows/discovery-phase.md | grep -c mcp__context7__ ; echo "expect 0 above"</automated>
  </verify>
  <done>Both files reference only `mcp__plugin_context7_context7__resolve-library-id` and `mcp__plugin_context7_context7__query-docs` (no `get-library-docs`, no `context7CompatibleLibraryID` param remaining), with prose otherwise unchanged.</done>
</task>

</tasks>

<success_criteria>
- `grep -rn 'mcp__context7__' skills/ workflows/` returns zero matches (all occurrences now `mcp__plugin_context7_context7__*`)
- No bare `WebFetch` remains in the 6 Category-A skill files that previously listed it (`skills/plan-phase/SKILL.md`, `skills/mvp-phase/SKILL.md`, `skills/ui-phase/SKILL.md`, `skills/ai-integration-phase/SKILL.md`, `skills/spike/SKILL.md`, `skills/sketch/SKILL.md`) — replaced by `mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` + `mcp__plugin_context-mode_context-mode__ctx_search`
- `workflows/discovery-phase.md` no longer references the retired `get-library-docs` method or `context7CompatibleLibraryID` param
- No files outside the declared 9-file scope were modified (verify via `git status` / `git diff --stat`)
- Files explicitly out of scope (sdk/src/tool-scoping.*, templates/*, references/context-budget.md, README.md, hooks/hooks.json, CHANGELOG.md, skills/bundled/claudeApi.ts) are untouched
</success_criteria>
