---
phase: 260515-f2d
verified: 2026-05-15T10:00:00Z
status: gaps_found
score: 8/10 truths verified
overrides_applied: 0
gaps:
  - truth: "STATE.md Quick Tasks Completed table has a new 260515-f2d row, last_activity bumped to 2026-05-15"
    status: failed
    reason: "Task 6 was skipped by the executor (SUMMARY decisions explicitly state 'Task 6 skipped per orchestrator-handles-state constraint'). At verification time, STATE.md has no 260515-f2d row, last_activity is still 2026-05-13, and the front-matter is unchanged. This was deferred to a post-merge orchestrator step that has not yet occurred."
    artifacts:
      - path: .planning/STATE.md
        issue: "No '| 260515-f2d |' row in Quick Tasks Completed table; front-matter last_updated='2026-05-13T00:00:00Z', last_activity=2026-05-13 (expected 2026-05-15)"
    missing:
      - "New row in '## Quick Tasks Completed' table: '| 260515-f2d | Sync upstream GSD v1.42.2 + bump plugin to v2.43.0 (...) | 2026-05-15 | 928a160 |  | [260515-f2d-new-upstream-version](./quick/260515-f2d-new-upstream-version/) |'"
      - "Front-matter bump: last_updated: \"2026-05-15T00:00:00Z\", last_activity: 2026-05-15"
      - "Current Position 'Last activity:' sentence reflecting this sync"
  - truth: "Workflow namespace rewrite (/gsd-X -> /gsd:X) does not corrupt non-command references"
    status: failed
    reason: "The Task 5 substitution pattern was too broad: it matched `gsd-build` inside the GitHub URL `github.com/gsd-build/get-shit-done/...` and rewrote it to `gsd:build`, producing a broken (404) link. Commit 690924f introduced this regression."
    artifacts:
      - path: workflows/update.md
        issue: "Line 608 reads '[View full changelog](https://github.com/gsd:build/get-shit-done/blob/main/CHANGELOG.md)'. Should be 'gsd-build' (the GitHub org). The sed substitution `s|/gsd-([a-z][a-z0-9-]*)|/gsd:\\1|g` matched 'gsd-build' because the allow-list in Task 5 plan only guarded against bin/hook script names, not the gsd-build org name."
    missing:
      - "Revert this single URL substitution: 'gsd:build' -> 'gsd-build' in workflows/update.md line 608"
      - "Optional: extend Task 5 allow-list in future syncs to include 'gsd-build' (the GitHub org name)"
---

# Phase 260515-f2d: Upstream GSD v1.42.2 Sync — Verification Report

**Phase Goal:** Sync upstream get-shit-done v1.42.2 into plugin tree, bump plugin v2.42.6 to v2.43.0, preserving 4 in-tree plugin patches + 2 SDK source patches + plugin-owned wrappers + commands/ exclusion.
**Verified:** 2026-05-15T10:00:00Z
**Status:** gaps_found
**Re-verification:** No (initial)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Plugin tree matches upstream v1.42.2 source content (agents/, hooks/{2}, bin/lib/*, sdk/src/*, workflows/, templates/, references/) | VERIFIED | 90 workflows, 33 agents, 36 templates, 61 references, 64+ bin/lib files; commit ceee2cc covers 401 files in the expected shape; SUMMARY's wholesale-sdk-dist + installer-migrations deviations are both Rule-3 fixes (substantive, not regressions) |
| 2 | 4 in-tree plugin patches + 2 SDK source patches survive verbatim | VERIFIED | `grep -c '[PLUGIN PATCH]' bin/lib/core.cjs` = 2; `resolveGsdRoot` + `function getAgentsDir` both present; `#PLUGIN-MODEL-CATALOG-PATH`, `#PLUGIN-HOOK-CONTEXT-MONITOR` markers present; 4 dispatch cases present; `[PLUGIN PATCH]` markers in both sdk/src files. Deviation #3 (SDK probe consolidation) is architecturally sound — see Deviation Deep-Dive below |
| 3 | Plugin-owned bin/gsd-sdk + bin/gsd-sdk.cmd are byte-identical | VERIFIED | sha256 bin/gsd-sdk = 8177abd69b43057ab67c4a1ed23a4177a068bd459e775be43252fc2e577a9dec; sha256 bin/gsd-sdk.cmd = 1bdafc97175e953292d4901c0d89415232eb1ecb4df024e5f5ec89e16b7d8f9d. Both match SUMMARY-reported values |
| 4 | No commands/ directory in plugin tree | VERIFIED | `test ! -d commands` passes |
| 5 | Only 2 hooks refreshed; upstream-only hooks (gsd-statusline, gsd-update-banner) NOT added | VERIFIED | 8 hook scripts in hooks/ (gsd-context-monitor.js + gsd-workflow-guard.js + 6 plugin-owned). No gsd-statusline.js, no gsd-update-banner.js |
| 6 | sdk/dist/cli.js >= 1.4 MB with >= 2 CLAUDE_PLUGIN_ROOT matches | VERIFIED | 1,660,069 bytes; 3 CLAUDE_PLUGIN_ROOT matches (one consolidated probe + one per legacy module). Behavioral test: `CLAUDE_PLUGIN_ROOT=/Users/jnuyens/src/gsd-plugin bin/gsd-sdk query init.quick test` returns `agents_installed: true`; `GSD_AGENTS_DIR=/Users/jnuyens/src/gsd-plugin/agents bin/gsd-sdk query init.quick test` also returns `agents_installed: true` |
| 7 | All 3 regression tests pass | VERIFIED | mcp-stdio-framing: PASS (8 tools); workspace-json-integration: PASS (22 checks); hooks-smoke: PASS (13/13) |
| 8 | README header refers to GSD 1.42.2 + plugin 2.43.0 | VERIFIED | Line 3: 'Based on: [GSD 1.42.2](https://github.com/gsd-build/get-shit-done/releases/tag/v1.42.2)'; Line 5: 'Plugin version: `2.43.0`'. No stale 1.41.2 or 2.42.6 references anywhere in README |
| 9 | CHANGELOG has [2.43.0] section dated 2026-05-15 | VERIFIED | Line 11: '## [2.43.0] - 2026-05-15  (based on upstream GSD 1.42.2)'; ordered above [2.42.6]; well-formed (Changed/Added/Fixed/Plugin patches preserved/Plugin-owned/Excluded/Tests sections); 0 em-dashes introduced in CHANGELOG diff |
| 10 | /gsd-X references in newly-pulled workflows have been normalized to /gsd:X | FAILED | Substitution did succeed for the 38+ command-form references, BUT introduced a regression: `github.com/gsd-build/get-shit-done` URL in workflows/update.md:608 was incorrectly rewritten to `github.com/gsd:build/get-shit-done`, producing a broken link. The Task 5 sed pattern lacked an exception for the `gsd-build` GitHub org name |

**Score:** 8/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| package.json | version 2.43.0, valid JSON | VERIFIED | "version": "2.43.0", parses |
| .claude-plugin/plugin.json | version 2.43.0, valid JSON | VERIFIED | "version": "2.43.0", parses |
| .claude-plugin/marketplace.json | version 2.43.0 (gsd entry), valid JSON | VERIFIED | gsd entry version = "2.43.0", parses |
| sdk/dist/cli.js | >= 1.4 MB | VERIFIED | 1,660,069 bytes |
| CHANGELOG.md | contains "## [2.43.0] - 2026-05-15" | VERIFIED | Line 11 exact match |
| README.md | contains "v1.42.2" | VERIFIED | Line 3 anchor URL contains 'v1.42.2' |
| .planning/STATE.md | contains "260515-f2d" | FAILED (MISSING) | Row not added — Task 6 was skipped by executor (deferred to orchestrator post-merge step) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| bin/lib/core.cjs | plugin-flat agents/ | resolveGsdRoot() + getAgentsDir() | WIRED | Both `[PLUGIN PATCH]` blocks present; `resolveGsdRoot` exported; `getAgentsDir` body patched |
| bin/lib/model-catalog.cjs | sdk/shared/model-catalog.json | flat-layout candidate #0 | WIRED | `[PLUGIN PATCH #PLUGIN-MODEL-CATALOG-PATH]` marker present |
| hooks/gsd-context-monitor.js | bin/gsd-tools.cjs | __dirname traversal + GSD_TOOLS_PATH | WIRED | `[PLUGIN PATCH] #PLUGIN-HOOK-CONTEXT-MONITOR` marker present |
| sdk/dist/cli.js | sdk/src/query/state-project-load.ts + sdk/src/query-gsd-tools-path.ts | rebundled + consolidated probe | WIRED (evolved) | 3 CLAUDE_PLUGIN_ROOT matches in bundle (one per patched module + consolidated probe). Behavioral spot-check confirms agents_installed=true when CLAUDE_PLUGIN_ROOT set |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Regression: mcp-stdio-framing | `node tests/mcp-stdio-framing.test.cjs` | PASS (8 tools) | PASS |
| Regression: workspace-json-integration | `node tests/workspace-json-integration.test.cjs` | All 22 checks passed | PASS |
| Regression: hooks-smoke | `node tests/hooks-smoke.test.cjs` | 13 passed, 0 failed | PASS |
| SDK probe via CLAUDE_PLUGIN_ROOT | `CLAUDE_PLUGIN_ROOT=… bin/gsd-sdk query init.quick test` | `agents_installed: true` | PASS |
| SDK probe via GSD_AGENTS_DIR | `GSD_AGENTS_DIR=… bin/gsd-sdk query init.quick test` | `agents_installed: true` | PASS |
| JSON metadata parses | `node -e "JSON.parse(...)" x3` | clean (all 3) | PASS |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| workflows/update.md | 608 | Broken markdown URL `github.com/gsd:build/get-shit-done` (should be `gsd-build`) | BLOCKER | User-facing 404 in changelog link; introduced by Task 5 over-broad sed pattern |
| .planning/STATE.md | (frontmatter + Quick Tasks table) | Missing 260515-f2d row; stale last_activity | BLOCKER | Truth #10 not satisfied; STATE.md drift between codebase and tracking |

## Deviation Deep-Dive

### Deviation #3: SDK source-patch architecture evolved (PASSED)

Upstream v1.42.2 consolidated the CLAUDE_PLUGIN_ROOT probe logic into a new `sdk/src/sdk-package-compatibility.ts::legacyAssetProbes()` helper. Previously the patch lived inline in 2 separate files.

Executor's response (verified):

1. **Consolidated probe** at `sdk/src/sdk-package-compatibility.ts:77-103`:
   - Lines 77-82: `[PLUGIN PATCH]` block explaining the architectural shift
   - Lines 83-92: `pluginFlatLegacyAsset()` reads `CLAUDE_PLUGIN_ROOT` env var
   - Lines 94-103: `legacyAssetProbes()` prepends the plugin-flat candidate
2. **Legacy markers preserved** for bundle-gate visibility:
   - `sdk/src/query/state-project-load.ts:18-29`: `[PLUGIN PATCH]` comment block + `PLUGIN_ROOT_FROM_ENV_STATE_LOAD` export reading `process.env.CLAUDE_PLUGIN_ROOT`
   - `sdk/src/query-gsd-tools-path.ts:3-12`: parallel `[PLUGIN PATCH]` block + `PLUGIN_ROOT_FROM_ENV_TOOLS_PATH` export
3. **Bundle carries 3 matches** (gate expects >=2): consolidated probe + 1 per patched module
4. **Behavioral confirmation:** `CLAUDE_PLUGIN_ROOT=/Users/jnuyens/src/gsd-plugin bin/gsd-sdk query init.quick test` returns `agents_installed: true`. The plugin-flat candidate is genuinely respected.

**Verdict:** Architecturally sound. The plan's verbatim-preservation expectation was for a static patch surface, but upstream refactored. Executor chose the right tradeoff: the patch is functionally consolidated (one source of truth) while the bundle-gate's heuristic ("CLAUDE_PLUGIN_ROOT must appear ≥2 times") is still satisfied through deliberate module-load references.

### Deviation #4: Em-dash stripping in workflows (PASSED with note)

The plan's em-dash gate was diff-scoped (no em-dashes in `git diff --cached workflows/`). Task 5's namespace substitution touched lines that already contained em-dashes in upstream-synced content, surfacing them in the diff. Executor extended Rule 2 scope to `,` substitution on already-touched lines.

Verification:
- `git diff 690924f^ 690924f -- workflows/ | awk '/^\+[^+]/' | grep -c '—'` = 0 (no em-dashes introduced in additions)
- `git diff ceee2cc 690924f -- workflows/ | awk '/^-/ && !/^---/' | grep -c '—'` = 111 (em-dashes removed)
- SUMMARY claims 115; actual diff shows 111. Minor numeric discrepancy, immaterial.
- 0 `description:` YAML frontmatter lines affected (em-dashes in YAML parsers were not a concern).
- 0 markdown table separators broken.
- Sample audit of 20+ added lines: substitutions are uniformly clean ` — ` → `, ` swaps.

**Verdict:** PASSED. The deviation is intentional, scoped, and the gate it satisfies is meaningful.

### Deviation #4-adjacent issue: Task 5 sed pattern over-broad (NEW FINDING — BLOCKER)

The same Task 5 substitution (`/gsd-X` → `/gsd:X`) that drove the em-dash strip also produced a regression NOT captured in the SUMMARY: the GitHub org name `gsd-build` was matched and substituted to `gsd:build` in a URL.

```
workflows/update.md:608:
- [View full changelog](https://github.com/gsd-build/get-shit-done/blob/main/CHANGELOG.md)
+ [View full changelog](https://github.com/gsd:build/get-shit-done/blob/main/CHANGELOG.md)
```

This was a single occurrence — the plugin only references `gsd-build` (GitHub org) in this one workflow file, so blast radius is bounded. But it's a real broken URL that ships to users.

Recommended fix: revert this single line; future syncs should add `gsd-build` to the Task 5 allow-list alongside binary names.

### Plan Truth #10 (STATE.md update) — gap, but explained

Truth #10 in the plan defined the STATE.md row + frontmatter bump as a must-have. The SUMMARY explicitly notes:

> "Task 6 (STATE.md update) skipped per executor constraints; orchestrator handles STATE.md at post-merge step."

The 260513-2zg precedent showed this pattern: orchestrator-level final-docs commit patches the STATE.md row with the real merge SHA (commits `5f825df` + `ff1c0b6` in that prior task). At verification time, this orchestrator follow-up commit has not yet landed — STATE.md still shows last_activity=2026-05-13 and has no 260515-f2d row.

**This is a real gap that the orchestrator must close** (analogous to the 260513-2zg pattern: a final `docs(state): record commit sha for 260515-f2d quick task` commit). The plan called for Task 6 to be executed, the executor chose to defer, and the resumed flow hasn't yet finished it.

## Gaps Summary

Two BLOCKER-class gaps:

1. **STATE.md not updated** — Task 6 was skipped by the executor. The plan defined STATE.md row + frontmatter bump as Truth #10. Orchestrator needs to land a final docs commit (per the established 260513-2zg pattern) before this task closes.

2. **Broken URL in workflows/update.md** — Task 5's namespace-rewrite sed matched the GitHub org name `gsd-build` and produced `gsd:build`. One occurrence; trivially fixed by editing line 608 of workflows/update.md.

Neither gap touches the substantive sync work — the wholesale upstream-tree copy, the 4 in-tree plugin patches, the 2 (now architecturally evolved) SDK source patches, the bundle rebuild, and the regression test trifecta are all correctly delivered. The gaps are confined to (a) post-merge state bookkeeping and (b) a single over-substituted URL.

## Recommendation

**status: gaps_found** — proceed via 2 small fixes:

1. Edit `workflows/update.md:608`: replace `github.com/gsd:build/` with `github.com/gsd-build/`.
2. Add the 260515-f2d row to `.planning/STATE.md` Quick Tasks Completed table with merge commit `928a160`; bump `last_updated`/`last_activity` to 2026-05-15; refresh "Last activity:" sentence.

Both fixes are mechanical and can be bundled into a single follow-up "docs(state): record commit sha for 260515-f2d + fix gsd-build URL" commit. After that, this phase is genuinely complete and the v2.43.0 plugin is releasable.

---

_Verified: 2026-05-15T10:00:00Z_
_Verifier: Claude (gsd-verifier)_
