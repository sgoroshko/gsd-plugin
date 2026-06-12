<purpose>
Print the installed plugin version, check GitHub (git tags) for the latest, and show update steps only when behind or the check failed. Read-only, best-effort: the online check never blocks or fails the command.
</purpose>

<process>
Run this bash block and relay its output verbatim. Add nothing beyond what it prints.

```bash
# Installed plugin.json: CLAUDE_PLUGIN_ROOT (set at plugin load), else newest
# versioned cache dir (no 'current' symlink on recent Claude Code), else 'current'.
PJ="${CLAUDE_PLUGIN_ROOT:+$CLAUDE_PLUGIN_ROOT/.claude-plugin/plugin.json}"
[ -f "$PJ" ] || PJ=$(ls -d "$HOME/.claude/plugins/cache/gsd-plugin/gsd/"*/.claude-plugin/plugin.json 2>/dev/null | sort -V | tail -1)
[ -f "$PJ" ] || PJ="$HOME/.claude/plugins/cache/gsd-plugin/current/.claude-plugin/plugin.json"
CURRENT=$(node -e "process.stdout.write(String(require('$PJ').version||''))" 2>/dev/null); [ -z "$CURRENT" ] && CURRENT="unknown"

# Latest = newest git tag (releases ship as tags, not GitHub Releases): ls-remote, then curl tags API.
LATEST=$(git ls-remote --tags --refs https://github.com/jnuyens/gsd-plugin 2>/dev/null | sed 's|.*refs/tags/v\{0,1\}||' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)
[ -z "$LATEST" ] && command -v curl >/dev/null 2>&1 && LATEST=$(curl -fsSL https://api.github.com/repos/jnuyens/gsd-plugin/tags 2>/dev/null | grep -oE '"v?[0-9]+\.[0-9]+\.[0-9]+"' | tr -d '"v' | sort -V | tail -1)

echo "GSD plugin version"; echo "=================="; echo "Installed: ${CURRENT}"
if [ -z "$LATEST" ]; then echo "Latest:    (could not check)"; STATUS=unknown
else
  echo "Latest:    ${LATEST}"
  NEWEST=$(printf '%s\n%s\n' "$CURRENT" "$LATEST" | sort -V | tail -1)
  if [ "$CURRENT" = unknown ]; then STATUS=unknown
  elif [ "$CURRENT" = "$LATEST" ]; then STATUS=current
  elif [ "$NEWEST" = "$CURRENT" ]; then STATUS=ahead; else STATUS=behind; fi
fi
echo ""
case "$STATUS" in
  current) echo "You are on the latest release." ;;
  ahead)   echo "Installed build is newer than the latest published release (local/dev build)." ;;
  behind)  echo "An update is available: ${CURRENT} -> ${LATEST}." ;;
  unknown) echo "Could not determine whether an update is available." ;;
esac
if [ "$STATUS" = behind ] || [ "$STATUS" = unknown ]; then
  printf '\nTo update (type at the Claude Code prompt):\n  /plugin marketplace update gsd-plugin\n  /plugin install gsd@gsd-plugin\n  /reload-plugins   (run in EACH open session)\n'
fi
```
</process>
