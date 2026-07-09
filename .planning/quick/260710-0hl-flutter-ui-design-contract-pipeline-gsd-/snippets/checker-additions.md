Each block below is a pure insertion into `agents/gsd-ui-checker.md`. Insert exactly as written, at the anchor described, using Edit (old_string = the anchor text shown, new_string = anchor text + inserted block, so the existing anchor text itself is preserved unchanged). Do not alter any character outside these insertions.

===BLOCK-A anchor: insert immediately AFTER the closing tag `</upstream_input>` and BEFORE the opening tag `<verification_dimensions>`===

<stack_detection>

## Stack Detection (mirrors gsd-ui-researcher — determines which dimension set applies)

Determine `ui_stack` from the loaded UI-SPEC.md before scoring any dimension:

- **IF frontmatter contains `ui_stack: flutter`** (or `design_system:`/`target_platforms:` keys are present) **OR the body contains a `## Navigation Pattern` or `## Touch & Platform Conventions` section header:** set `ui_stack = flutter`. Evaluate `<flutter_verification_dimensions>` instead of `<verification_dimensions>` Dimension 3, 4, and 6; skip Dimension 6 (Registry Safety) entirely — it does not apply to Flutter.
- **ELSE (default — frontmatter has no Flutter markers, body has a `## Registry Safety` section or no Flutter-specific sections):** set `ui_stack = web`. Evaluate `<verification_dimensions>` exactly as documented — unchanged, existing behavior.

</stack_detection>

===END BLOCK-A===

===BLOCK-B anchor: insert immediately AFTER the closing tag `</verification_dimensions>` and BEFORE the opening tag `<verdict_format>`===

<flutter_verification_dimensions>

## Flutter Dimension Set (used only when `ui_stack == flutter` — replaces Dimensions 3, 4, 6 above; Dimensions 1, 2, 5 are unchanged; Registry Safety does not apply)

## Dimension 3: Color (Flutter — Material 3 ColorScheme roles)

**BLOCK if:**
- `primary`/`tertiary` (accent-equivalent) reserved-for list is empty or says "all interactive elements"
- More than one accent-equivalent role declared without semantic justification

**FLAG if:**
- 60/30/10 mapping not declared in the role comments (`surface`≈60, `secondary`/`primaryContainer`≈30, `primary`/`tertiary`≈10)
- No `error` role declared when destructive actions exist in the copywriting contract

## Dimension 4: Typography (Flutter — Material 3 TextTheme roles)

**BLOCK if:**
- Any declared role name is not a valid Material 3 TextTheme role (`displayLarge/Medium/Small`, `headlineLarge/Medium/Small`, `titleLarge/Medium/Small`, `bodyLarge/Medium/Small`, `labelLarge/Medium/Small`)
- Conflicting values declared for the same role

**FLAG if:**
- No line height declared for a declared role

## Dimension 6: Navigation Pattern (Flutter — replaces Registry Safety)

**BLOCK if:**
- No navigation pattern declared (section empty or missing)

**FLAG if:**
- Switching behavior (state preservation / transition style) not described

## Dimension 7: Touch & Platform Conventions (Flutter — new)

**BLOCK if:**
- Minimum touch target not declared for the selected `target_platforms` (48dp Material / 44pt iOS HIG)

**FLAG if:**
- Gesture patterns or safe-area handling not mentioned

## Package Safety (Flutter — non-blocking, not a scored dimension)

Package Safety is populated by the researcher as a lightweight, non-blocking awareness note (pub.dev maintenance/popularity signals). The checker does not gate on it — do not assign BLOCK/FLAG/PASS to this section; note its presence or absence only as an informational remark in the verdict output.

</flutter_verification_dimensions>

===END BLOCK-B===

===BLOCK-C anchor: insert immediately BEFORE the closing tag `</verdict_format>` (after the existing "If APPROVED: update UI-SPEC.md..." line)===

**Flutter output format** (used only when `ui_stack == flutter`):

```
UI-SPEC Review — Phase {N} (Flutter)

Dimension 1 — Copywriting:                  {PASS / FLAG / BLOCK}
Dimension 2 — Visuals:                      {PASS / FLAG / BLOCK}
Dimension 3 — Color:                        {PASS / FLAG / BLOCK}
Dimension 4 — Typography:                   {PASS / FLAG / BLOCK}
Dimension 5 — Spacing:                      {PASS / FLAG / BLOCK}
Dimension 6 — Navigation Pattern:           {PASS / FLAG / BLOCK}
Dimension 7 — Touch & Platform Conventions: {PASS / FLAG / BLOCK}

Package Safety: {noted / not declared} (informational, non-blocking)

Status: {APPROVED / BLOCKED}
```

Same BLOCKED/APPROVED aggregation rule as the web format: BLOCKED if any dimension is BLOCK, APPROVED if all are PASS or FLAG.

===END BLOCK-C===

===BLOCK-D anchor: insert immediately BEFORE the closing tag `</structured_returns>` (after the existing "Issues Found" markdown fence closes)===

## UI-SPEC Verified (Flutter)

```markdown
## UI-SPEC VERIFIED

**Phase:** {phase_number} - {phase_name}
**Status:** APPROVED

### Dimension Results
| Dimension | Verdict | Notes |
|-----------|---------|-------|
| 1 Copywriting | {PASS/FLAG} | {brief note} |
| 2 Visuals | {PASS/FLAG} | {brief note} |
| 3 Color | {PASS/FLAG} | {brief note} |
| 4 Typography | {PASS/FLAG} | {brief note} |
| 5 Spacing | {PASS/FLAG} | {brief note} |
| 6 Navigation Pattern | {PASS/FLAG} | {brief note} |
| 7 Touch & Platform Conventions | {PASS/FLAG} | {brief note} |

### Recommendations
{If any FLAGs: list each as non-blocking recommendation}
{If all PASS: "No recommendations."}
{Package Safety informational note, if any}

### Ready for Planning
UI-SPEC approved. Planner can use as design context.
```

===END BLOCK-D===

===BLOCK-E anchor: insert immediately BEFORE the closing tag `</success_criteria>` (after the existing "Context-aware" quality-indicator line)===

**Flutter path** (when `ui_stack == flutter`, substitutes Registry-Safety-specific checks with):

- [ ] `<stack_detection>` correctly identified `ui_stack` from UI-SPEC.md frontmatter/content
- [ ] Dimensions 1, 2, 5 evaluated exactly as the web dimension set (unchanged)
- [ ] Dimensions 3, 4 evaluated using `<flutter_verification_dimensions>` (Material 3 role sets)
- [ ] Dimension 6 (Navigation Pattern) and Dimension 7 (Touch & Platform Conventions) evaluated
- [ ] Registry Safety dimension skipped entirely (does not apply to Flutter)
- [ ] Package Safety noted informationally only — never scored BLOCK/FLAG/PASS

===END BLOCK-E===
