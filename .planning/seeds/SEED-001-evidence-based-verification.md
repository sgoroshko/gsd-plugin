---
seed_id: SEED-001
planted: 2026-06-29
planted_during: v4.1 Buildomator Rebrand (via /gsd:quick exploration 260629-35t)
trigger_when: "scoping a verification/quality/reliability milestone, or after repeated 'thought it was fixed but wasn't' incidents, or when adding UI/CLI features that need real-run proof"
status: dormant
---

# SEED-001: Evidence-based verification (red→green repro, screenshots/run-the-app)

Make GSD prove a fix actually works by **observing real behavior**, not by
code-shaped evidence. Today `gsd-verifier` is static by design (won't run the
app), UAT delegates to the user, and the executor's `<verify>` is unit-test
shaped — so "fixed" can be declared without reproducing the original symptom and
seeing it gone.

**Full design (do not re-derive):** `.planning/quick/260629-35t-evidence-based-verification-screenshots-/260629-35t-EXPLORATION.md`

## When to Surface

- Scoping a milestone themed around verification, quality, reliability, or
  "trust the green checkmark".
- After one or more incidents where a bug fix was declared done but the symptom
  persisted.
- When a milestone adds web UI or CLI surfaces whose correctness needs real-run
  proof (screenshots / captured output), not just passing tests.

## Why This Matters

The whole value of GSD's gates is that "done" means done. The current verifier
can be fooled by plausible-but-wrong code. The red→green evidence loop (capture
failing repro → fix → capture passing repro, cite both by path) closes the gap
that produces false "fixed" claims — the single most corrosive failure mode for
an autonomous workflow.

## Shape (from the exploration)

- **Core:** red→green evidence loop, highest value wired into `gsd-debug` first.
- **Low token overhead (hard constraint):** capture inside subagents (zero
  per-turn cost); CLI over always-on Playwright-MCP (~20k tokens/turn); evidence
  saved to `.planning/evidence/` as files referenced by path, never read into
  context unless a check fails; delegate to the project's run/observe skill; one
  `workflow.evidence_verification` gate (code_review pattern), `auto` by task type.
- **Rollout:** Step 1 = convention + gate + gsd-debug loop (small, standalone).
  Step 2 = executor `<verify> capture:` + verifier evidence-mode + `evidence:`
  must_haves contract. Step 3 = generalize verify-work + shared capture helper
  reusing gsd-ui-auditor's screenshot block.
- **Open questions:** default gate value (auto vs off); gitignore `.planning/evidence/`;
  auto-detect task type vs require a `capture:` hint.
