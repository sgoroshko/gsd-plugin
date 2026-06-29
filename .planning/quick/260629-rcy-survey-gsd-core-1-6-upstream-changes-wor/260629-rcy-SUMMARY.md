---
quick_id: 260629-rcy
status: complete
date: 2026-06-29
---

# Quick Task 260629-rcy — Summary

Research (no code change). Surveyed upstream **gsd-core 1.6.0** (open-gsd/gsd-core,
released 2026-06-24) for anything worth cherry-picking into this Claude-only plugin,
then spot-verified the top items against our actual flat-layout code.

Full survey: `260629-rcy-RESEARCH.md`.

## Headline

- **1.6.0's dominant theme = the Capability Registry (ADR-1244, multi-runtime
  third-party plugin infra). SKIP entirely** — irrelevant to a Claude-Code-only plugin.
- The worth-including items are **correctness fixes**, not features.

## Verified against our code (orchestrator spot-check)

| Upstream | Verdict for us | Evidence |
|----------|----------------|----------|
| **#1520 mktemp BSD/macOS suffix** | **ADOPT — confirmed real bug** | `/usr/bin/mktemp 'foo-XXXXXX.json'` on this macOS returns the path with `XXXXXX` **unexpanded** → concurrent calls collide. We have **5 callsites** (`execute-phase`, `quick`, `ship`, `profile-user` x2); 2 are parallel-wave worktree manifests. |
| **#1369 wave-base + manifest reset** | **Mostly already present** | `execute-phase.md` already has `EXPECTED_BASE` + `git merge-base` reset guard (L536-539) + per-wave manifest. Needs a targeted diff to see if any sub-fix is still missing; likely low/no value. |
| **#1572 must_haves preservation** | ADOPT candidate — needs presence check | Plugin's Nyquist gates write `must_haves`; confirm our `frontmatter set` path doesn't drop `artifacts/prohibitions`. |
| **#1445/#1532/#1534 bundle** (999.x excluded from total_phases; PID-liveness lock; prototype-pollution guard) | ADOPT candidate — needs presence check | We do use 999.x backlog phases; verify our `total_phases` math + STATE lock. |
| **#1452 context_guard_mode** | ADAPT (optional) | Proactive context-exhaustion guard before each wave; useful for long autonomous runs. Net-new, opt-in. |

## Recommendation

Land a focused **"gsd-core 1.6 correctness slice"** (NOT the registry):
- **Tier 1 (do):** #1520 mktemp — verified, small, fixes a real concurrency collision across 5 callsites.
- **Tier 2 (verify-then-pick):** #1572 must_haves + the #1445/#1532/#1534 bundle — each needs a quick "do we already have it / does it apply to flat layout?" check before porting.
- **Tier 3 (optional):** #1452 context_guard as an ADAPT later.
- **Skip:** the Capability Registry and anything multi-runtime.

Any port updates the plugin patches inventory and follows cherry-pick discipline
(check 1.6.x point releases for companion fixes).
