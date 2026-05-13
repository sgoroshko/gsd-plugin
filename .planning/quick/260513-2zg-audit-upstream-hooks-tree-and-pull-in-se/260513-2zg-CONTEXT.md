# Quick Task 260513-2zg: Hook audit + pull in upstream security/correctness scripts - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Task Boundary

Audit upstream `gsd-build/get-shit-done/hooks/` (12 scripts as of v1.41.2) against the plugin's current `hooks/hooks.json` (single dispatcher pointing at `bin/gsd-tools.cjs hook <type>`). Pull in the hook scripts that provide real defense-in-depth value the plugin currently lacks. Patch any `__dirname` traversals that bake in upstream's `<root>/get-shit-done/hooks/` layout assumption. Register the new hooks in `hooks.json`. Ship as a single coordinated release.

In scope:
- Copying upstream hook scripts into the plugin's `hooks/` directory
- Patching layout assumptions per script (`__dirname` / path resolution)
- Updating `hooks/hooks.json` with new matchers / events / scripts
- Local smoke testing per hook
- Version bump + CHANGELOG + release

Explicitly out of scope:
- Modifying the dispatcher (`bin/gsd-tools.cjs hook <type>`) — it stays in its current shape for cross-cutting events (SessionStart auto-resume, PreCompact checkpoint, PostToolUse periodic checkpoint, Stop rate-limit nudge)
- Changing the user-facing behavior of CLAUDE.md or workflow files
- Removing the `"hooks/ is plugin-owned, don't sync"` convention from the patches inventory (this task is a one-time pull-in, not a permanent sync-with-upstream commitment)

</domain>

<decisions>
## Implementation Decisions

### Scope — which hooks to pull in first

**All 9 security/correctness hooks at once.** Single sweep, single release. Rationale: the hooks are independent enough that pulling them piecemeal would generate 9 small releases over a week without adding safety; pulling them together lets the install-smoke CI catch any layout-patch regression in a single CI run.

Hooks in scope (per upstream v1.41.2 `hooks/` directory + `GSD_HOOK_REGISTRY` from `marcfargas:feat/claude-plugin-install`):

1. `gsd-prompt-guard.js` — PreToolUse Write|Edit
2. `gsd-workflow-guard.js` — PreToolUse Write|Edit
3. `gsd-read-guard.js` — PreToolUse Write|Edit
4. `gsd-read-injection-scanner.js` — PostToolUse Read
5. `gsd-validate-commit.sh` — PreToolUse Bash
6. `gsd-phase-boundary.sh` — PostToolUse Write|Edit
7. `gsd-context-monitor.js` — PostToolUse Bash|Edit|Write|MultiEdit|Agent|Task
8. `gsd-check-update.js` — SessionStart (defer/skip if it conflicts with the plugin's existing `/plugin marketplace update` model)
9. `gsd-session-state.sh` — SessionStart

Excluded from this pass (cosmetic / different concern):
- `gsd-statusline.js` — UI; can be added later if the statusline contract aligns
- `gsd-update-banner.js` — update notification UI; redundant with marketplace auto-update
- `hooks/lib/git-cmd.js` — pulled in only if any of the 9 above import from it

### Enforcement aggressiveness

**Soft-warn on first ship.** All workflow / prompt / read guards exit 0 with a stderr message when they detect a violation. The Edit/Write/Read tool proceeds. Rationale: establishes the pattern, no user friction, easy to upgrade to hard-block in a later release once we have signal that users are reading the warnings.

Hard-block (exit non-zero) is the eventual end-state but not the first ship. The `gsd.hook_enforcement` config key option (default warn, opt-in block) is **NOT being implemented** in this task — it's deferred to a later release once we know whether warn-vs-block matters to users.

Exception: `gsd-validate-commit.sh` blocks on commit-message failure by design (the commit doesn't happen — git's normal pre-commit-hook contract). This is consistent with how upstream ships it.

### Hook architecture

**Hybrid.** Cross-cutting events keep the dispatcher; tool-specific guards get individual scripts.

Concrete split:

| Event | Wiring | Why |
|---|---|---|
| SessionStart (resume + migration + status check) | Dispatcher (`bin/gsd-tools.cjs hook session-start`) | Multi-step orchestration that shares helper imports — splitting into 3 scripts would duplicate state. |
| PreCompact (checkpoint write) | Dispatcher | Single dispatch, shared with checkpoint module. |
| Stop (rate-limit nudge) | Dispatcher | One-off, dispatcher already has the transcript-tail logic. |
| PostToolUse periodic checkpoint | Dispatcher | Shared with `bin/lib/checkpoint.cjs`. |
| **NEW: PreToolUse Write\|Edit (prompt-guard, workflow-guard, read-guard)** | **Individual scripts** | Single-responsibility, each script's logic is self-contained. |
| **NEW: PreToolUse Bash (validate-commit)** | **Individual script** | Self-contained Bash script. |
| **NEW: PostToolUse Read (read-injection-scanner)** | **Individual script** | Single-purpose injection detector. |
| **NEW: PostToolUse Write\|Edit (phase-boundary)** | **Individual script** | Self-contained Bash script. |
| **NEW: PostToolUse broad (context-monitor)** | **Individual script** | Standalone monitor. |
| **NEW: SessionStart (gsd-check-update, gsd-session-state)** | **TBD per script** | Depends on whether they duplicate work the dispatcher already does (check-update may overlap with marketplace auto-update). |

Net result: `hooks/hooks.json` gains 7+ entries for the new individual scripts, keeps the existing 4 dispatcher entries (SessionStart auto-resume, PreToolUse Edit|Write, PostToolUse, PreCompact, Stop).

### Claude's Discretion

- **Layout-patch strategy per hook script.** Each upstream hook script likely has `__dirname` traversal or `process.env.CLAUDE_CONFIG_DIR` assumptions that don't match the plugin's flat layout. Approach per script: read the source, apply minimal `[PLUGIN PATCH]` to make it plugin-layout-aware, tag with `#PLUGIN-HOOK-<name>` marker for the patches inventory. Same pattern as `#PLUGIN-AGENTS-DIR` / `#PLUGIN-MODEL-CATALOG-PATH`.
- **`gsd-check-update.js` decision.** Will read the script first; if it just checks npm for a new `get-shit-done-cc` version, skip it (the plugin updates via `/plugin marketplace update`, not npm). If it does something more useful, include it. Likely-skip.
- **Test surface.** Each pulled-in hook gets a smoke test in `tests/` (similar pattern to `tests/mcp-stdio-framing.test.cjs` and `tests/workspace-json-integration.test.cjs`) — minimum: hook runs without crashing on synthetic input. Skip if a hook is fundamentally hard to test in isolation (e.g. context-monitor needs a real session).
- **Release versioning.** Single patch-bump release `2.42.5 → 2.42.6` (or `2.43.0` if any hook's behavior is user-visible enough to warrant a minor). Decide based on the soft-warn-vs-block call: soft-warn alone is unlikely to be minor-worthy; user-visible workflow blocks would be. Defaulting to patch (`2.42.6`) given soft-warn first ship.

</decisions>

<specifics>
## Specific Ideas

- **Upstream source cache** is at `/tmp/gsd-upstream-check/hooks/` (v1.41.2 tag, cloned earlier this session).
- **Reference for hook entries** is the `GSD_HOOK_REGISTRY` table in `marcfargas:feat/claude-plugin-install` (`bin/install.js:37-55`). Marc's table captures upstream's intended `{file, event, runner, matcher, timeout}` mapping cleanly — use it as the canonical source for `hooks.json` entry shapes, not as runnable code.
- **Plugin patches inventory** at `/Users/jnuyens/.claude/projects/-Users-jnuyens-src-gsd-plugin/memory/feedback_plugin_patches_inventory.md` already lists active patches and the "deprecated workflow-level patches" — append the new `#PLUGIN-HOOK-*` markers when the task lands.
- **Install-smoke CI** must continue to pass — fresh `debian:trixie` clone runs the hooks (or at least asserts they parse and the dispatcher commands resolve).
- **Drift baseline** may need a regeneration since hook scripts contain plugin-tracked references.

</specifics>

<canonical_refs>
## Canonical References

- Upstream hooks tree: <https://github.com/gsd-build/get-shit-done/tree/v1.41.2/hooks>
- Marc's hook registry table (canonical reference for hook entry shapes): <https://github.com/marcfargas/get-shit-done/blob/feat/claude-plugin-install/bin/install.js#L37-L55>
- Upstream discussion #3432 (where the audit recommendation surfaced): <https://github.com/gsd-build/get-shit-done/discussions/3432>
- Plugin patches inventory: `memory/feedback_plugin_patches_inventory.md`
- Plugin's current `hooks/hooks.json`: `hooks/hooks.json` on this branch

</canonical_refs>
