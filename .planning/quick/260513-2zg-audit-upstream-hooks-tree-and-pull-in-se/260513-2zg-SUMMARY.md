---
phase: 260513-2zg
plan: 01
status: complete
subsystem: hooks
tags: [hooks, security, upstream-pull-in, defense-in-depth, hybrid-architecture]
dependency_graph:
  requires: []
  provides: [hook-prompt-guard, hook-workflow-guard, hook-read-guard, hook-read-injection-scanner, hook-validate-commit, hook-phase-boundary, hook-context-monitor, hook-session-state]
  affects: [hooks/hooks.json, hooks/, tests/hooks-smoke.test.cjs, CHANGELOG.md, package.json, .claude-plugin/plugin.json, .claude-plugin/marketplace.json, README.md, .planning/STATE.md]
tech_stack:
  added: [hooks/lib/git-cmd.js, hooks/gsd-prompt-guard.js, hooks/gsd-workflow-guard.js, hooks/gsd-read-guard.js, hooks/gsd-read-injection-scanner.js, hooks/gsd-validate-commit.sh, hooks/gsd-phase-boundary.sh, hooks/gsd-context-monitor.js, hooks/gsd-session-state.sh, tests/hooks-smoke.test.cjs]
  patterns: [hybrid-hooks, individual-script-pattern, soft-warn-default, plugin-layout-patch]
key_files:
  created:
    - hooks/gsd-prompt-guard.js
    - hooks/gsd-workflow-guard.js
    - hooks/gsd-read-guard.js
    - hooks/gsd-read-injection-scanner.js
    - hooks/gsd-validate-commit.sh
    - hooks/gsd-phase-boundary.sh
    - hooks/gsd-context-monitor.js
    - hooks/gsd-session-state.sh
    - hooks/lib/git-cmd.js
    - tests/hooks-smoke.test.cjs
  modified:
    - hooks/hooks.json
    - package.json
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
    - README.md
    - CHANGELOG.md
    - .planning/STATE.md
decisions:
  - "8 hooks pulled in (not 9). gsd-check-update.js excluded after source review: its detectConfigDir() looks for get-shit-done/VERSION which doesn't exist in the plugin's flat layout, and it duplicates /plugin marketplace update."
  - "Only 1 layout patch needed (#PLUGIN-HOOK-CONTEXT-MONITOR on gsd-context-monitor.js). Other 7 scripts are plug-and-play in the plugin's flat layout."
  - "Soft-warn is already the upstream default for all 8 scripts. CONTEXT.md decision honored trivially with zero code change. The lone blocker (gsd-validate-commit.sh exiting 2 on bad commits) is gated behind opt-in hooks.community: true."
  - "Hybrid architecture: existing 5 dispatcher entries preserved byte-for-byte; 8 new individual-script entries added alongside. Final event tree: SessionStart:2, PreToolUse:5, PostToolUse:4, PreCompact:1, Stop:1 (13 total entries vs prior 5)."
metrics:
  duration: ~30min (planner + executor)
  completed: "2026-05-13"
---

# Quick Task 260513-2zg: Hook Audit + Pull-In Summary

**One-liner:** Pulled in 8 upstream security/correctness hook scripts (from gsd-build/get-shit-done@v1.41.2 hooks/) into the plugin's hooks/ tree with a single layout patch on gsd-context-monitor.js. Hybrid architecture: existing 5 dispatcher entries preserved, 8 new individual-script entries registered alongside. Soft-warn enforcement honored by upstream default. Shipped as v2.42.6.

## Tasks Completed (6 commits)

| # | Task | Commit | Key changes |
|---|------|--------|-------------|
| 1 | Copy 8 upstream hook scripts + lib/git-cmd.js with layout patch | 7dab294 | 9 new files in hooks/, 1 [PLUGIN PATCH] on gsd-context-monitor.js (#PLUGIN-HOOK-CONTEXT-MONITOR) |
| 2 | Register 8 new individual-script hooks in hooks.json alongside dispatcher | 6ac8807 | hooks.json restructured to hybrid pattern, 5 existing dispatcher entries preserved byte-for-byte |
| 3 | Add spawn-based smoke test for the 8 pulled-in hook scripts | 29a5ecd | tests/hooks-smoke.test.cjs (13 sub-cases) |
| 4 | Bump plugin version 2.42.5 → 2.42.6; CHANGELOG; README | 346d517 | package.json + plugin.json + README; CHANGELOG [2.42.6] section. marketplace.json missed by executor, fixed post-merge. |
| 5a | Record quick task in STATE.md | 39cff42 | New row in Quick Tasks Completed, last_activity bumped |
| 5b | Record actual commit SHA in STATE.md row | 5f825df | SHA fixup |
| — | Worktree merge | ea6e8ea | Orchestrator-level merge commit (--no-ff) |

## Deviations from Plan

**One minor miss recovered post-merge.** `.claude-plugin/marketplace.json` version bump was missed by the executor (it modified package.json + plugin.json + README but not marketplace.json). Fixed inline after the worktree merge.

**One non-failure note from the executor.** Early in Task 1, several `cd /Users/jnuyens/src/gsd-plugin && ...` commands ran in the main repo instead of the worktree because each Bash call's `cd` reset the cwd. Caught immediately by the worktree-pre-commit HEAD assertion (protected-ref refusal — the #2924 guard worked as designed). The executor recovered cleanly by `mv`-ing all Task 1 artifacts from main repo to worktree and switching to `git -C "$WT" ...` + absolute worktree paths for all subsequent commands. No work lost; no protected refs touched.

## Verification

- **All 13 hooks-smoke sub-cases pass** (`tests/hooks-smoke.test.cjs`)
- **Regression fence holds**: `tests/mcp-stdio-framing.test.cjs` passes, `tests/workspace-json-integration.test.cjs` 22/22 passes
- **All .js hooks pass `node --check`**; all .sh hooks pass `bash -n`
- **File-layout drift baseline matches** (131/131/0)
- **Plugin patches inventory updated** (memory/feedback_plugin_patches_inventory.md) with the new #PLUGIN-HOOK-CONTEXT-MONITOR patch
- **Working tree clean** post-merge

## Known Stubs

None.

## Self-Check: PASSED

- [x] 8 hook scripts present in hooks/ (gsd-prompt-guard, gsd-workflow-guard, gsd-read-guard, gsd-read-injection-scanner, gsd-validate-commit, gsd-phase-boundary, gsd-context-monitor, gsd-session-state)
- [x] hooks/lib/git-cmd.js present (support for gsd-validate-commit.sh)
- [x] hooks/hooks.json registers 13 entries total (5 dispatcher + 8 individual-script)
- [x] #PLUGIN-HOOK-CONTEXT-MONITOR patch present in hooks/gsd-context-monitor.js
- [x] package.json + plugin.json + marketplace.json + README all say 2.42.6
- [x] CHANGELOG.md has `## [2.42.6] - 2026-05-13` section
- [x] tests/hooks-smoke.test.cjs exists and passes 13/13
- [x] STATE.md has 260513-2zg row in Quick Tasks Completed
- [x] All regression tests pass
