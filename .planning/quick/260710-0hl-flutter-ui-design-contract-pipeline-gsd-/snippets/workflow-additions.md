Edits to `workflows/ui-phase.md`. Two additive insertions and one small line replacement, all inside Section "1. Initialize" and Section "5. Spawn gsd-ui-researcher". No other section changes.

===EDIT-1 (addition) anchor: insert AFTER the closing ``` of the "Detect sketch findings" bash block and BEFORE the line "Resolve UI agent models:"===

Detect UI stack (Flutter vs web) and pick the matching UI-SPEC template:

```bash
UI_STACK="web"
if [[ -f pubspec.yaml || -f lib/main.dart ]] || find . -maxdepth 4 -name "*.dart" 2>/dev/null | head -1 | grep -q .; then
  UI_STACK="flutter"
fi
UI_SPEC_TEMPLATE="templates/UI-SPEC.md"
if [[ "$UI_STACK" == "flutter" ]]; then
  UI_SPEC_TEMPLATE="templates/UI-SPEC-flutter.md"
fi
```

===END EDIT-1===

===EDIT-2 (replacement) anchor: inside the researcher prompt template in Section "5. Spawn gsd-ui-researcher", the `<output>` block===

Replace this exact block:

<output>
Write to: {phase_dir}/{padded_phase}-UI-SPEC.md
Template: ${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/cache/gsd-plugin/current}/templates/UI-SPEC.md
</output>

With this exact block (only the Template line changes, from the hardcoded web path to the `${UI_SPEC_TEMPLATE}` variable resolved in EDIT-1 — resolves to the identical `templates/UI-SPEC.md` path for web projects, so web behavior is unchanged):

<output>
Write to: {phase_dir}/{padded_phase}-UI-SPEC.md
Template: ${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/cache/gsd-plugin/current}/${UI_SPEC_TEMPLATE}
</output>

===END EDIT-2===

===EDIT-3 (addition) anchor: inside the same researcher prompt template, the `<config>` block===

Replace this exact block:

<config>
commit_docs: {commit_docs}
phase_dir: {phase_dir}
padded_phase: {padded_phase}
</config>

With this exact block (one new line added, existing three lines unchanged):

<config>
commit_docs: {commit_docs}
phase_dir: {phase_dir}
padded_phase: {padded_phase}
ui_stack: {UI_STACK}
</config>

===END EDIT-3===

Do not modify Section "7. Spawn gsd-ui-checker" — the checker self-detects `ui_stack` from UI-SPEC.md frontmatter/content per its own `<stack_detection>` gate, no value needs to be passed from the workflow.
