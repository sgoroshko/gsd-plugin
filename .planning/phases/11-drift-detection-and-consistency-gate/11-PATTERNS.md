# Phase 11: Drift Detection and Consistency Gate - Pattern Map

**Mapped:** 2026-06-27
**Files analyzed:** 16 (8 new, 8 modified)
**Analogs found:** 16 / 16 (every file has an in-repo template; this is a port + wire phase)

> The RESEARCH.md §"Recommended Project Structure" + §"Code Examples" already supply
> the ported MinHash+LCS / phantom algorithms and the exact wiring snippets. This map
> resolves each planned file to its closest *existing* analog and pins the concrete
> excerpts to copy (path + line numbers), so the planner references real code, not the
> research's reconstructions.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `bin/lib/semantic-dup.cjs` (NEW) | utility (detector lib) | transform/batch | `bin/lib/conventions.cjs` | role+flow exact |
| `bin/lib/phantom-scaffolding.cjs` (NEW) | utility (detector lib) | transform/batch | `bin/lib/conventions.cjs` | role+flow exact |
| `bin/lib/drift-allowlist.cjs` (NEW) | utility (loader) | file-I/O / config | `bin/lib/drift.cjs` (sanitizePaths + never-throw loader shape) | role-match |
| `bin/lib/verify.cjs` `cmdVerifyDrift` (MODIFY) | service (CLI handler) | request-response | `bin/lib/verify.cjs:1416 cmdVerifyConventions` | exact |
| `bin/lib/verify-command-router.cjs` (MODIFY) | route | request-response | same file, `conventions` case (lines 27-38) | exact |
| `bin/gsd-tools.cjs` (MODIFY) | route | request-response | same file, `case 'verify'` (lines 611-620) | already wired — no change likely |
| `sdk/src/query/command-manifest.verify.ts` (MODIFY) | config (manifest) | static registration | same file, `verify.conventions` (line 15) | exact |
| `bin/lib/command-aliases.generated.cjs` (REGEN) | config (generated) | static registration | same file, `verify.conventions` block (lines 242-249) | regenerate, do not hand-edit |
| `bin/lib/config-schema.cjs` (MODIFY) | config | static registration | same file, `workflow.drift_threshold` (line 44) | exact |
| `sdk/src/query/config-schema.ts` (MODIFY) | config | static registration | same file, `workflow.drift_threshold` (line 46) | exact (mirror the CJS edit) |
| `tests/semantic-dup.test.cjs` (NEW) | test | request-response | `tests/conventions.test.cjs` | exact |
| `tests/phantom-scaffolding.test.cjs` (NEW) | test | request-response | `tests/conventions.test.cjs` | exact |
| `tests/drift-allowlist.test.cjs` (NEW) | test | request-response | `tests/conventions.test.cjs` | exact |
| `.github/workflows/check-drift.yml` (MODIFY) | config (CI) | event-driven | same file, `conventions` job (lines 55-64) | exact |
| `workflows/scan.md` (MODIFY) | workflow (skill) | request-response | `workflows/audit-milestone.md` §5.5 (config-gated bash block) | role-match |
| `workflows/audit-milestone.md` (MODIFY, new §5.6) | workflow (gate) | request-response | same file, §5.5 Nyquist (lines 141-163) | exact |
| `bin/check-gsd-release.sh` (MODIFY) | config (ops/cron) | event-driven | same file, single-REPO watch (lines 4-83) | self-template (parameterize) |
| `.gsd/drift-allowlist.json` (NEW, committed) | config (data) | file-I/O | no analog — new artifact (see No Analog) | — |
| `.vibedriftignore` (NEW, optional) | config (data) | file-I/O | no analog — gitignore-syntax | — |

---

## Shared Patterns

These cross-cutting contracts apply to ALL three new detector libs AND `cmdVerifyDrift`.
They are the Phase 10 contracts the new code must honor verbatim.

### Never-throw + skipped-sentinel (T-10-05)
**Source:** `bin/lib/conventions.cjs:306-348` (`deriveConventions`) + `293-295` (`derivedSkipped`)
**Apply to:** every public function in the 3 new detector libs and `cmdVerifyDrift`
```javascript
function derivedSkipped(reason) {
  return { skipped: true, reason, axes: [] };   // success-shape, emptied
}
function deriveConventions(files, opts = {}) {
  try {
    if (!Array.isArray(files)) return derivedSkipped('invalid-input');
    // ...
    return { skipped: false, axes };
  } catch (err) {
    return derivedSkipped('exception:' + (err && err.message ? err.message : String(err)));
  }
}
```
Detectors return `{ skipped:true, reason, <fields>:[] }` on bad input or any exception;
the success shape emptied so callers never branch on shape. Per-file reads also
`try { ... } catch { continue; }` (lines 325-330) — one bad file never fails the run.

### Path-safety (T-10-01 / V5) — reuse, do not re-implement
**Source:** `bin/lib/conventions.cjs:52` (`SAFE_PATH_RE`) + `86-96` (`sanitizePaths`) + `55` (`MAX_SCAN_BYTES`)
**Apply to:** any path arg the detectors/allowlist accept; every file read
```javascript
const SAFE_PATH_RE = /^(?!.*\.\.)(?:[A-Za-z0-9_.][A-Za-z0-9_.\-]*)(?:\/[A-Za-z0-9_.][A-Za-z0-9_.\-]*)*$/;
const MAX_SCAN_BYTES = 512 * 1024;
function sanitizePaths(paths) {
  if (!Array.isArray(paths)) return [];
  const out = [];
  for (const p of paths) {
    if (typeof p !== 'string') continue;
    if (p.startsWith('/')) continue;
    if (!SAFE_PATH_RE.test(p)) continue;
    out.push(p);
  }
  return out;
}
```
Prefer `require('./conventions.cjs').sanitizePaths` over copying. Size cap before read:
`if (!stat.isFile() || stat.size > MAX_SCAN_BYTES) continue;` (conventions.cjs:328).

### String/comment-safe pre-pass (T-10-02, linear/no-backtrack)
**Source:** `bin/lib/conventions.cjs:122-186` (`blankSpans`), exported at line 597
**Apply to:** semantic-dup token extraction AND phantom placeholder/TODO scan
```javascript
// Reuse — never hand-roll a tokenizer. Blanks string/template/regex/comment
// CONTENTS (preserving length+newlines) so a `TODO` inside a string or braces
// inside a comment never fool the scan.
const conventions = require('./conventions.cjs');
const blanked = conventions.blankSpans(src);
```
This is the documented mitigation for the phantom detector's "TODO inside a string
NOT flagged" test (RESEARCH Test Map, DRIFT-05) and the dup extractor's brace counting.

### Bounded repo walk (budget 5000, skip-dirs, cwd-relative)
**Source:** `bin/lib/verify.cjs:1516-1542` (`collectConventionCorpus`)
**Apply to:** `cmdVerifyDrift` corpus build (all 3 detectors consume one corpus)
```javascript
function collectConventionCorpus(root, cwd) {
  const SRC_RE = /\.(c|m)?[jt]sx?$/;
  const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
  const out = [];
  const stack = [root];
  let budget = 5000; // bounded walk
  while (stack.length && budget-- > 0) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) stack.push(full); }
      else if (ent.isFile() && SRC_RE.test(ent.name)) {
        out.push(path.relative(cwd, full).split(path.sep).join('/'));
      }
    }
  }
  return out;
}
```
Returns cwd-relative paths that line up with `sanitizePaths` + module reads. `cmdVerifyDrift`
should call this once and pass the corpus to all three detectors (RESEARCH Pitfall 3:
build the imported-names `Set` in a single pass, not per-file).

### Module-export tail (internals exposed for tests)
**Source:** `bin/lib/conventions.cjs:587-598`
**Apply to:** each new detector lib
```javascript
module.exports = {
  detect,                 // primary entry (mirror deriveConventions/checkConformance)
  // internals exposed for tests / the verify subcommand:
  buildShingles, minHashSignature, lcsSimilarity, /* ... */
};
```

---

## Pattern Assignments

### `bin/lib/semantic-dup.cjs` (NEW — detector lib, transform)

**Analog:** `bin/lib/conventions.cjs` (pure, zero-dep, never-throws, blankSpans reuse).
**Algorithm source:** RESEARCH §"Code Examples / The MinHash + LCS structural-clone algorithm"
ports the exact constants (SHINGLE 5, PERMUTATIONS 128, BANDS 16, ROWS 8, MIN_BODY_TOKENS 15,
FLAG_THRESHOLD 0.7) and functions verbatim from `@vibedrift/cli@0.14.4`.

**Header/structure pattern** (mirror conventions.cjs:1-39): module doc-comment stating
zero-dep + never-throw + advisory-tier, then `'use strict'`, `node:fs`/`node:path` requires,
frozen `const` block.

**Reuse, don't re-implement:**
- `conventions.blankSpans(src)` before token extraction (Shared Patterns).
- `conventions.sanitizePaths` / `MAX_SCAN_BYTES` for reads (Shared Patterns).
- `verify.collectConventionCorpus` provides the file list (consumed via `cmdVerifyDrift`).

**Entry-point shape** (mirror conventions.cjs:306-348 `deriveConventions`):
`detect(corpus, { cwd, allow })` → `{ skipped:false, pairs:[...], suppressed:[...] }` or
`{ skipped:true, reason, pairs:[], suppressed:[] }`. Cross-file only, length-ratio guards,
deterministic `PERM_SEEDS` (no `Math.random` — Pitfall 5).

**D-09 noise exclusion:** never emit 50-line / unreachable / unused-export / comment-density
findings (RESEARCH §"Anti-Patterns to Avoid").

---

### `bin/lib/phantom-scaffolding.cjs` (NEW — detector lib, transform)

**Analog:** `bin/lib/conventions.cjs` (same contracts) + `extractIdentifiers` pattern.
**Algorithm source:** RESEARCH §"Phantom-scaffolding: import-graph + CRUD-name" supplies
`EXPORT_NAMED_PATTERNS` / `IMPORT_PATTERNS` (covers ESM `import` AND CJS `require` — Pitfall 3)
and the CRUD verb buckets.

**Identifier-extraction pattern to mirror** (conventions.cjs:196-209 `extractIdentifiers`):
```javascript
function extractIdentifiers(src) {
  const blanked = blankSpans(src);
  const fns = [...blanked.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]);
  const consts = [...blanked.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)].map((m) => m[1]);
  // ...
}
```
Same shape: regex over `blankSpans`-cleaned source. Add the export/import pattern sets from
RESEARCH. Build ONE flat `Set` of all imported names (single pass), then phantom = a
CRUD-named export absent from that set. Linear, not O(files²).

**CRUD verb taxonomy:** RESEARCH supplies VibeDrift's buckets; note conventions.cjs already
has a related `READ_VERBS`/`MUTATE_VERBS` taxonomy (lines 70-77) — reuse/extend rather than
introduce a third overlapping verb list where sensible.

**Placeholder detection:** scan `blankSpans`-cleaned bodies for `return null|undefined|{}|[]`
paired with a `TODO|TBD|FIXME|not implemented` comment. blankSpans guarantees a TODO inside a
string is never matched (Shared Patterns).

---

### `bin/lib/drift-allowlist.cjs` (NEW — loader, file-I/O)

**Analog:** `bin/lib/drift.cjs` (`SAFE_PATH_RE` + `sanitizePaths` + never-throw loader idiom)
and the per-file `try/catch` JSON-read style.
**Format:** RESEARCH §"The `.vibedrift` Allowlist Format" — a GSD-native pair-allowlist
`.gsd/drift-allowlist.json` (`{ intentional: [{ a, b, reason }] }`) PLUS an optional
`.vibedriftignore` (gitignore-syntax path globs, portable surface).

**Loader shape** (never-throw): `load(cwd)` returns `{ pairs:[...], ignore:[...] }` or an
empty-but-valid object on missing/malformed file (mirror `derivedSkipped` philosophy — never
throw on a bad allowlist).
```javascript
function load(cwd) {
  try {
    const raw = fs.readFileSync(path.resolve(cwd, '.gsd/drift-allowlist.json'), 'utf8');
    const cfg = JSON.parse(raw);
    return { pairs: Array.isArray(cfg.intentional) ? cfg.intentional : [], /* ... */ };
  } catch { return { pairs: [], ignore: [] }; }
}
```
**Suppression is auditable (D-07):** a suppressed `(A,B)` pair is moved to the report's
`suppressed:[]` array, NEVER dropped. Suppress iff `(a~A && b~B)` or symmetric.

**Open Question 1 (flag to planner):** the literal-`.vibedrift`-format-vs-GSD-native split is
a one-line judgment call (RESEARCH §"Open Questions" #1). Recommendation: ship both, document
divergence.

---

### `bin/lib/verify.cjs` — add `cmdVerifyDrift` (MODIFY — CLI handler, request-response)

**Analog (exact):** `bin/lib/verify.cjs:1416-1505` (`cmdVerifyConventions`). Copy its structure.

**emit + top-level try/catch** (lines 1416-1419, 1502-1504):
```javascript
function cmdVerifyDrift(cwd, opts, raw) {
  const emit = (payload) => output(payload, raw);
  try {
    const o = opts && typeof opts === 'object' ? opts : {};
    const corpus = collectConventionCorpus(cwd, cwd);
    const allow   = require('./drift-allowlist.cjs').load(cwd);
    const conv    = require('./conventions.cjs').deriveConventions(corpus, { cwd });
    const dup     = require('./semantic-dup.cjs').detect(corpus, { cwd, allow });
    const phantom = require('./phantom-scaffolding.cjs').detect(corpus, { cwd });
    // composite score + severity rank; D-09 noise excluded at detector level.
    emit({ skipped: false, score, findings, suppressed: dup.suppressed, counts });
  } catch (err) {
    emit({ skipped: true, reason: 'exception: ' + (err && err.message ? err.message : String(err)) });
  }
}
```
- `output` helper is `bin/lib/core.cjs:221` (`output(result, raw, rawValue)`) — same helper
  cmdVerifyConventions uses; `raw` selects JSON output.
- Unsafe-scope / empty-corpus early skips: mirror lines 1426-1442 (`emit({ skipped:true, reason })`).
- Never exits non-zero; the `--fail-on-score` cutoff (D-06) is the ONLY non-zero path and only
  when explicitly passed (decided by the gate/scan caller, not the handler core).

**Export it** in the `module.exports` block (lines 1544-1557) alongside `cmdVerifyConventions`.

---

### `bin/lib/verify-command-router.cjs` — add `drift` case (MODIFY — route)

**Analog (exact):** the `conventions` case, `bin/lib/verify-command-router.cjs:27-38`.
```javascript
// add alongside the 'conventions' case (mirror its arg-parse loop):
} else if (subcommand === 'drift') {
  const rest = args.slice(2);
  const o = { scope: undefined, top: undefined, json: rest.includes('--json'), failOnScore: undefined };
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--scope') o.scope = rest[++i];
    else if (rest[i] === '--top') o.top = +rest[++i];
    else if (rest[i] === '--fail-on-score') o.failOnScore = +rest[++i];
  }
  verify.cmdVerifyDrift(cwd, o, raw);
}
```
`bin/gsd-tools.cjs:611-620` `case 'verify'` already delegates to `routeVerifyCommand` —
**no change needed there.** The `error()` fallback at router line 40 prints
`VERIFY_SUBCOMMANDS` (sourced from the generated aliases — see below).

---

### CJS↔SDK registration (the dual hand-synced gotcha — Pitfall 6)

Add the entry in **both** places, then **regenerate**, then **rebuild dist**:

**1. SDK manifest** — `sdk/src/query/command-manifest.verify.ts:15` is the template:
```typescript
{ family: 'verify', canonical: 'verify.drift', aliases: ['verify drift'], mutation: false, outputMode: 'json' },
```
**2. Regenerate** `bin/lib/command-aliases.generated.cjs` (do NOT hand-edit — it is generated;
the `verify.conventions` block at lines 242-249 shows the output shape, and
`VERIFY_SUBCOMMANDS` is derived at line 823). Run the regen + `sdk/` `check:alias-drift`
freshness check (RESEARCH §"Runtime State Inventory").
**3. Rebuild** `sdk/dist` since the TS manifest changed (memory: gsd-sdk runs from `sdk/dist`,
not source).

---

### Config keys — BOTH schema files (MODIFY — Pitfall 6 parity)

**Analogs (exact):** the existing `workflow.drift_threshold` / `workflow.drift_action` entries
(note: those are a *different* feature — codebase-drift — so pick distinct key names, e.g.
`workflow.drift_gate` / `workflow.drift_fail_on_score`).
- `bin/lib/config-schema.cjs:44-45` (CJS `VALID_CONFIG_KEYS` Set)
- `sdk/src/query/config-schema.ts:46-47` (SDK `VALID_CONFIG_KEYS` Set)

Add the identical key string to BOTH Sets. Parity is enforced by
`tests/config-schema-sdk-parity.test.cjs` (referenced in the SDK schema header, lines 5-14)
and CJS↔docs parity by `tests/config-schema-docs-parity.test.cjs` (CJS header lines 6-12) —
so also add the keys to `docs/CONFIGURATION.md`. Rebuild `sdk/dist` after the TS edit.

---

### Test files (NEW — `tests/semantic-dup.test.cjs`, `tests/phantom-scaffolding.test.cjs`, `tests/drift-allowlist.test.cjs`)

**Analog (exact):** `tests/conventions.test.cjs:1-29` — the zero-dep harness header.
```javascript
#!/usr/bin/env node
'use strict';
// Zero-dep harness: node:assert, a bare check(name, fn) runner, a failure
// counter, and a process.exit(1) footer. CI runs via `node tests/<name>.test.cjs`.
const assert = require('node:assert');
const conventions = require('../bin/lib/conventions.cjs');   // ← swap for the lib under test
let failures = 0;
function check(name, fn) {
  try { fn(); console.log(`  ok - ${name}`); }
  catch (e) { console.error(`  FAIL - ${name}: ${e.message}`); failures++; }
}
// ... checks ...
// footer (end of file): if (failures) process.exit(1);
```
First `check` asserts the lib exports the public functions (conventions.test.cjs:33-40).
Cover the Test Map rows from RESEARCH §"Validation Architecture" (determinism, never-throw,
cross-file/ESM+CJS phantom, string-safe placeholder, pair-suppression auditability, D-09
noise never emitted).

---

### `.github/workflows/check-drift.yml` — add `drift-detectors` job (MODIFY — CI)

**Analog (exact):** the `conventions` job, lines 55-64.
```yaml
  drift-detectors:
    name: Drift detectors (Phase 11)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Run drift detector tests
        run: |
          node tests/semantic-dup.test.cjs
          node tests/phantom-scaffolding.test.cjs
          node tests/drift-allowlist.test.cjs
```
**No `npm ci`** — mirror the `conventions` job exactly (zero-dep; only `handoff-schema` runs
`npm ci`). Optionally add a `verify drift --json` smoke step.

---

### `workflows/audit-milestone.md` — new §5.6 opt-in gate (MODIFY — gate)

**Analog (exact):** §5.5 Nyquist Compliance Discovery, lines 141-163.
```markdown
## 5.6. Drift Integrity Gate (opt-in)

Skip if `workflow.drift_gate` is not `true` (absent/false = disabled, default OFF — D-05).

```bash
DRIFT_GATE=$(gsd-sdk query config-get workflow.drift_gate --raw --default false)
```

If not `true`: skip entirely.

Otherwise run `gsd-tools verify drift --scope . --json`, parse the composite score +
findings + suppressed list, and report with recommended-fix framing. Add to audit YAML:
`drift: { score, findings, suppressed, overall }`.

Never blocks the milestone. Only fail when `workflow.drift_fail_on_score` (or the explicit
`--fail-on-score N`) is set AND the score is below it (D-06).
```
Copy §5.5's exact skeleton: config-flag read → skip-if-disabled → gather → add-to-YAML →
"Discovery only / never auto-fails" note. The audit YAML block is at lines 165-181.

---

### `workflows/scan.md` — `--drift` branch (MODIFY — skill)

**Analog:** §5.5 audit-milestone config-gated bash block (the `gsd-sdk query config-get` →
branch idiom) for the arg parse; scan.md's own existing `--focus` parse for the flag-handling
shape. `--drift` is a non-agent, pure-compute mode: parse `--drift`, `--top N`,
`--fail-on-score N`, then `gsd-tools verify drift --scope . --top N` and print the ranked
markdown to stdout (RESEARCH §"Pattern 3"). No `gsd-codebase-mapper` spawn.

---

### `bin/check-gsd-release.sh` — second-upstream watch (MODIFY — ops/cron)

**Analog (self-template):** the existing single-`REPO` watch, lines 4-83. The whole script is
the pattern; parameterize it for a second repo.
- `REPO="open-gsd/gsd-core"` (line 10) → add a `@vibedrift/cli` repo watch.
- `VERSION_FILE="$HOME/.gsd-last-known-version"` (line 11) → sibling
  `$HOME/.vibedrift-last-known-version` (first-run handling at lines 33-38 fires no spurious
  email — seed it, per RESEARCH §"Runtime State Inventory").
- `gh api repos/$REPO/releases/latest --jq '.tag_name'` (line 23) is the watch primitive;
  `bin/maintenance/check-upstream-schema.cjs` is the reference for a `gh release view` sibling.
- **Live-cron-copy sync (manual):** the cron runs a *copy* at `~/claude-code-gsd`, not a
  symlink (memory `260608-vk9`) — sync after editing the repo file.
- **D-02 scope:** Claude's discretion whether this is its own thin plan/wave; RESEARCH §"Open
  Questions" #3 recommends a small standalone sibling watch rather than overloading gsd-core's.

---

## Conventions (derived for the `bin/lib` detector scope)

Derived from `bin/lib/conventions.cjs`, `bin/lib/drift.cjs`, `bin/lib/verify.cjs`,
`tests/conventions.test.cjs` — the new files MUST conform (this phase exists to detect drift;
its own files must not introduce any).

| Axis | Convention | Evidence |
|------|-----------|----------|
| File-name casing | **kebab-case**, `.cjs` for `bin/lib`, `.test.cjs` for tests | `conventions.cjs`, `phantom-scaffolding.cjs` (planned), `conventions.test.cjs` |
| Identifier casing | **camelCase** functions, **CONSTANT** frozen consts, **Pascal** none here | `deriveConventions`, `MAX_SCAN_BYTES`, `SAFE_PATH_RE` |
| Module system | **CJS** (`'use strict'` + `require` + `module.exports`) in `bin/lib`; **ESM** in `sdk/src` | conventions.cjs:36-39, 587 |
| Export style | single trailing `module.exports = { ... }` object, internals exposed "for tests" | conventions.cjs:587-598; verify.cjs:1544-1557 |
| Imports | `require('node:fs')` / `require('node:path')` (node: prefix); local libs `require('./x.cjs')` | conventions.cjs:38-39; verify.cjs:1420 |
| Error handling | **never-throw**; top-level `try/catch` → `{ skipped:true, reason }`; per-file `try { } catch { continue; }` | conventions.cjs:307/345, 325-330 |
| Doc-comment | leading block comment stating purpose + zero-dep + never-throw + design contracts | conventions.cjs:1-34 |
| Section markers | `// ─── Section ───` ASCII box-rule separators | conventions.cjs:41, 98, 112 |
| Determinism | no `Math.random` for hashing; frozen `Object.freeze([...])` const tables | conventions.cjs:44, 61-77 (use seeded FNV-1a per RESEARCH) |
| Path safety | reuse `SAFE_PATH_RE` + `sanitizePaths` + `MAX_SCAN_BYTES`, never re-roll | conventions.cjs:52-55, 86-96 |
| Test harness | zero-dep `check(name, fn)` + `failures` counter + `process.exit(1)` footer; `#!/usr/bin/env node` + `'use strict'` | conventions.test.cjs:1-29 |
| Config keys | add to BOTH `config-schema.cjs` + `config-schema.ts` + `docs/CONFIGURATION.md`; rebuild dist | parity test headers |

---

## No Analog Found

| File | Role | Data Flow | Reason | Planner Guidance |
|------|------|-----------|--------|------------------|
| `.gsd/drift-allowlist.json` | config (data) | file-I/O | No existing pair-allowlist artifact in the repo | Use the schema in RESEARCH §"Allowlist Format" (`{ intentional: [{ a, b, reason }] }`); pre-seed the CJS↔SDK dual-resolver rule (`bin/lib/**` ↔ `sdk/src/**`) |
| `.vibedriftignore` | config (data) | file-I/O | gitignore-syntax exclusion file new to the repo (optional/portable surface) | Plain gitignore-style globs for fixture/generated/dist paths; the loader reads it but a glob engine is out of scope (simple prefix match per RESEARCH §"Alternatives Considered") |

---

## Metadata

**Analog search scope:** `bin/lib/`, `bin/`, `bin/maintenance/`, `sdk/src/query/`, `tests/`,
`workflows/`, `.github/workflows/`
**Files scanned (read for excerpts):** conventions.cjs, drift.cjs, verify.cjs,
verify-command-router.cjs, config-schema.cjs, config-schema.ts, command-manifest.verify.ts,
command-aliases.generated.cjs, conventions.test.cjs, check-gsd-release.sh,
check-upstream-schema.cjs, check-drift.yml, audit-milestone.md, gsd-tools.cjs
**Pattern extraction date:** 2026-06-27
