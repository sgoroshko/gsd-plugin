# Spike Manifest

## Idea

Reduce manual GSD "plumbing" interactions — the parts of a workflow where the
user must hand-shepherd GSD's own state rather than make a build decision. The
trigger case is plan-phase's missing-CONTEXT gate, which dead-ends and forces a
manual "run discuss-phase, then come back and re-run plan-phase" round-trip.
These spikes validate the Claude Code runtime constraints that govern whether
such round-trips can be auto-chained. See `.planning/notes/minimize-gsd-plumbing-interactions.md`.

## Requirements

- The interactive discuss-phase conversation is a build decision and MUST stay
  interactive — any fix that suppresses it (e.g. forcing `--auto`) is unacceptable.
- A fix must not route an interactive command through a subagent (Task/Agent) —
  subagents cannot prompt the user (confirmed, spike 001).
- **plan-phase's OWN scope-decision prompts must also stay interactive after the
  discussion** (decided 2026-06-19, "Discuss → resume plan interactive"). This
  rules out the plain `--chain`/`--auto` path, since `--auto` suppresses
  plan-phase's prompts. Re-entry must run plan-phase WITHOUT --auto (top-level via
  HANDOFF/resume, or seamless if #1009 proves stale).
- Prefer reusing existing GSD machinery (HANDOFF/resume, `--chain` dispatch)
  over inventing new dispatch mechanisms.

## Spikes

| # | Name | Type | Validates | Verdict | Tags |
|---|------|------|-----------|---------|------|
| 001 | slashcommand-rechain-askuserquestion | standard | Can plan-phase's missing-CONTEXT round-trip be removed without losing the interactive discussion (without tripping #1009)? | PARTIAL ⚠ | askuserquestion, slashcommand, skill-dispatch, 1009, auto-chain |
