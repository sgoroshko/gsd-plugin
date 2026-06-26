# Phase 11: Drift Detection and Consistency Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in 11-CONTEXT.md — this log preserves the discussion.

**Date:** 2026-06-27
**Phase:** 11-drift-detection-and-consistency-gate
**Mode:** discuss
**Areas discussed:** Gate strictness, Native-fallback ambition, VibeDrift binding + privacy, Allowlist + scan report

## Carried Forward (locked before discussion)

From `/gsd:explore` + `v1.3-vibedrift-evaluation.md`: adopt VibeDrift's ideas, no vendoring;
pinned version; allowlist mandatory (~38% of gsd-plugin dup findings = intentional CJS↔SDK split);
local-only / never `--deep` on private repos.

## Areas Discussed

### Gate strictness (DRIFT-02)
- Options: opt-in warn-first (rec) / default-on warn / opt-in block-on-threshold
- **Selected:** Opt-in, warn-first — config off by default, recommended-fix framing, never blocks;
  `--fail-on-score N` available as explicit escalation.

### Native-fallback ambition (DRIFT-05)
- Options: Phase 10 reuse + phantom/placeholder (rec) / minimal Phase-10-only / full port + MinHash
- **Selected:** Full port — add native MinHash semantic-dup too (on top of Phase 10 reuse +
  phantom/placeholder). Detection is now primary, not a fallback.

### VibeDrift binding + privacy (DRIFT-01)
- Options: npx-pinned+local-only (rec) / PATH-probe / npx + --deep opt-in
- **User redirected the framing:** "VibeDrift should be considered a second upstream project of
  which the interesting parts are fully integrated with gsd-plugin. As with the upstream
  gsd-project, we should periodically check if changes made to the upstream projects are worth
  integrating."
- **Follow-up confirm:** 100% native, no runtime call (rec) vs native-first + external optional.
- **Selected:** 100% native, no runtime call. VibeDrift = second upstream (native port + periodic
  upstream-watch). DRIFT-01's external-invocation wording retires (flagged for REQUIREMENTS refresh).

### Allowlist + scan report (DRIFT-03/04)
- Options: pre-seeded .vibedrift + ranked md to stdout (rec) / document-only / pre-seeded + persist to .planning
- **Selected:** Ship pre-seeded allowlist (reuse `.vibedrift` format for upstream-portability) +
  ranked top-N markdown to stdout; suppressions auditable in the report.

## Scope Notes
- Requirement wording: DRIFT-01 ("optional external gate") and DRIFT-05 ("native fallback") both
  need a REQUIREMENTS.md refresh to match the native-first / second-upstream decision. Flagged,
  not edited (out of discuss-phase scope).
- Deferred: consistency-relative-security heuristic (own scope); more language rule packs (future v1.x).

## Deferred Ideas
- Consistency-relative security (eval heuristic #5) — future milestone.
- More programming-language rule packs — future v1.x (per its own todo note).
