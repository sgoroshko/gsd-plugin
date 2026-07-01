# Phase 12: Two-Plugin Build Foundation - Discussion Log

> **Audit trail only.** Decisions captured in 12-CONTEXT.md — this log preserves the reasoning.

**Date:** 2026-07-01
**Phase:** 12-two-plugin-build-foundation
**Mode:** discuss (standard)
**Areas discussed:** Source-of-truth model, Package divergence, Marketplace + output layout, Drift guard + build trigger (all 4 selected)

## Grounding
- Scout finding: **no build/dist step exists today** — `marketplace.json` has `source: "./"`, so the repo root IS the installed gsd package. Phase 12 introduces the first generation step.
- Carried forward (not re-asked): repo/cache id stays `gsd-plugin` (BUILD-03); prefix derives only from `plugin.json` name; additive in 4.x, `/gsd:` retires at v5.0.
- 8 pending todos surfaced at score 0.6; none matched the build scope — not folded.

## Decisions

| Area | Options presented | Chosen | Note |
|------|-------------------|--------|------|
| Source model | (A) gsd authored at root, generate bm / (B) neutral source, generate both into dist/ | **A** | Lowest risk; current gsd installs untouched; v5.0 flips authored identity later |
| Divergence | name + branding text / name only | **name + branding text** | bm stamps name->bm and description->Buildomator; /gsd:->/bm: doc rewrites deferred to Phase 13 |
| Marketplace + output | one marketplace.json, two entries / separate marketplace | **one marketplace.json, two entries** | bm output at dist/bm/ |
| Drift guard + trigger | CI diff + manual build / prepublish auto-build | **prepublish auto-build** | Reconciled with committed dist/bm (D-04/D-05); CI regenerate-and-diff kept as the criterion-4 guard |

## Reconciliation noted during discussion
Q4 (prepublish auto-build) + Q3 (bm as a marketplace `source` at dist/bm/) interact: Claude Code resolves marketplace `source` from the repo at the installed ref, so `dist/bm/` must be committed. Resolution: the prepublish hook regenerates `dist/bm/` and the release commits it (D-04, D-05). Flagged for the researcher to confirm marketplace source-path semantics.

## Deferred
- /gsd:->/bm: doc rewriting + parity -> Phase 13
- Hook/MCP dedup -> Phase 14
- Buildomator branding copy -> Phase 15
- Retire /gsd: / flip authored identity -> v5.0
