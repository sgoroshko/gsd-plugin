# Phase 11: Drift Detection and Consistency Gate - Context

**Gathered:** 2026-06-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface existing cross-session drift repo-wide (duplicate logic under different names,
oscillating naming, split architectural patterns, half-finished stubs) and gate the pre-1.0
release ceremony. Detection runs **100% natively** inside gsd-plugin. Requirements: DRIFT-01..05.

This is the **detection** half of v1.3 (Phase 10 shipped the **prevention** half: authoring-time
convention conformance in plan -> execute -> review). Phase 11 reuses Phase 10's
`bin/lib/conventions.cjs` and extends it to a repo-wide sweep + release gate.
</domain>

<decisions>
## Implementation Decisions

### VibeDrift model (DRIFT-01 — reinterpreted; supersedes the earlier "optional external gate")
- **D-01:** Detection is **100% native** — GSD never shells out to the `vibedrift` CLI at
  runtime. No `npx`/PATH probe, no graceful-degrade branch, no privacy surface (the
  `--local-only` / `--deep` / cloud-snippet concerns are moot because nothing is invoked).
- **D-02:** VibeDrift is treated as a **second upstream project** (the same relationship
  gsd-plugin has with `gsd-core`): its interesting heuristics are ported natively, and its repo
  is added to the **periodic upstream-watch** so new heuristics get cherry-picked over time.
  Pin the evaluated **v0.14.0** as the idea-source baseline.
- **NOTE — requirement wording drift:** DRIFT-01 as written ("invoke an optional VibeDrift gate
  that probes PATH/`npx`, runs `--local-only`, degrades gracefully when absent") is now
  **retired**. DRIFT-01 should be reworded to "native drift detection + VibeDrift treated as a
  periodically-synced upstream." Flag for a REQUIREMENTS.md refresh (out of discuss-phase scope).

### Detection scope (DRIFT-05 — now PRIMARY, not a fallback)
- **D-03:** **Full native port.** Three layers:
  1. **Reuse Phase 10** `bin/lib/conventions.cjs` (`deriveConventions` / `checkConformance` —
     convention casing, verb-vs-body intent, architectural-split) repo-wide.
  2. **Phantom-scaffolding / placeholder-stub detector** (new): CRUD-named exports never
     imported/routed; `TBD`/`todo`/placeholder returns in production code.
  3. **Native MinHash + LCS structural semantic-dup** (new): Type-3 structural near-clones,
     the technique VibeDrift uses (operation-sequence MinHash + LCS verification), NOT embeddings.
- **D-04:** Since DRIFT-05 is no longer a "fallback," the requirement framing ("native fallback
  heuristics run when VibeDrift is absent") should be reworded to "native detection heuristics"
  (same REQUIREMENTS.md refresh as D-01's note).

### Release gate (DRIFT-02)
- **D-05:** The pre-1.0 `audit-milestone` integrity gate is **opt-in, warn-first**:
  config-gated **OFF by default**. When enabled, it reports the composite score + findings with
  **recommended-fix framing** and **never blocks** the milestone.
- **D-06:** `--fail-on-score N` is available as an **explicit escalation** for users who want a
  hard gate (exit-code fail below cutoff). Default behavior reports only; the hard cutoff is
  never imposed silently. (Consistent with Phase 10's non-blocking-CONVENTION tier and the
  "recommended outcome, not rubber-stamp" principle.)

### Allowlist + scan report (DRIFT-03 / DRIFT-04)
- **D-07:** Ship a **pre-seeded allowlist committed to the repo** that suppresses the intentional
  `bin/lib` (CJS) <-> `sdk/src` (ESM) dual-resolver split (~38% of gsd-plugin's raw dup findings
  in the evaluation). Reuse the `.vibedrift` allowlist **format** for upstream-portability (so
  ported heuristics and any future VibeDrift cross-reference stay compatible). Suppressions stay
  **auditable** — listed in the drift report, not silently dropped.
- **D-08:** `/gsd:scan --drift` produces a **ranked top-N markdown report to stdout** (consistent
  with other `/gsd:scan` output; lighter than `/gsd:map-codebase`). Ranked by finding
  severity/composite contribution.

### Noise suppression (from the evaluation — carry into the native heuristics)
- **D-09:** Do NOT surface the evaluation's known low-signal findings raw: "functions exceed 50
  lines" (opinion), "unreachable after return/throw" (early-return false positives), "exported
  symbols unused" (library/framework entry points), comment-density. Surfacing these erodes trust.

### Claude's Discretion
- Exact MinHash band/shingle parameters and the LCS similarity threshold (tune during research).
- Internal module layout for the new detectors (`bin/lib/*.cjs`) and how `/gsd:scan --drift`
  routes to them (likely mirrors the Phase 10 `verify conventions` router pattern).
- Whether the upstream-watch wiring (D-02) is its own plan/wave vs folded into the gate plan.
</decisions>

<specifics>
## Specific Ideas

- The "second upstream" relationship should mirror the existing gsd-core watch concretely:
  add VibeDrift to the periodic release-check tooling (`bin/check-gsd-release.sh` /
  `bin/maintenance/check-upstream-schema.cjs` family) so the maintainer is notified when a new
  VibeDrift version ships heuristics worth porting.
- The evaluation's "ideas worth copying" list (majority-vote convention derivation [done in P10],
  verb-vs-body [done], architectural split [done], phantom/placeholder [P11], MinHash dup [P11],
  consistency-relative security [candidate, see deferred]) is the porting roadmap.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Drift detection design + evaluation
- `.planning/milestones/v1.3-vibedrift-evaluation.md` — which heuristics to port, the noise list
  to suppress, allowlist rationale (~38% intentional-dup), the `--fail-on-score`/JSON ergonomics,
  and the "adopt + cherry-pick, no vendor" stance now extended to "second upstream."
- `.planning/milestones/v1.3-semantic-dup-research.md` — semantic-dup research (MinHash+LCS
  structural clones vs embeddings); informs the native dup-detector design (D-03 layer 3).
- `.planning/REQUIREMENTS.md` — DRIFT-01..05 (note: DRIFT-01 + DRIFT-05 wording needs the refresh
  flagged in D-01/D-04).

### Phase 10 reuse (prevention -> detection)
- `bin/lib/conventions.cjs` — `deriveConventions` / `checkConformance` (convention, verb-vs-body,
  architectural-split); zero-dep, never-throws. Reused repo-wide as detection layer 1.
- `.planning/phases/10-convention-and-architectural-conformance/10-SECURITY.md` — the path-safety
  + never-throw + non-blocking-tier contracts the new detectors must also honor.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/lib/conventions.cjs` — repo-wide convention/verb-body/arch-split detection (Phase 10).
- `bin/lib/drift.cjs` — `SAFE_PATH_RE` + `sanitizePaths` (path-safety the new detectors reuse).
- `bin/lib/verify.cjs` + `bin/lib/verify-command-router.cjs` — the subcommand-router pattern to
  mirror for `/gsd:scan --drift` and the audit-milestone gate hook.
- `.github/workflows/check-drift.yml` — zero-dep CI test pattern for new detector tests.
- `bin/check-gsd-release.sh` + `bin/maintenance/check-upstream-schema.cjs` — the upstream-watch
  mechanism to extend for VibeDrift as a second upstream (D-02).

### Established Patterns
- Two-resolver CJS(`bin/lib`)/SDK(`sdk/src`) split — the intentional dup the allowlist must
  suppress (D-07); any new module + config key lands in BOTH + rebuild.
- Non-blocking advisory tier + recommended-fix framing (Phase 10 CONVENTION tier) — the gate (D-05)
  follows the same never-block-by-default stance.

### Integration Points
- New `/gsd:scan --drift` mode (DRIFT-04) — extends the existing `/gsd:scan` skill.
- `audit-milestone` gains the opt-in integrity gate (DRIFT-02).
- New `bin/lib/*.cjs` detector module(s) for phantom/placeholder + MinHash dup, wired like the
  Phase 10 `verify conventions` subcommand.
</code_context>

<deferred>
## Deferred Ideas

- **Consistency-relative security** (the evaluation's heuristic #5: "N mutating routes lack auth
  while the codebase uses auth elsewhere") — high-value but its own scope; not in DRIFT-01..05.
  Candidate for a future milestone.
- **More programming-language rule packs** for the convention/idiom checks (reviewed todo
  `2026-06-26-add-more-programming-language-rule-packs-...`, score 0.6) — explicitly a future-v1.x
  item per its own note; the JS/TS packs ship first. Not folded into Phase 11.

### Reviewed Todos (not folded)
- Recap/plan-phase UX todos (`nextup-recommends-plan-for-already-planned-phase`,
  `collapse-plan-phase-upstream-gates`, `auto-accept-recommended-default-prompts`,
  `auto_advance-default-and-gap-escalation`) matched on weak keywords only — unrelated to drift
  detection. Not folded.
</deferred>

---

*Phase: 11-drift-detection-and-consistency-gate*
*Context gathered: 2026-06-27*
