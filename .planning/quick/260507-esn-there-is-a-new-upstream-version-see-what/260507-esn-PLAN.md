---
phase: 260507-esn
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # === 3-WAY MERGE (plugin patches preserved) ===
  - bin/lib/core.cjs
  # === WHOLESALE bin/lib (no plugin patches) ===
  - bin/lib/artifacts.cjs
  - bin/lib/config-schema.cjs
  - bin/lib/graphify.cjs
  - bin/lib/init.cjs
  - bin/lib/milestone.cjs
  - bin/lib/phase-command-router.cjs
  - bin/lib/phase.cjs
  - bin/lib/profile-output.cjs
  - bin/lib/roadmap.cjs
  - bin/lib/state-command-router.cjs
  - bin/lib/state.cjs
  - bin/lib/verify.cjs
  # === ADD bin/lib helpers ===
  - bin/lib/runtime-homes.cjs
  # === WHOLESALE templates ===
  - templates/README.md
  # === WHOLESALE agents ===
  - agents/gsd-codebase-mapper.md
  - agents/gsd-debug-session-manager.md
  - agents/gsd-executor.md
  - agents/gsd-plan-checker.md
  - agents/gsd-planner.md
  - agents/gsd-roadmapper.md
  - agents/gsd-verifier.md
  # === RENAME ===
  - workflows/extract_learnings.md  # GIT MV → workflows/extract-learnings.md
  # === WHOLESALE workflows (top-level, 36 files) ===
  - workflows/ai-integration-phase.md
  - workflows/audit-fix.md
  - workflows/audit-milestone.md
  - workflows/code-review-fix.md
  - workflows/code-review.md
  - workflows/diagnose-issues.md
  - workflows/discuss-phase-assumptions.md
  - workflows/discuss-phase.md
  - workflows/docs-update.md
  - workflows/execute-phase.md
  - workflows/execute-plan.md
  - workflows/explore.md
  - workflows/help.md
  - workflows/import.md
  - workflows/ingest-docs.md
  - workflows/manager.md
  - workflows/map-codebase.md
  - workflows/new-milestone.md
  - workflows/new-project.md
  - workflows/next.md
  - workflows/plan-phase.md
  - workflows/progress.md
  - workflows/quick.md
  - workflows/resume-project.md
  - workflows/scan.md
  - workflows/secure-phase.md
  - workflows/settings.md
  - workflows/stats.md
  - workflows/ui-phase.md
  - workflows/ui-review.md
  - workflows/update.md
  - workflows/validate-phase.md
  - workflows/verify-work.md
  # === WHOLESALE workflow sub-files ===
  - workflows/discuss-phase/modes/advisor.md
  - workflows/execute-phase/steps/codebase-drift-gate.md
  - workflows/execute-phase/steps/per-plan-worktree-gate.md
  # === ADD new workflows ===
  - workflows/add-backlog.md
  - workflows/debug.md
  - workflows/mvp-phase.md
  - workflows/thread.md
  # === ADD new references (MVP support) ===
  - references/execute-mvp-tdd.md
  - references/mvp-concepts.md
  - references/planner-mvp-mode.md
  - references/skeleton-template.md
  - references/spidr-splitting.md
  - references/user-story-template.md
  - references/verify-mvp-mode.md
  - references/worktree-path-safety.md
  # === ADD new skill (so /gsd:mvp-phase is exposed) ===
  - skills/mvp-phase/SKILL.md
  # === Version + docs ===
  - package.json
  - .claude-plugin/plugin.json
  - .claude-plugin/marketplace.json
  - README.md
  - .planning/PROJECT.md
  - CHANGELOG.md
  - .planning/STATE.md
autonomous: false
requirements:
  - QUICK-260507-esn-sync-upstream-1.41.0
must_haves:
  truths:
    - "Plugin reports version 2.41.0 in package.json, plugin.json, marketplace.json"
    - "README and PROJECT.md reference upstream GSD 1.41.0"
    - "Plugin's bundled get-shit-done sources match upstream get-shit-done 1.41.0"
    - "Plugin patches survive in bin/lib/core.cjs (resolveGsdRoot, resolveGsdDataDir, resolveGsdAsset, getAgentsDir + GSD_AGENTS_DIR override)"
    - "Plugin patches in bin/gsd-tools.cjs are untouched (upstream did NOT modify gsd-tools.cjs in v1.41.0; verify intact)"
    - "workflows/extract_learnings.md is renamed to workflows/extract-learnings.md (git mv preserves history)"
    - "bin/lib/runtime-homes.cjs is added (new in upstream 1.41.0)"
    - "4 new workflows exist: add-backlog.md, debug.md, mvp-phase.md, thread.md"
    - "8 new MVP-supporting references exist under references/"
    - "skills/mvp-phase/SKILL.md is added (so /gsd:mvp-phase is user-invocable)"
    - "CHANGELOG.md has [2.41.0] entry above [2.40.1]"
    - "node -c passes for every bin/*.cjs and bin/lib/*.cjs"
  artifacts:
    - path: "package.json"
      contains: "\"version\": \"2.41.0\""
    - path: ".claude-plugin/plugin.json"
      contains: "\"version\": \"2.41.0\""
    - path: ".claude-plugin/marketplace.json"
      contains: "\"version\": \"2.41.0\""
    - path: "bin/lib/core.cjs"
      contains: "resolveGsdRoot"
    - path: "bin/lib/core.cjs"
      contains: "getAgentsDir"
    - path: "bin/gsd-tools.cjs"
      contains: "case 'write-phase-memory'"
    - path: "bin/gsd-tools.cjs"
      contains: "case 'migrate'"
    - path: "bin/lib/runtime-homes.cjs"
      provides: "new upstream 1.41.0 helper"
    - path: "workflows/mvp-phase.md"
      provides: "new upstream 1.41.0 workflow"
    - path: "workflows/extract-learnings.md"
      provides: "renamed from extract_learnings.md (hyphen-cased)"
  key_links:
    - from: "bin/lib/core.cjs"
      to: "process.env.CLAUDE_PLUGIN_ROOT"
      via: "resolveGsdRoot()"
    - from: "bin/lib/core.cjs"
      to: "process.env.GSD_AGENTS_DIR"
      via: "getAgentsDir()"
---

<objective>
Sync upstream `gsd-build/get-shit-done` **v1.41.0** (released 2026-05-07) into the plugin tree on top of the current 2.40.1 (= upstream 1.40.0) base. Mirrors the well-trodden 6-commit pattern from quick-260503-ier (the 1.40.0 sync), adapted to the v1.41.0 delta. Bump plugin version to **2.41.0**. The orchestrator handles `git push origin master` after executor returns.

**Versioning rule** (per `README § Versioning`): `plugin_minor = upstream_minor`. So upstream `1.41.0` → plugin `2.41.0`.

**Upstream tarball already extracted** at `/tmp/gsd-upstream-check/` (cloned via `gh repo clone gsd-build/get-shit-done -- --depth 50`, tag `v1.41.0` is HEAD; comparison base is tag `v1.40.0`). The plan instructs the executor to re-clone if the cache is missing.
</objective>

<release_summary>
**Headline**: MVP phase support — a new `/gsd:mvp-phase` workflow plus a planner MVP mode and verifier MVP-UAT section. Adds SPIDR splitting + user-story scaffolding under `references/`.

**Other notable upstream work** (from <https://github.com/gsd-build/get-shit-done/releases/tag/v1.41.0>):
- 4 new workflows: `add-backlog`, `debug`, `mvp-phase`, `thread` (the first three were already exposed as plugin skills via `/gsd:add-backlog`, `/gsd:debug`, `/gsd:thread`; upstream now ships the workflow files themselves; plugin gains the workflow bodies they reference).
- New `bin/lib/runtime-homes.cjs` — runtime-aware `globalSkillsBase` resolution (replaces hardcoded paths, fix #3126).
- Workflow rename `extract_learnings.md` → `extract-learnings.md` (snake → kebab).
- 7 agent-prompt updates (`gsd-codebase-mapper`, `gsd-debug-session-manager`, `gsd-executor`, `gsd-plan-checker`, `gsd-planner`, `gsd-roadmapper`, `gsd-verifier`).
- ~33 modified workflows + 3 modified workflow sub-step files.
- Cross-cutting refactors in `sdk/` (don't affect this plugin tree — plugin pulls SDK from `@gsd-build/sdk` npm; SDK install handled by `/gsd:update`).
- Bug fixes: `roadmap.cjs` plan-count for nested `{N}-PLAN-{NN}-{slug}.md` layout (#3128); `state.begin-phase` idempotent on mid-flight phases (#3127); milestone version-resolution fix (#3109); STATE narrative-tail normalisation (#3122).
</release_summary>

<delta_inventory>
Computed via `git diff --name-status v1.40.0..v1.41.0` inside the upstream clone, filtered to plugin-mapped paths.

**bin/** (1 add, 13 modified):
- ADD: `bin/lib/runtime-homes.cjs` (new in 1.41.0)
- 3-WAY MERGE: `bin/lib/core.cjs` (preserve patched helpers: `resolveGsdRoot`, `resolveGsdDataDir`, `resolveGsdAsset`, plus `getAgentsDir` w/ `GSD_AGENTS_DIR` env override; preserve their `module.exports` entries — see `<plugin_patches_to_preserve>`)
- WHOLESALE 12: `bin/lib/artifacts.cjs`, `config-schema.cjs`, `graphify.cjs`, `init.cjs`, `milestone.cjs`, `phase-command-router.cjs`, `phase.cjs`, `profile-output.cjs`, `roadmap.cjs`, `state-command-router.cjs`, `state.cjs`, `verify.cjs`
- **NOT TOUCHED upstream**: `bin/gsd-tools.cjs` (verified: `git diff --stat v1.40.0..v1.41.0 -- get-shit-done/bin/gsd-tools.cjs` reports zero changes). The four plugin-only switch cases (`write-phase-memory`, `checkpoint`, `hook`, `migrate`) need NO re-application this cycle, but a sanity grep at the end of Task 1 still asserts they are present.

**templates/** (1 file, wholesale): `templates/README.md`

**agents/** (7 files, wholesale): `gsd-codebase-mapper.md`, `gsd-debug-session-manager.md`, `gsd-executor.md`, `gsd-plan-checker.md`, `gsd-planner.md`, `gsd-roadmapper.md`, `gsd-verifier.md`

**workflows/** (36 modified at top level, 3 modified nested, 4 added, 1 renamed):
- ADD 4: `add-backlog.md`, `debug.md`, `mvp-phase.md`, `thread.md`
- RENAME 1: `extract_learnings.md` → `extract-learnings.md` (git mv to preserve history; content identical, R100)
- WHOLESALE 33 top-level: `ai-integration-phase`, `audit-fix`, `audit-milestone`, `code-review-fix`, `code-review`, `diagnose-issues`, `discuss-phase-assumptions`, `discuss-phase`, `docs-update`, `execute-phase`, `execute-plan`, `explore`, `help`, `import`, `ingest-docs`, `manager`, `map-codebase`, `new-milestone`, `new-project`, `next`, `plan-phase`, `progress`, `quick`, `resume-project`, `scan`, `secure-phase`, `settings`, `stats`, `ui-phase`, `ui-review`, `update`, `validate-phase`, `verify-work`
- WHOLESALE 3 nested: `discuss-phase/modes/advisor.md`, `execute-phase/steps/codebase-drift-gate.md`, `execute-phase/steps/per-plan-worktree-gate.md`

**references/** (8 added, 0 modified, 0 removed): `execute-mvp-tdd.md`, `mvp-concepts.md`, `planner-mvp-mode.md`, `skeleton-template.md`, `spidr-splitting.md`, `user-story-template.md`, `verify-mvp-mode.md`, `worktree-path-safety.md`. (All eight are pure adds; no existing reference file changed in v1.41.0.)

**skills/** (1 added by plugin, NOT from upstream):
- ADD: `skills/mvp-phase/SKILL.md` — new skill descriptor so `/gsd:mvp-phase` is exposed in the plugin's command surface. Upstream ships the workflow but the plugin owns its own `skills/` registry. Use `skills/plan-phase/SKILL.md` as a template (similar phase-style command).

**Source mapping** (same as prior sync): upstream `get-shit-done/<dir>/<file>` → plugin `<dir>/<file>`. So `/tmp/gsd-upstream-check/get-shit-done/bin/lib/init.cjs` → `bin/lib/init.cjs`. **Exception**: agents live at upstream `agents/` (not under `get-shit-done/`), so source is `/tmp/gsd-upstream-check/agents/`.

**Excluded from sync** (PLUGIN-OWNED — per memory feedback "no bundled commands/", reaffirmed across syncs):
- `commands/` — never copied (plugin's command surface comes from `skills/`)
- `hooks/` — upstream changed 5 hook files (`gsd-check-update-worker.js`, `gsd-phase-boundary.sh`, `gsd-session-state.sh`, `gsd-statusline.js`, `gsd-validate-commit.sh`) and added `hooks/lib/git-cmd.js`. Plugin runs hooks via its own `hooks.json` registry; do NOT copy upstream `hooks/` files. **Defer for a later, separate review** if any of the upstream hook fixes (e.g. `git-cmd.js` token-walk classifier from #3129, Windows shell:true fix from #3102, statusline 100% / next_phases parse from #3154) materially affect plugin behaviour. Out of scope for this sync.
- `sdk/`, `docs/`, `.changeset/`, root `README.*`, `CONTEXT.md`, `CONTRIBUTING.md`, `.gitignore`, `.github/`, `.clinerules`
</delta_inventory>

<plugin_patches_to_preserve>

**bin/lib/core.cjs** — four helper functions and their `module.exports` entries. Verified present in current plugin tree at lines 25, 41, 48, 1296 (via `grep -nE "resolveGsd(Root|DataDir|Asset)|getAgentsDir|GSD_AGENTS_DIR" bin/lib/core.cjs`):

1. `resolveGsdRoot()` — checks `process.env.CLAUDE_PLUGIN_ROOT`, falls back to plugin install root.
2. `resolveGsdDataDir()` — wraps `resolveGsdRoot()`.
3. `resolveGsdAsset(...segments)` — `path.join(resolveGsdRoot(), ...segments)`.
4. `getAgentsDir()` — checks `process.env.GSD_AGENTS_DIR`, then `resolveGsdRoot()/agents`. **This patch did not exist at the 1.40.0 sync** — it was added later (the `#PLUGIN-AGENTS-DIR` patch referenced in `workflows/quick.md` to fix `agents_installed:false` warnings under plugin install). It MUST be carried into 1.41.0.

All four names must appear in the file's `module.exports` block at the bottom of `core.cjs`.

Workflow for the 3-way merge (Task 1, step 6a):
1. Capture the current plugin patch bodies BEFORE overwrite:
   ```bash
   git show HEAD:bin/lib/core.cjs > /tmp/plugin-core-pre.cjs
   ```
2. Wholesale-copy upstream over: `cp /tmp/gsd-upstream-check/get-shit-done/bin/lib/core.cjs bin/lib/core.cjs`
3. Re-insert the four patched helpers and their exports surgically with `Edit`. Reference `/tmp/plugin-core-pre.cjs` lines 25-50 for `resolveGsdRoot/DataDir/Asset` (~25 LoC) and 1290-1320 for `getAgentsDir` (~30 LoC).
4. Verify: `grep -q "resolveGsdRoot\b" bin/lib/core.cjs && grep -q "getAgentsDir\b" bin/lib/core.cjs && grep -q "GSD_AGENTS_DIR" bin/lib/core.cjs && node -c bin/lib/core.cjs`.

**bin/gsd-tools.cjs** — UNTOUCHED upstream this cycle. Plugin's four patched dispatch cases (`'write-phase-memory'`, `'checkpoint'`, `'hook'`, `'migrate'`) remain at lines 1168, 1178, 1186, 1326 (verified via grep). **No re-application needed** — but Task 1's verify step still asserts the cases are present, as a regression fence against accidental breakage during the sync.

</plugin_patches_to_preserve>

<commit_pattern>

Mirror the 6-commit cadence from quick-260503-ier (the 1.40.0 sync), substituting the new task ID:

1. `feat(quick-260507-esn): sync upstream GSD v1.41.0 source tree` — all source-tree changes (`bin/`, `references/`, `templates/`, `agents/`, `workflows/`), the rename of `extract_learnings.md`, the 4 new workflows, the 8 new references, the new `bin/lib/runtime-homes.cjs`, and the new `skills/mvp-phase/SKILL.md`.
2. `chore(quick-260507-esn): bump plugin version 2.40.1 -> 2.41.0` — `package.json`, `plugin.json`, `marketplace.json` (3 files).
3. `docs(quick-260507-esn): update README + PROJECT.md for v1.41.0 sync` — `README` based-on line + plugin-version line; `PROJECT.md` context line + footer timestamp.
4. `docs(quick-260507-esn): add CHANGELOG entry for 2.41.0` — new `## [2.41.0] - 2026-05-07 (based on upstream GSD 1.41.0)` section above `[2.40.1]`. Use the `[2.40.0]` entry as template. Highlight: MVP phase, new workflows, runtime-homes helper, rename, agent updates.
5. `chore(quick-260507-esn): post-sync namespace rewrite /gsd-<skill> -> /gsd:<skill>` — run `node bin/maintenance/rewrite-command-namespace.cjs`. **CONDITIONAL**: if it produces zero changes, SKIP this commit.
6. `docs(quick-260507-esn): record v1.41.0 sync in STATE` — append a row to STATE.md "Quick Tasks Completed" table; bump `last_activity` and `last_updated`.

</commit_pattern>

<tasks>

<task type="auto">
  <name>Task 1: Sync source tree (commit 1)</name>
  <action>
Operate from `/Users/jnuyens/src/gsd-plugin/`.

1. **Confirm upstream cache exists**:
   ```bash
   if [ ! -d /tmp/gsd-upstream-check ] || [ ! -f /tmp/gsd-upstream-check/get-shit-done/bin/lib/core.cjs ]; then
     rm -rf /tmp/gsd-upstream-check
     gh repo clone gsd-build/get-shit-done /tmp/gsd-upstream-check -- --depth 50 --quiet
   fi
   git -C /tmp/gsd-upstream-check rev-parse v1.41.0 >/dev/null  # assert tag exists
   ```
   `SRC=/tmp/gsd-upstream-check`.

2. **Snapshot current plugin patches** (before any overwrite):
   ```bash
   git show HEAD:bin/lib/core.cjs > /tmp/plugin-core-pre.cjs
   ```

3. **WHOLESALE COPIES — bin/lib/** (12 files, no patches in any of them):
   ```bash
   for f in artifacts config-schema graphify init milestone phase-command-router phase profile-output roadmap state-command-router state verify; do
     cp "$SRC/get-shit-done/bin/lib/$f.cjs" "bin/lib/$f.cjs"
   done
   ```

4. **ADD new bin file**:
   ```bash
   cp "$SRC/get-shit-done/bin/lib/runtime-homes.cjs" bin/lib/runtime-homes.cjs
   ```

5. **3-WAY MERGE — bin/lib/core.cjs** (the only patched file changed upstream):
   ```bash
   cp "$SRC/get-shit-done/bin/lib/core.cjs" bin/lib/core.cjs
   ```
   Then surgically re-insert the four plugin helpers using the body from `/tmp/plugin-core-pre.cjs`:
   - `resolveGsdRoot` (lines 25-39 of pre-snapshot)
   - `resolveGsdDataDir` (lines 41-46)
   - `resolveGsdAsset` (lines 48-50)
   - `getAgentsDir` block w/ `GSD_AGENTS_DIR` override (lines 1290-1320)

   Strategy: open the upstream-overwritten `bin/lib/core.cjs`, find a stable insertion landmark (e.g. immediately after the `'use strict';` and require block, before the first existing exported helper). Insert the three resolver helpers there. Append `getAgentsDir` near the bottom of the file, before `module.exports = {...}`. Add all four names to the export object.

   Verify before continuing:
   ```bash
   grep -q "resolveGsdRoot\b" bin/lib/core.cjs
   grep -q "resolveGsdDataDir\b" bin/lib/core.cjs
   grep -q "resolveGsdAsset\b" bin/lib/core.cjs
   grep -q "getAgentsDir\b" bin/lib/core.cjs
   grep -q "GSD_AGENTS_DIR" bin/lib/core.cjs
   grep -q "CLAUDE_PLUGIN_ROOT" bin/lib/core.cjs
   node -c bin/lib/core.cjs  # syntax check
   ```

6. **WHOLESALE COPY — templates/**:
   ```bash
   cp "$SRC/get-shit-done/templates/README.md" templates/README.md
   ```

7. **WHOLESALE COPIES — agents/** (upstream `agents/` is at REPO ROOT, not under `get-shit-done/`):
   ```bash
   for f in gsd-codebase-mapper gsd-debug-session-manager gsd-executor gsd-plan-checker gsd-planner gsd-roadmapper gsd-verifier; do
     cp "$SRC/agents/$f.md" "agents/$f.md"
   done
   ```

8. **RENAME workflow** (preserve git history):
   ```bash
   git mv workflows/extract_learnings.md workflows/extract-learnings.md
   cp "$SRC/get-shit-done/workflows/extract-learnings.md" workflows/extract-learnings.md
   ```
   (Copy after the rename in case upstream's content changed slightly — R100 means content identical, but the cp is cheap insurance.)

9. **WHOLESALE COPIES — workflows/** (33 top-level + 3 nested):
   ```bash
   for f in ai-integration-phase audit-fix audit-milestone code-review-fix code-review diagnose-issues discuss-phase-assumptions discuss-phase docs-update execute-phase execute-plan explore help import ingest-docs manager map-codebase new-milestone new-project next plan-phase progress quick resume-project scan secure-phase settings stats ui-phase ui-review update validate-phase verify-work; do
     cp "$SRC/get-shit-done/workflows/$f.md" "workflows/$f.md"
   done
   cp "$SRC/get-shit-done/workflows/discuss-phase/modes/advisor.md" workflows/discuss-phase/modes/advisor.md
   cp "$SRC/get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md" workflows/execute-phase/steps/codebase-drift-gate.md
   cp "$SRC/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md" workflows/execute-phase/steps/per-plan-worktree-gate.md
   ```

10. **ADD new workflows** (4 files):
    ```bash
    for f in add-backlog debug mvp-phase thread; do
      cp "$SRC/get-shit-done/workflows/$f.md" "workflows/$f.md"
    done
    ```

11. **ADD new references** (8 files):
    ```bash
    for f in execute-mvp-tdd mvp-concepts planner-mvp-mode skeleton-template spidr-splitting user-story-template verify-mvp-mode worktree-path-safety; do
      cp "$SRC/get-shit-done/references/$f.md" "references/$f.md"
    done
    ```

12. **ADD new skill — `skills/mvp-phase/SKILL.md`**:
    Use `skills/plan-phase/SKILL.md` as a structural template. Frontmatter `name: gsd:mvp-phase`, `description` cribbed from the first paragraph of `workflows/mvp-phase.md`. The `argument-hint` and `allowed-tools` block should match `plan-phase` (close phase-style cousin). Write a minimal SKILL.md whose `<process>` simply executes `workflows/mvp-phase.md` end-to-end, mirroring how `skills/plan-phase/SKILL.md` delegates to `workflows/plan-phase.md`.

13. **Verify pre-commit**:
    ```bash
    # Syntax checks
    for f in bin/*.cjs bin/lib/*.cjs; do node -c "$f" || { echo "SYNTAX FAIL: $f"; exit 1; }; done

    # Plugin-patch fence (regression check on gsd-tools.cjs since it's UNTOUCHED upstream)
    grep -q "case 'write-phase-memory'" bin/gsd-tools.cjs
    grep -q "case 'checkpoint'" bin/gsd-tools.cjs
    grep -q "case 'hook'" bin/gsd-tools.cjs
    grep -q "case 'migrate'" bin/gsd-tools.cjs
    grep -q "migrations/legacy-cleanup" bin/gsd-tools.cjs

    # Plugin-patch fence (core.cjs)
    grep -q "resolveGsdRoot\b" bin/lib/core.cjs
    grep -q "getAgentsDir\b" bin/lib/core.cjs

    # New files exist
    test -f bin/lib/runtime-homes.cjs
    test -f workflows/mvp-phase.md
    test -f workflows/extract-learnings.md
    test ! -f workflows/extract_learnings.md
    test -f references/mvp-concepts.md
    test -f skills/mvp-phase/SKILL.md
    ```

14. **Drift check** (umbrella):
    ```bash
    node bin/maintenance/check-drift.cjs 2>&1 | tail -10
    ```
    Expect umbrella PASS or expected output. Drift detector compares against the prior baseline; new wholesale-synced content will show as drift, which is fine for this sync — it's the entire purpose. (The HANDOFF schema validator is known to fail on this checkout because `ajv` devDeps aren't installed — same condition as the 1.40.0 sync. Non-blocking.)

15. **Commit**:
    ```bash
    git add -A bin/ references/ templates/ agents/ workflows/ skills/mvp-phase/
    git status --short
    git commit -m "feat(quick-260507-esn): sync upstream GSD v1.41.0 source tree

Wholesale copy of changed files from upstream get-shit-done 1.41.0:
- bin/lib/{artifacts,config-schema,graphify,init,milestone,phase-command-router,phase,profile-output,roadmap,state-command-router,state,verify}.cjs
- templates/README.md
- agents/{gsd-codebase-mapper,gsd-debug-session-manager,gsd-executor,gsd-plan-checker,gsd-planner,gsd-roadmapper,gsd-verifier}.md
- workflows/* (33 top-level + 3 nested updates)
- workflows/extract_learnings.md renamed to workflows/extract-learnings.md
- 4 new workflows: add-backlog, debug, mvp-phase, thread
- 8 new references for MVP/SPIDR/user-story support
- New helper: bin/lib/runtime-homes.cjs
- New plugin skill: skills/mvp-phase/SKILL.md

Plugin patches preserved via 3-way merge in bin/lib/core.cjs
(resolveGsdRoot / resolveGsdDataDir / resolveGsdAsset helpers + getAgentsDir
w/ GSD_AGENTS_DIR override + exports). bin/gsd-tools.cjs untouched upstream
this cycle, plugin patches verified intact via regression grep."
    ```
  </action>
  <verify>
    cd /Users/jnuyens/src/gsd-plugin && \
    for f in bin/*.cjs bin/lib/*.cjs; do node -c "$f" || exit 1; done && \
    grep -q "case 'write-phase-memory'" bin/gsd-tools.cjs && \
    grep -q "case 'migrate'" bin/gsd-tools.cjs && \
    grep -q "migrations/legacy-cleanup" bin/gsd-tools.cjs && \
    grep -q "resolveGsdRoot\b" bin/lib/core.cjs && \
    grep -q "getAgentsDir\b" bin/lib/core.cjs && \
    grep -q "GSD_AGENTS_DIR" bin/lib/core.cjs && \
    test -f bin/lib/runtime-homes.cjs && \
    test -f workflows/mvp-phase.md && \
    test -f workflows/extract-learnings.md && \
    test ! -f workflows/extract_learnings.md && \
    test -f references/mvp-concepts.md && \
    test -f skills/mvp-phase/SKILL.md
  </verify>
  <done>Source tree committed as a single feat() commit. All node -c pass. Patches preserved. New skill exposed.</done>
</task>

<task type="auto">
  <name>Task 2: Bump version 2.40.1 → 2.41.0 (commit 2)</name>
  <action>
Edit three files, each one-line change:
- `package.json`: `"version": "2.40.1"` → `"version": "2.41.0"`
- `.claude-plugin/plugin.json`: `"version": "2.40.1"` → `"version": "2.41.0"`
- `.claude-plugin/marketplace.json`: `"version": "2.40.1"` → `"version": "2.41.0"`

Commit:
```bash
git add package.json .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "chore(quick-260507-esn): bump plugin version 2.40.1 -> 2.41.0

Aligns with upstream GSD 1.41.0 release per plugin_minor=upstream_minor
versioning rule (README § Versioning). Minor bump mirrors upstream's
1.40.0 -> 1.41.0 increment."
```
  </action>
  <verify>
    grep -q '"version": "2.41.0"' package.json && \
    grep -q '"version": "2.41.0"' .claude-plugin/plugin.json && \
    grep -q '"version": "2.41.0"' .claude-plugin/marketplace.json
  </verify>
  <done>Version bumped, committed.</done>
</task>

<task type="auto">
  <name>Task 3: Update README + PROJECT.md (commit 3)</name>
  <action>
1. **README.md** — find and replace ONLY the version-display lines:
   First inspect to find exact strings:
   ```bash
   grep -n "1.40.0\|2.40.1\|2.40.0\|GSD 1\." README.md | head
   ```
   Edit:
   - "Based on: GSD 1.40.0" (or whatever the exact phrasing is) → "Based on: GSD 1.41.0"
   - Plugin version line `2.40.1` → `2.41.0`
   Use `Edit` with exact-string match. Do NOT rewrite README counts (skills/workflow/agents) without verifying — counts may have shifted (workflows/ +4 new, references/ +8 new). If the README displays counts, update them by running:
   ```bash
   ls workflows/*.md | wc -l    # was 86, now 90 (+4)
   ls references/*.md | wc -l   # was N, now N+8
   ```
   and reflect the new totals.

2. **.planning/PROJECT.md** — find and update:
   ```bash
   grep -n "1.40.0\|2.40.1\|GSD 1\." .planning/PROJECT.md | head
   ```
   - "based on" / "current upstream" line: `1.40.0` → `1.41.0`
   - Footer timestamp / sync marker: today's date (2026-05-07).

3. **Commit**:
   ```bash
   git add -u README.md .planning/PROJECT.md
   git commit -m "docs(quick-260507-esn): update README + PROJECT.md for v1.41.0 sync

- README based-on line: GSD 1.40.0 -> 1.41.0
- README plugin-version line: 2.40.1 -> 2.41.0
- README counts updated for new workflows/references (if displayed)
- PROJECT.md context line: GSD 1.40.0 -> 1.41.0
- PROJECT.md footer timestamp updated"
   ```
  </action>
  <verify>
    grep -q "1.41.0" README.md && \
    ! grep -q "GSD 1\.40\.0" README.md && \
    grep -q "1.41.0" .planning/PROJECT.md
  </verify>
  <done>Docs updated, committed.</done>
</task>

<task type="auto">
  <name>Task 4: Add CHANGELOG entry (commit 4)</name>
  <action>
1. Read `CHANGELOG.md` to find the line `## [2.40.1] - 2026-05-06`.

2. Insert a new section RIGHT ABOVE that line (preserving 2.40.1 and earlier untouched). Use the `[2.40.0]` entry's structure as template. Content for `[2.41.0]`:

   ```markdown
   ## [2.41.0] - 2026-05-07  (based on upstream GSD 1.41.0)

   Upstream minor sync — picks up GSD 1.41.0 (released 2026-05-07). Plugin-only
   patches in `bin/lib/core.cjs` (CLAUDE_PLUGIN_ROOT path resolution helpers
   `resolveGsdRoot` / `resolveGsdDataDir` / `resolveGsdAsset` + agent-dir
   override `getAgentsDir` reading `GSD_AGENTS_DIR`) preserved via 3-way merge.
   `bin/gsd-tools.cjs` untouched upstream this cycle; plugin's
   `migrate` / `write-phase-memory` / `checkpoint` / `hook` cases verified
   intact via regression grep.

   ### Added
   - **`/gsd:mvp-phase` workflow** — new MVP-phase command (vertical-slice planning + TDD execution + UAT verification). Includes 8 new references (`mvp-concepts`, `planner-mvp-mode`, `execute-mvp-tdd`, `verify-mvp-mode`, `spidr-splitting`, `skeleton-template`, `user-story-template`, `worktree-path-safety`). New plugin skill `skills/mvp-phase/SKILL.md` exposes the command.
   - **3 new workflow bodies** for existing skills: `workflows/add-backlog.md`, `workflows/debug.md`, `workflows/thread.md` (the skills already existed in the plugin; upstream now ships the workflow files they reference).
   - **`bin/lib/runtime-homes.cjs`** — runtime-aware `globalSkillsBase` resolution (replaces hardcoded path, upstream #3126).
   - 7 agent-prompt updates: `gsd-codebase-mapper`, `gsd-debug-session-manager`, `gsd-executor`, `gsd-plan-checker`, `gsd-planner`, `gsd-roadmapper`, `gsd-verifier`.
   - See full upstream release notes: <https://github.com/gsd-build/get-shit-done/releases/tag/v1.41.0>.

   ### Changed
   - **Version bump** — plugin `2.40.1 → 2.41.0` per `plugin_minor = upstream_minor` versioning (README § Versioning).
   - **`workflows/extract_learnings.md` renamed to `workflows/extract-learnings.md`** (snake → kebab; git history preserved via `git mv`).
   - **33 workflows refreshed** at top level — see commit 1 for the full list. Notable: `quick.md` (history-based resurrection guard), `plan-phase.md` (removed stale OpenCode `agent:` directive #3156), `execute-phase.md` + sub-step files (cwd-drift sentinel + absolute-path guard #3097/#3099).
   - **3 nested workflow files refreshed**: `discuss-phase/modes/advisor.md`, `execute-phase/steps/codebase-drift-gate.md`, `execute-phase/steps/per-plan-worktree-gate.md`.
   - **12 `bin/lib/` modules refreshed** wholesale (no plugin patches in any of them): `artifacts`, `config-schema`, `graphify`, `init`, `milestone`, `phase-command-router`, `phase`, `profile-output`, `roadmap`, `state-command-router`, `state`, `verify`.
   - **`templates/README.md`** updated.

   ### Fixed
   - Upstream bug fixes flowing through automatically: milestone version-resolution (#3109), STATE narrative-tail normalization (#3122), `roadmap.cjs` plan-count for nested layout (#3128), `state.begin-phase` idempotency (#3127), workflow contract validation (#3151), and statusline numeric-100 / next_phases parsing (#3154).
   ```

3. Commit:
   ```bash
   git add CHANGELOG.md
   git commit -m "docs(quick-260507-esn): add CHANGELOG entry for 2.41.0

Documents upstream minor sync to GSD 1.41.0 base, plugin version bump,
new MVP-phase workflow + skill, 3 new workflow bodies for existing
skills, runtime-homes helper, and the extract_learnings rename."
   ```
  </action>
  <verify>
    grep -q "## \[2.41.0\]" CHANGELOG.md && \
    grep -q "based on upstream GSD 1.41.0" CHANGELOG.md
  </verify>
  <done>CHANGELOG entry added, committed.</done>
</task>

<task type="auto">
  <name>Task 5: Post-sync namespace rewrite (commit 5, conditional)</name>
  <action>
Run the namespace rewriter. It's idempotent and may produce zero changes:

```bash
node bin/maintenance/rewrite-command-namespace.cjs 2>&1 | tail -20
```

Then check `git status`:
- If output is empty (no rewrites needed) → SKIP this commit. Move on.
- If output shows modified files → review one with `git diff <file> | head -30`, then commit:
  ```bash
  git add -u
  git commit -m "chore(quick-260507-esn): post-sync namespace rewrite /gsd-<skill> -> /gsd:<skill>

Mechanical rewrite via bin/maintenance/rewrite-command-namespace.cjs to fix
any /gsd-<skill> references newly introduced by the upstream sync."
  ```

NOTE: this is the only conditional commit. Do not force a commit if there's nothing to commit. Expectation for this cycle: upstream's release notes mention "Restore 10 demoted directive phrases in gsd-planner.md" (#3087/#3138) but those rewrites are upstream-side; this rewriter produces deltas only when the synced content reintroduces stale `/gsd-<skill>` strings, which is rare for a minor.
  </action>
  <verify>
    test -z "$(git status --porcelain bin/ references/ templates/ workflows/ agents/ skills/ 2>/dev/null)"
  </verify>
  <done>Either skipped (no rewrites) or committed.</done>
</task>

<task type="auto">
  <name>Task 6: Record sync in STATE.md (commit 6)</name>
  <action>
1. Read `.planning/STATE.md`.

2. Update `last_updated` to today's ISO date and `last_activity` line to:
   `2026-05-07 — Completed quick task 260507-esn: upstream GSD 1.41.0 sync (plugin v2.41.0)`

3. Update the "Last activity:" line in the body if present.

4. Append a new row to the "Quick Tasks Completed" table at the bottom (use the prior `260503-ier` row as template):
   ```
   | 260507-esn | Sync upstream GSD v1.41.0 + bump plugin to v2.41.0 | 2026-05-07 | <commit-hash-of-task-1> |  | [260507-esn-there-is-a-new-upstream-version-see-what](./quick/260507-esn-there-is-a-new-upstream-version-see-what/) |
   ```
   Get commit hash via:
   ```bash
   git log --grep="quick-260507-esn" --reverse --format=%h | head -1
   ```

   STATE.md is git-tracked even though most `.planning/` is gitignored. Use `git add -u .planning/STATE.md`.

5. Commit:
   ```bash
   git add -u .planning/STATE.md
   git commit -m "docs(quick-260507-esn): record v1.41.0 sync in STATE

Bumps last_activity, last_updated, and adds row to Quick Tasks Completed."
   ```
  </action>
  <verify>
    grep -q "260507-esn" .planning/STATE.md && \
    grep -q "v1.41.0\|1.41.0" .planning/STATE.md
  </verify>
  <done>STATE.md updated, committed.</done>
</task>

</tasks>

<output>
Six commits (or five if Task 5 is a no-op) on `master`, ready to push. Plugin at `2.41.0`, upstream parity at `1.41.0`. Orchestrator handles `git push origin master` after executor returns.

After execution, recommended sanity:
1. `node bin/maintenance/check-drift.cjs` — umbrella drift PASS expected.
2. `git log --oneline -8` — 5-6 commits since the start of this task, all `quick-260507-esn`.
3. Smoke test: `/gsd:mvp-phase` should now route to `workflows/mvp-phase.md`.
4. **Out-of-scope deferred items** for future quick tasks (do NOT do as part of this sync):
   - Review upstream `hooks/` deltas (5 modified + 1 added file) for any plugin-relevant fixes (Windows shell:true #3102, statusline 100% / next_phases #3154, `git-cmd.js` token-walk classifier #3129). Plugin's `hooks/` is NOT auto-synced.
   - Audit if any newly-modified upstream workflow uses `runtime-homes.cjs` in a way the plugin's path resolution doesn't satisfy.
</output>
