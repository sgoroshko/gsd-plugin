---
phase: 260517-fpp
plan: 01
status: complete
subsystem: upstream-sync
tags: [upstream-sync, plugin-patches, version-bump, hotfix-sync]
dependency_graph:
  requires: []
  provides: [upstream-v1.42.3]
  affects: [agents/, bin/lib/, sdk/, workflows/, package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json, README.md, CHANGELOG.md]
tech_stack:
  added: []
  patterns: [wholesale-tree-copy, surgical-patch-reapply, sdk-rebundle]
key_files:
  modified:
    - agents/ (5 files refreshed)
    - bin/lib/*.cjs (8 files refreshed, core.cjs patches re-applied)
    - sdk/src/* (8 TS modules incl. 1 new test file)
    - sdk/dist/* (16 files rebuilt via tsc + esbuild)
    - workflows/ (4 files refreshed)
    - package.json (version 2.43.3)
    - .claude-plugin/plugin.json (version 2.43.3)
    - .claude-plugin/marketplace.json (version 2.43.3)
    - README.md (upstream ref refresh)
    - CHANGELOG.md ([2.43.3] entry)
decisions:
  - "Pulled upstream v1.42.3 (35-commit hotfix delta on v1.42.2, primarily phase-removal logic hardening and plan-phase closed-phase guard). ~13x smaller than the v1.41.2 to v1.42.2 sync."
  - "Only bin/lib/core.cjs required surgical re-apply of plugin patches. All other patches survived automatically because upstream did NOT modify their host files this cycle (bin/lib/model-catalog.cjs, bin/gsd-tools.cjs, hooks/*, sdk/src/query/state-project-load.ts, sdk/src/query-gsd-tools-path.ts, sdk/src/sdk-package-compatibility.ts)."
  - "SDK bundle rebuilt because 8 OTHER sdk/src/ modules changed. Bundle carries 3 CLAUDE_PLUGIN_ROOT matches (gate expects >=2)."
  - "Plugin-owned bin/gsd-sdk wrappers + hooks/gsd-shadowing-sdk-detector.js byte-identical pre/post (sha256-verified)."
  - "commands/ exclusion honored. Plugin's commands/-absent baseline preserved."
  - "Task 5 namespace-rewrite detection ran (29 hits in /tmp/namespace-hits.txt) but ALL are false positives (18 agent .md path refs, 10 tempfile patterns, 1 URL fragment). 0 actual /gsd-<skill> command invocations to rewrite. Task skipped per plan prose (preserve agent .md filenames, /tmp/gsd-* paths, etc.). See Deviations."
  - "Task 6 (STATE.md update) skipped per executor constraints; orchestrator handles STATE.md at post-merge."
metrics:
  duration: "~10 minutes"
  completed: "2026-05-17"
---

# Quick Task 260517-fpp: Upstream GSD v1.42.3 Hotfix Sync

Pull upstream GSD v1.42.3 source tree (35-commit hotfix delta on v1.42.2) into the plugin layout, bumping plugin v2.43.2 to v2.43.3. Highlights are phase-removal logic hardening, a `plan-phase` closed-phase guard, W007 archived-phase suppression, Codex install hardening, and an Antigravity first-class runtime. All 4 in-tree plugin patches and 3 SDK source patch markers survive automatically because upstream did not touch the patched files this cycle; only `bin/lib/core.cjs` required surgical re-apply. Bundled SDK rebuilt; all 3 regression test suites green.

## Tasks executed

| # | Name | Commit | Files |
| - | ---- | ------ | ----- |
| 1 | Wholesale upstream source-tree copy + re-apply 2 core.cjs PLUGIN PATCH blocks + verify all other patches survive + rebundle sdk/dist | `3947827` | 41 files (agents/{5}, bin/lib/{8}, sdk/src/{8 incl. 1 new}, sdk/dist/{16}, workflows/{4}) |
| 2 | Bump version 2.43.2 to 2.43.3 across 3 metadata files | `3636220` | package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json |
| 3 | README.md upstream-reference refresh | `4fd6ff3` | README.md |
| 4 | CHANGELOG.md [2.43.3] entry | `604fa34` | CHANGELOG.md |
| 5 | Conditional namespace rewrite /gsd-X to /gsd:X | SKIPPED | 0 actual command refs detected (see Deviations) |

Task 6 (STATE.md update) skipped per orchestrator-handles-state constraint.

## Deviations from plan

### Auto-applied (Rule 3 — fix blocking issues)

**1. [Rule 3 - Blocking] sdk/dist tree staged wholesale (16 files, not just cli.js)**
- **Found during:** Task 1 commit staging.
- **Issue:** Plan's <files> list named only `sdk/dist/cli.js`, but `tsc` rebuilds the entire output tree including `.js.map`, `.d.ts.map`, and per-module `.js` files. Committing only `cli.js` would leave the working tree dirty and produce a bundle that disagrees with its sourcemap.
- **Fix (per plan Task 1 NOTE):** Staged `sdk/dist/` wholesale via `git add sdk/dist/`. Result: 16 sdk/dist files in the Task 1 commit (cli.js, query-gsd-tools-runtime.{js,d.ts.map,js.map}, query/{config-mutation,init,state,validate}.{js,d.ts.map,js.map}). This matches the precedent the plan called out ("the v2.43.0 sync deviated by staging sdk/dist/ wholesale").
- **Files modified:** sdk/dist/{cli.js + 15 sourcemap/per-module rebuilds}
- **Commit:** 3947827
- **Note:** Plan explicitly anticipated this deviation in Task 1 prose (NOTE block above the git-add list); deviation is documented as required-by-precedent, not unexpected.

### Plan-prose vs plan-verify gap (Rule 1 — interpret intent correctly)

**2. [Rule 1 - Plan interpretation] Task 5 SKIPPED despite 29 namespace-hits.txt lines (all false positives)**
- **Found during:** Task 5 detection step.
- **Issue:** The mandatory detection step produced 29 raw hits matching `/gsd-[a-z]` after the plan's allow-list filter. The plan's <action> prose says "skip if 0 lines" but the prose-level allow-list ("preserve `bin/gsd-sdk`, `bin/gsd-tools`, hook script names, **agent .md filenames**, `/tmp/gsd-*` paths, etc.") explicitly excludes these patterns. The plan's <verify> regex allow-list is narrower than its <action> prose intent and does not pre-exclude `agents/gsd-<name>.md`, `/tmp/gsd-worktree-*`, `gsd-user-files-backup`, `gsd-update-check.json`, or `github.com/gsd-build` URL fragments.
- **Classification of the 29 hits** (executor-applied, recorded in /tmp/namespace-hits.txt header):
  - Class P (agent .md file path refs): 18 hits, e.g. `~/.claude/agents/gsd-nyquist-auditor.md`, `agents/gsd-executor.md`. MUST PRESERVE.
  - Class T (tempfile/dir patterns): 10 hits, e.g. `${TMPDIR:-/tmp}/gsd-worktree-wave-XXXXXX.json`, `$RUNTIME_DIR/gsd-user-files-backup`, `~/.cache/gsd/gsd-update-check.json`. MUST PRESERVE.
  - Class U (URL fragment in update.md): 1 hit, `https://github.com/gsd-build/get-shit-done/blob/main/CHANGELOG.md`. MUST PRESERVE.
  - Class C (actual /gsd-<skill> command invocations): 0 hits. NOTHING TO REWRITE.
- **Fix:** Treated Task 5 as SKIP per plan prose intent. No commit. Recorded a classification header in `/tmp/namespace-hits.txt` so the orchestrator can see the breakdown at a glance.
- **Implication for the plan's <verify> gate:** The literal verify regex `grep ... | grep -v ... | grep -q .` would report "FAIL: hits" (because allow-list is incomplete for the path/tempfile patterns). The executor's interpretation (Class P/T/U preserved, Class C empty) is consistent with the plan's <done> criteria: "verify command reports zero non-allow-listed /gsd-X references" — where "non-allow-listed" includes the plan's broader prose allow-list, not just the narrower regex.
- **Files modified:** none (Task 5 skipped)
- **Commit:** none

### Style/quality

None this cycle. README and CHANGELOG diffs introduced 0 em-dashes (diff-scoped gate clean).

## Task 5 detection-step artifact

- `/tmp/namespace-hits.txt` (50 lines total: 22 lines of classification header + 29 raw hit lines) — positive proof the detection step ran.
- Raw hit count: 29. Class breakdown: 18 P + 10 T + 1 U + 0 C. No commits required.
- File-by-file breakdown (raw): update.md (8), execute-phase.md (5), ai-integration-phase.md (4), ui-phase.md (2), ingest-docs.md (2), validate-phase.md (1), ui-review.md (1), secure-phase.md (1), profile-user.md (1), execute-plan.md (1), eval-review.md (1), docs-update.md (1), discuss-phase/modes/advisor.md (1). Newly-pulled workflow files in scope of Task 1: execute-phase.md (5 new hits all paths/tempfiles), update.md (8 new hits all paths/URL); plan-phase.md (0); ultraplan-phase.md (0).

## Verification (end-to-end)

| Gate | Result |
|------|--------|
| Commit count (master..HEAD) | 4 (Tasks 1-4; Task 5 deliberately skipped per Deviation #2) |
| `[PLUGIN PATCH]` count in `bin/lib/core.cjs` | 2 (gate: >= 2) |
| `resolveGsdRoot` present in core.cjs | yes |
| `function getAgentsDir` present in core.cjs | yes |
| `#PLUGIN-MODEL-CATALOG-PATH` in model-catalog.cjs | yes (untouched, survived auto) |
| `#PLUGIN-HOOK-CONTEXT-MONITOR` in gsd-context-monitor.js | yes (untouched, survived auto) |
| 4 dispatch cases in bin/gsd-tools.cjs | yes: write-phase-memory, checkpoint, hook, migrate (untouched, survived auto) |
| `[PLUGIN PATCH]` in sdk/src/query/state-project-load.ts | yes (untouched, survived auto) |
| `[PLUGIN PATCH]` in sdk/src/query-gsd-tools-path.ts | yes (untouched, survived auto) |
| `[PLUGIN PATCH]` in sdk/src/sdk-package-compatibility.ts | yes (untouched, survived auto) |
| bin/gsd-sdk sha256 unchanged | yes (8177abd6...) |
| bin/gsd-sdk.cmd sha256 unchanged | yes (1bdafc97...) |
| hooks/gsd-shadowing-sdk-detector.js sha256 unchanged | yes (1b07f0e1...) |
| commands/ absent | yes |
| sdk/dist/cli.js size | 1,662,564 bytes (gate: >= 1,400,000) |
| sdk/dist/cli.js CLAUDE_PLUGIN_ROOT matches | 3 (gate: >= 2) |
| tests/mcp-stdio-framing.test.cjs | PASS (8 tools) |
| tests/workspace-json-integration.test.cjs | PASS (22 checks) |
| tests/hooks-smoke.test.cjs | PASS (16/16 including v2.43.1 shadowing-sdk-detector cases) |
| Version in package.json | "2.43.3" |
| Version in .claude-plugin/plugin.json | "2.43.3" |
| Version in .claude-plugin/marketplace.json | "2.43.3" |
| Stale "2.43.2" references in 3 metadata files | 0 |
| CHANGELOG [2.43.3] section present + dated 2026-05-17 | yes |
| CHANGELOG section order ([2.43.3] above [2.43.2]) | yes |
| README header references GSD 1.42.3 | yes |
| README header has no stale GSD 1.42.2 | yes |
| Em-dashes introduced in README diff | 0 (diff-scoped gate clean) |
| Em-dashes introduced in CHANGELOG [2.43.3] diff | 0 (diff-scoped gate clean) |
| Worktree clean (modulo .planning) | yes |

## What changed upstream (35-commit delta v1.42.2..v1.42.3)

Pulled cherry-picks (selected highlights, see CHANGELOG [2.43.3] for full list):

- **Phase removal logic hardening** (#3599, #3600, #3601, #3602): prefixed-phase headings as section boundaries, peer-depth decimal phase preservation, slugged plan-ref renumbering, project-code-prefixed phase dir counting in milestone filter.
- **plan-phase gated on closed phases** (#3569): init.plan-phase surfaces phase_status, /gsd:plan-phase errors on closed phases.
- **W007 warning ignores archived phases** (#3560).
- **Codex install hardening** (#3610): bundled hooks leftovers.
- **Installer migration env override**: GSD_INSTALLER_MIGRATION_DIR honored.
- **Antigravity first-class runtime** (#3608) in update.md.
- **bug-3591 gsdtools-runtime-workstream test**: new sdk/src test file added by upstream.

## Self-Check: PASSED

- agents/{gsd-executor.md, gsd-phase-researcher.md, gsd-planner.md, gsd-research-synthesizer.md, gsd-roadmapper.md}: FOUND
- bin/lib/{commands.cjs, config.cjs, core.cjs, init.cjs, installer-migration-report.cjs, phase-command-router.cjs, phase.cjs, roadmap.cjs}: FOUND
- sdk/src/bug-3591-gsdtools-runtime-workstream.test.ts: FOUND (new file)
- sdk/dist/cli.js: FOUND (1,662,564 bytes)
- workflows/{execute-phase.md, plan-phase.md, ultraplan-phase.md, update.md}: FOUND
- CHANGELOG.md [2.43.3] section: FOUND
- README.md GSD 1.42.3 header: FOUND
- /tmp/namespace-hits.txt: FOUND (50 lines incl. classification header)
- Commit 3947827 (Task 1): FOUND in git log
- Commit 3636220 (Task 2): FOUND in git log
- Commit 4fd6ff3 (Task 3): FOUND in git log
- Commit 604fa34 (Task 4): FOUND in git log
