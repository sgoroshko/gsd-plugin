---
created: 2026-06-26T16:23:30.181Z
title: Add more programming language rule packs for the naming-drift/convention checks
area: tooling
files:
  - bin/lib/ (future shared convention-derivation module, Phase 10 D-04)
  - agents/gsd-pattern-mapper.md
  - agents/gsd-code-reviewer.md
  - .planning/phases/10-convention-and-architectural-conformance/10-CONTEXT.md
---

## Problem

Phase 10 (v1.3, decision D-05) ships the convention/naming-drift checks with a
**language-agnostic architecture but only JS/TS rule packs**. The universally-generalizable
axes (file-name casing, identifier casing) run language-agnostically, but the idiom-specific
checks — **verb-vs-body intent** and **architectural-split** (DI-vs-env access, error
swallow/throw/wrap) — only have JS/TS rule packs and **skip gracefully** on any other language.

A polyglot repo (Python, Go, Rust, shell, etc.) therefore gets only the casing signal, not the
richer intent/architectural conformance checks. The architecture was deliberately built to make
this a "add a grammar + rule pack" extension, not a rewrite — but the packs themselves are
deferred.

## Solution

TBD — extend coverage by adding per-language rule packs once the JS/TS implementation is proven:

- Reuse the pluggable extraction layer from Phase 10 (tree-sitter-style grammar + rule pack per
  language); no core rewrite expected.
- Per language, define: the verb taxonomy (read-only vs mutating verbs) and the architectural
  idioms to detect (e.g. Python: bare `except` swallow vs raise; env access via `os.environ` vs
  injected config; Go: unchecked error returns vs wrapped errors).
- Prioritize languages by what GSD users actually run (likely Python and Go first).
- Confirm whether `web-tree-sitter` grammars exist for each target language, or whether a regex
  fallback suffices for the casing axes (open research question already flagged for Phase 10's
  planner).

Depends on Phase 10 landing first. Candidate for a future v1.x milestone, not v1.3.
