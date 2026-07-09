Each block below is a pure insertion into `agents/gsd-ui-researcher.md`. Insert exactly as written, at the anchor described, using Edit (old_string = the anchor text shown, new_string = anchor text + inserted block, so the existing anchor text itself is preserved unchanged). Do not alter any character outside these insertions.

===BLOCK-A anchor: insert immediately BEFORE the line `<shadcn_gate>` (i.e. right after `</tool_strategy>` and the blank line that follows it)===

<stack_detection_gate>

## Stack Detection Gate (runs first — before the shadcn Gate)

Detect the project's UI stack before any other gate or question logic runs. This determines which entirely separate branch of this document governs the rest of research: Flutter or web. The two branches never share mutable logic — only the overall document shape (design contract categories, output format).

```bash
# Flutter signals
ls pubspec.yaml lib/main.dart 2>/dev/null
find . -maxdepth 4 -name "*.dart" 2>/dev/null | head -5
```

**IF `pubspec.yaml` exists OR `lib/main.dart` exists OR `.dart` files are found:**
Set `ui_stack = flutter`. Skip `<shadcn_gate>` and `<design_contract_questions>` entirely — they are web-only. Use `<flutter_gate>` and `<flutter_design_contract_questions>` instead. In the compile step, use `templates/UI-SPEC-flutter.md` (Step 5-Flutter in `<execution_flow>`) instead of `templates/UI-SPEC.md`.

**ELSE (default / fallback — no Flutter signals found):**
Set `ui_stack = web`. Proceed through `<shadcn_gate>`, `<design_contract_questions>`, and the rest of `<execution_flow>` exactly as documented — unchanged, existing behavior.

</stack_detection_gate>

===END BLOCK-A===

===BLOCK-B anchor: insert immediately AFTER the closing tag `</design_contract_questions>` and BEFORE the opening tag `<output_format>`===

<flutter_gate>

## Flutter Design Gate (used only when `ui_stack == flutter` — replaces the shadcn Gate for this branch)

```bash
# Detect existing design system state
grep -rn "ThemeData\|ColorScheme\|useMaterial3" lib/ 2>/dev/null | head -20
find lib -iname "*theme*.dart" 2>/dev/null
```

Catalog what already exists (`ThemeData`, `ColorScheme`, custom design tokens). Do not re-specify tokens the project already declares.

Ask the user which design system baseline to use: Material 3 (default, cross-platform), Cupertino (iOS-native look), or Adaptive (Material on Android, Cupertino on iOS). Record the answer as `design_system`. Ask target platforms (iOS / Android / Both) and record as `target_platforms`.

</flutter_gate>

<flutter_design_contract_questions>

## What to Ask (Flutter — used only when `ui_stack == flutter`)

Ask ONLY what REQUIREMENTS.md, CONTEXT.md, and RESEARCH.md did not already answer. Apply the design source cascade below before asking the user anything — each level fills in what the previous level did not cover.

### Design Source Cascade

1. **Explicit user reference (highest priority).** If the user supplied reference text and/or screenshot files for this phase, use the `Read` tool directly on any image file paths — multimodal, do not route through an MCP tool. Extract concrete layout, spacing, color, and typography cues from the images/text. These override every other source.
2. **Named reference style.** If the user names a well-known app as the target look (e.g. "like Telegram", "Instagram-style", "Reddit-style"), use your own knowledge of that app's UX patterns (navigation shape, layout density, accent color character) as a DIRECTION, not a pixel-exact copy — never reproduce brand-specific assets (logos, exact icon sets). Confirm current specifics via `mcp__plugin_context7_context7__resolve-library-id` + `mcp__plugin_context7_context7__query-docs`, or `mcp__plugin_context-mode_context-mode__ctx_fetch_and_index` + `mcp__plugin_context-mode_context-mode__ctx_search`, with `WebSearch` as fallback — all already in this agent's `allowed-tools`, no frontmatter change needed.
3. **Material 3 / Cupertino platform baseline (final fallback).** For anything the above two levels did not cover, fall back to the platform baseline selected in `<flutter_gate>` (`design_system`).

Never require pixel-perfect precision and never perform a screenshot-based visual audit for Flutter — that audit remains web-only (`gsd-ui-auditor`).

### Spacing
Same 4pt scale as web, logical pixels: 4, 8, 16, 24, 32, 48, 64. Confirm any exceptions (e.g. list-tile touch padding).

### Typography (Material 3 TextTheme roles)
Declare values only for the roles actually used this phase, drawn from: `displayLarge/Medium/Small`, `headlineLarge/Medium/Small`, `titleLarge/Medium/Small`, `bodyLarge/Medium/Small`, `labelLarge/Medium/Small`.

### Color (Material 3 ColorScheme roles)
Declare: `primary`, `onPrimary`, `primaryContainer`, `secondary`, `tertiary`, `surface`, `error`. Keep the 60/30/10 dominant/secondary/accent logic in the role comments (e.g. `surface` ≈ 60% dominant, `secondary`/`primaryContainer` ≈ 30%, `primary`/`tertiary` reserved as the ≈10% accent — list the SPECIFIC elements accent is reserved for, same discipline as the web contract).

### Copywriting
Identical contract to web — stack-agnostic, carry over as-is:
- Primary CTA label for this phase: [specific verb + noun]
- Empty state copy: [what does the user see when there is no data]
- Error state copy: [problem description + what to do next]
- Any destructive actions in this phase: [list each + confirmation approach]

### Navigation Pattern
Bottom nav bar / drawer / tabs — declare which, and behavior when switching (state preservation, transition style).

### Touch & Platform Conventions
Minimum touch target: 48dp (Material) or 44pt (iOS HIG) per selected `design_system`/`target_platforms`. Declare gesture patterns used (swipe-to-dismiss, pull-to-refresh, etc.) and safe-area handling.

### Icon Library
Material Icons / Cupertino Icons / named custom package.

### Package Safety (replaces Registry Safety — lightweight, non-blocking)
Any third-party UI packages beyond the Flutter SDK / Material / Cupertino? For each, note maintenance and popularity signals from pub.dev (last published date, pub points, likes) — a lightweight awareness check, not a blocking vetting gate like the web Registry Safety flow.

</flutter_design_contract_questions>

===END BLOCK-B===

===BLOCK-C anchor: insert immediately BEFORE the closing tag `</output_format>` (after the existing "commit_docs controls git only, NOT file writing" line)===

**Flutter branch:** If `ui_stack == flutter`, use the template at `templates/UI-SPEC-flutter.md` instead of `templates/UI-SPEC.md`. Write to the same path: `$PHASE_DIR/$PADDED_PHASE-UI-SPEC.md`.

===END BLOCK-C===

===BLOCK-D anchor: insert immediately AFTER the opening tag `<execution_flow>` and BEFORE the line `## Step 1: Load Context`===

## Step 0: Stack Detection Gate

Run `<stack_detection_gate>` first. Set `ui_stack` to `flutter` or `web`. This determines which step variants run below: `web` proceeds through Steps 1-7 exactly as documented; `flutter` proceeds through Steps 1-2 unchanged, then Step 3-Flutter, Step 4-Flutter, and Step 5-Flutter (defined at the end of this section) instead of Steps 3-5, then Steps 6-7 unchanged.

===END BLOCK-D===

===BLOCK-E anchor: insert immediately AFTER the line `## Step 7: Return Structured Result` and BEFORE the closing tag `</execution_flow>`===

## Step 3-Flutter: Flutter Design Gate

Run `<flutter_gate>` (used only when `ui_stack == flutter`, instead of Step 3's shadcn Gate).

## Step 4-Flutter: Flutter Design Contract Questions

For each category in `<flutter_design_contract_questions>`: apply the design source cascade first, skip if upstream artifacts already answered, ask the user only what remains unanswered. Batch questions into a single interaction where possible.

## Step 5-Flutter: Compile Flutter UI-SPEC.md

Read template: `${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/cache/gsd-plugin/current}/templates/UI-SPEC-flutter.md`

Fill all sections. Write to `$PHASE_DIR/$PADDED_PHASE-UI-SPEC.md`.

===END BLOCK-E===

===BLOCK-F anchor: insert immediately BEFORE the closing tag `</structured_returns>` (after the closing ``` of the "UI-SPEC Blocked" markdown fence)===

## UI-SPEC Complete (Flutter)

```markdown
## UI-SPEC COMPLETE

**Phase:** {phase_number} - {phase_name}
**Design System:** {Material 3 / Cupertino / Adaptive} — target: {iOS/Android/Both}

### Contract Summary
- Spacing: {scale summary}
- Typography: {N} TextTheme roles declared
- Color: {ColorScheme roles summary}
- Copywriting: {N} elements defined
- Navigation: {bottom nav / drawer / tabs}
- Touch & Platform: {min target dp/pt}
- Package Safety: {N} third-party packages checked

### File Created
`$PHASE_DIR/$PADDED_PHASE-UI-SPEC.md`

### Pre-Populated From
| Source | Decisions Used |
|--------|---------------|
| CONTEXT.md | {count} |
| RESEARCH.md | {count} |
| Explicit user reference (text/screenshots) | {yes/no} |
| Named reference style | {app name or "none"} |
| User input | {count} |

### Ready for Verification
UI-SPEC complete. Checker can now validate.
```

===END BLOCK-F===

===BLOCK-G anchor: insert immediately BEFORE the closing tag `</success_criteria>` (after the existing "Minimal questions" quality-indicator line)===

**Flutter path** (when `ui_stack == flutter`, substitutes the shadcn/Registry-Safety-specific checks above):

- [ ] Flutter stack detected via `pubspec.yaml` / `lib/main.dart` / `.dart` files
- [ ] Flutter Design Gate executed (`<flutter_gate>`)
- [ ] Design source cascade applied (explicit reference > named style > Material 3/Cupertino baseline)
- [ ] Spacing scale declared (multiples of 4 only)
- [ ] Typography declared using Material 3 TextTheme roles
- [ ] Color contract declared using Material 3 ColorScheme roles (60/30/10 logic in comments)
- [ ] Copywriting contract declared (CTA, empty, error, destructive)
- [ ] Navigation Pattern declared
- [ ] Touch & Platform Conventions declared (48dp/44pt minimum target)
- [ ] Package Safety declared (non-blocking)
- [ ] UI-SPEC.md written using `templates/UI-SPEC-flutter.md`
- [ ] No screenshot-based visual audit required (web-only)

===END BLOCK-G===
