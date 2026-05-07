---
phase: 260507-esn
plan: 01
status: complete
subsystem: upstream-sync-planning
tags: [sync, upstream, planning, v1.41.0, plan-only]
dependency_graph:
  requires: []
  provides: [upstream-1.41.0-sync-plan]
  affects: [.planning/STATE.md]
tech_stack:
  added: []
  patterns: [delta-inventory, 3-way-merge, wholesale-copy, plan-document]
key_files:
  created:
    - .planning/quick/260507-esn-there-is-a-new-upstream-version-see-what/260507-esn-PLAN.md
    - .planning/quick/260507-esn-there-is-a-new-upstream-version-see-what/260507-esn-SUMMARY.md
  modified:
    - .planning/STATE.md
decisions:
  - "Quick task scope is PLANNING ONLY — produces 260507-esn-PLAN.md describing the v1.40.0 → v1.41.0 sync. Execution deferred to a follow-up user-invoked /gsd:execute-plan or a fresh /gsd:quick run."
  - "Plan mirrors the proven 6-commit cadence from quick-260503-ier (the v1.40.0 sync) — same task structure, adapted to v1.41.0 deltas."
  - "Three plugin-only items added vs prior sync template: (1) GSD_AGENTS_DIR / getAgentsDir helper added to core.cjs 3-way merge (this patch was added after the 1.40.0 sync, so it's the first cycle to carry it); (2) skills/mvp-phase/SKILL.md — new plugin skill needed because upstream ships workflows/mvp-phase.md but commands/ is plugin-owned; (3) verified bin/gsd-tools.cjs is UNTOUCHED upstream this cycle, so its four patched cases need no re-application (regression grep only)."
  - "commands/, hooks/, sdk/, docs/ all stay excluded from the sync (per memory feedback). Upstream hooks/ deltas (5 modified + 1 added) are noted as out-of-scope review items in PLAN.md output section."
metrics:
  duration: ~25min
  completed: "2026-05-07"
---

# Quick Task 260507-esn: Investigate v1.41.0 upstream and produce update plan

**One-liner:** Investigated upstream `gsd-build/get-shit-done` v1.41.0 (released 2026-05-07), inventoried the delta against the plugin's current v1.40.0 base, and produced `260507-esn-PLAN.md` describing a 6-commit sync to plugin v2.41.0 — modelled on the previously-successful quick-260503-ier sync.

## Findings

| Bucket | Count | Notes |
|---|---|---|
| New workflows | 4 | `add-backlog`, `debug`, `mvp-phase`, `thread` |
| New references | 8 | All MVP / SPIDR / user-story / worktree-path-safety |
| Modified workflows (top-level) | 33 | Plus 3 nested under `discuss-phase/modes/` and `execute-phase/steps/` |
| Modified `bin/lib/` files | 13 | Including `core.cjs` (only patched file with upstream changes — needs 3-way merge) |
| New `bin/lib/` files | 1 | `runtime-homes.cjs` |
| Modified agents | 7 | `gsd-codebase-mapper`, `gsd-debug-session-manager`, `gsd-executor`, `gsd-plan-checker`, `gsd-planner`, `gsd-roadmapper`, `gsd-verifier` |
| Modified templates | 1 | `templates/README.md` |
| Renamed | 1 | `workflows/extract_learnings.md` → `extract-learnings.md` (R100, content identical) |
| Deletions in plugin scope | 0 | None |

**Headline upstream feature:** `/gsd:mvp-phase` — vertical-slice MVP planning + TDD execution + UAT verification. Plugin needs to add a new `skills/mvp-phase/SKILL.md` (using `skills/plan-phase/` as template) so the command is exposed.

**Critical patches to preserve in `bin/lib/core.cjs`** (verified present in current tree):
- `resolveGsdRoot()` (line 25) — `CLAUDE_PLUGIN_ROOT` resolution
- `resolveGsdDataDir()` (line 41)
- `resolveGsdAsset()` (line 48)
- `getAgentsDir()` w/ `GSD_AGENTS_DIR` override (line 1296) — **first sync cycle to carry this patch**

**`bin/gsd-tools.cjs` UNTOUCHED upstream this cycle** — verified via `git diff --stat v1.40.0..v1.41.0`. Its four patched cases (`write-phase-memory`, `checkpoint`, `hook`, `migrate`) need no re-application; Task 1 verify step has a regression grep as a safety fence.

## Plan structure (6 commits, mirrors quick-260503-ier)

1. `feat(quick-260507-esn): sync upstream GSD v1.41.0 source tree` — wholesale + 3-way merge for core.cjs + new files + git mv for the rename + new skills/mvp-phase/SKILL.md.
2. `chore(quick-260507-esn): bump plugin version 2.40.1 -> 2.41.0` — package.json + plugin.json + marketplace.json.
3. `docs(quick-260507-esn): update README + PROJECT.md for v1.41.0 sync`.
4. `docs(quick-260507-esn): add CHANGELOG entry for 2.41.0`.
5. `chore(quick-260507-esn): post-sync namespace rewrite` — **conditional**, skip if rewriter is a no-op.
6. `docs(quick-260507-esn): record v1.41.0 sync in STATE`.

## Out of Scope (Deferred)

- Upstream `hooks/` deltas (5 modified + 1 added file) — `gsd-check-update-worker.js` Windows shell:true (#3102), `gsd-statusline.js` 100%/next_phases parsing (#3154), new `hooks/lib/git-cmd.js` token-walk classifier (#3129). Plugin's `hooks/` is NOT auto-synced; needs separate review against plugin's `hooks.json` registry.
- Audit whether any synced workflow uses `bin/lib/runtime-homes.cjs` in a way the plugin's `getAgentsDir`/`resolveGsdRoot` resolution doesn't satisfy.

## Verification of this Quick Task (planning task, not implementation task)

- [x] `260507-esn-PLAN.md` created with 6-task structure mirroring prior sync
- [x] Delta inventory verified via direct `git diff --name-status v1.40.0..v1.41.0` against fresh upstream clone
- [x] Plugin patches confirmed present in current tree (grep for `resolveGsdRoot`, `getAgentsDir`, `case 'write-phase-memory'`, `case 'migrate'`)
- [x] `bin/gsd-tools.cjs` confirmed UNTOUCHED upstream this cycle
- [x] Versioning rule applied: upstream `1.41.0` → plugin `2.41.0`
- [x] Excluded directories (commands/, hooks/, sdk/, docs/) per memory feedback

## Next Step

Execute the plan with either:
- `/gsd:execute-plan .planning/quick/260507-esn-there-is-a-new-upstream-version-see-what/260507-esn-PLAN.md`, or
- A fresh `/gsd:quick "execute the v1.41.0 sync plan"` which will pick up `260507-esn-PLAN.md` as input.

Estimated execution time: ~15min (matches the 1.40.0 sync's actual duration).
