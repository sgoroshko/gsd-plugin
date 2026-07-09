---
name: gsd:ai-integration-phase
description: Generate AI design contract (AI-SPEC.md) for phases that involve building AI systems — framework selection, implementation guidance from official docs, and evaluation strategy
argument-hint: "[phase number]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - mcp__plugin_context-mode_context-mode__ctx_fetch_and_index
  - mcp__plugin_context-mode_context-mode__ctx_search
  - WebSearch
  - AskUserQuestion
  - mcp__plugin_context7_context7__*
---
<objective>
Create an AI design contract (AI-SPEC.md) for a phase involving AI system development.
Orchestrates gsd-framework-selector → gsd-ai-researcher → gsd-domain-researcher → gsd-eval-planner.
Flow: Select Framework → Research Docs → Research Domain → Design Eval Strategy → Done
</objective>

<execution_context>
@${CLAUDE_PLUGIN_ROOT}/workflows/ai-integration-phase.md
@${CLAUDE_PLUGIN_ROOT}/references/ai-frameworks.md
@${CLAUDE_PLUGIN_ROOT}/references/ai-evals.md
</execution_context>

<context>
Phase number: $ARGUMENTS — optional, auto-detects next unplanned phase if omitted.
</context>

<process>
Execute @${CLAUDE_PLUGIN_ROOT}/workflows/ai-integration-phase.md end-to-end.
Preserve all workflow gates.
</process>
