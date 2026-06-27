---
created: 2026-06-27T02:10:00.000Z
title: Route ideation-shaped questions to /gsd:explore (symmetric with edits to /gsd:quick)
area: general
files:
  - CLAUDE.md
  - skills/do/
  - skills/explore/
---

## Problem

CLAUDE.md's GSD Workflow Enforcement tells the assistant to route *edits* through a GSD command (/gsd:quick, /gsd:debug, /gsd:execute-phase). There is no symmetric guidance to route *ideation* through /gsd:explore. A running GSD project surfaced this: the assistant said "per the project rule I'll route this edit through /gsd:quick", and the user asked whether something similar should route general questions to /gsd:explore.

The mechanism already half-exists: /gsd:do routes freeform text to the right command, and /gsd:explore is the ideation home. What is missing is the convention plus a classifier.

A blanket "route every question through /gsd:explore" rule would be net-negative: it adds ceremony/friction to simple factual lookups ("what does this return?") that should stay conversational. Edits mutate the repo (tracking pays off); most questions do not.

## Solution

TBD. The valuable narrow version is a classifier, not a blanket rule:
- Detect ideation-shaped questions (open-ended "should we build X", "what's the best approach for Y", "what if", multi-option design questions that will lead to work) and OFFER/route them to /gsd:explore, capturing the thinking as durable artifacts.
- Leave factual/lookup/debug questions as plain conversation (or /gsd:debug).
- Reuse the intent-classification /gsd:do already does for commands; possibly add an explore-routing branch there and a one-line CLAUDE.md convention.

Best explored via /gsd:explore itself (this is an ideation question, which is the point). Not a /gsd:quick implementation task: underspecified, design-first. Revisit after the v4.0.0 release.
