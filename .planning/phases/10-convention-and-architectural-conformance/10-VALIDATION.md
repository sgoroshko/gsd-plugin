---
phase: 10
slug: convention-and-architectural-conformance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-26
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 10-RESEARCH.md `## Validation Architecture`. Deterministic pure module → strongly test-driven.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node built-in `node:assert` + bare `check(name, fn)` runner (zero-dep, existing repo convention) |
| **Config file** | none — convention is `tests/<name>.test.cjs`, run directly |
| **Quick run command** | `node tests/conventions.test.cjs` |
| **Full suite command** | `for f in tests/*.test.cjs; do node "$f" || exit 1; done` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node tests/conventions.test.cjs`
- **After every plan wave:** Run `for f in tests/*.test.cjs; do node "$f" || exit 1; done`
- **Before `/gsd:verify-work`:** Full suite green AND `node tests/conventions.test.cjs` added to `.github/workflows/check-drift.yml`
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

> Task IDs are assigned by the planner; this maps requirements → expected automated proof. Threat refs: this is a read-only deterministic analyzer (no network, no auth, no user-supplied execution) — no threats above `info`.

| Req | Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|-----------|-------------------|-------------|--------|
| CONV-01 | `deriveConventions` returns named convention at >=70% dominance | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| CONV-01 | returns contested hotspot below threshold (CJS/SDK export split) | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| CONV-01 | normalized entropy ≈ 0 single variant, ≈ 1 even split; `minSamples >= 8` guard | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| CONV-02 | `checkConformance` flags a deviating changed file, passes a conforming one | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| CONV-02 | conformance never emits a finding for a contested axis | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| CONV-03 | verb-vs-body flags read-verb + body-mutation; passes mutating-verb + pure body | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| CONV-04 | arch-split flags `process.env` file when dominant style is injection; classifies catch swallow/rethrow/wrap | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| D-03 | all findings carry tier `CONVENTION` and never set `blocking: true` | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| D-05 | non-JS/TS input skips idiom checks gracefully (no idiom findings, not an error) | unit | `node tests/conventions.test.cjs` | ❌ W0 | ⬜ pending |
| integration | `gsd-tools.cjs verify conventions --check --files …` emits valid JSON | integration | `node tests/conventions.test.cjs` (spawns gsd-tools) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/conventions.test.cjs` — covers CONV-01..04, D-03, D-05 (new file)
- [ ] Add `node tests/conventions.test.cjs` to `.github/workflows/check-drift.yml`

*No framework install — the zero-dep `check()` harness is already the repo convention.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| code-review surfaces `CONVENTION`-tier findings in a real review run | CONV-02/03/04 | end-to-end agent behavior (subagent reads module JSON, renders findings) is judged, not asserted | Run `/gsd:code-review` on a branch with a deliberately convention-violating changed file; confirm an advisory CONVENTION finding appears and does not block |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers the new test file + CI wiring
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter (by planner/executor)

**Approval:** pending
