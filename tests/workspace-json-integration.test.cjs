'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOOK_BIN = path.join(__dirname, '..', 'bin', 'gsd-tools.cjs');

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-workspace-test-'));
  fs.mkdirSync(path.join(dir, '.agents'), { recursive: true });
  return dir;
}

function writeCanonicalWorkspaceJson(dir, content) {
  fs.writeFileSync(
    path.join(dir, '.agents', 'agents.workspace.json'),
    JSON.stringify(content, null, 2)
  );
}

function writeLegacyWorkspaceJson(dir, content) {
  fs.writeFileSync(
    path.join(dir, 'agents.workspace.json'),
    JSON.stringify(content, null, 2)
  );
}

function runHook(cwd) {
  const result = spawnSync('node', [HOOK_BIN, 'hook', 'session-start'], {
    cwd,
    encoding: 'utf-8',
    timeout: 5000,
    input: JSON.stringify({ source: 'startup' }),
  });
  return { stdout: result.stdout || '', stderr: result.stderr || '', status: result.status };
}

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push([true, name]);
  } catch (err) {
    checks.push([false, `${name}: ${err.message}`]);
  }
}

// Test 1: absent file produces zero workspace.json output
check('absent file produces no workspace.json injection', () => {
  const dir = makeTempRepo();
  const result = runHook(dir);
  if (result.stdout.includes('workspace.json')) {
    throw new Error('Hook injected workspace.json context when file was absent');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 2: malformed file fails soft
check('malformed file does not crash hook', () => {
  const dir = makeTempRepo();
  fs.writeFileSync(path.join(dir, '.agents', 'agents.workspace.json'), '{not valid json');
  const result = runHook(dir);
  if (result.status !== 0) {
    throw new Error(`Hook exited with status ${result.status} on malformed file`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 3: valid canonical-path file injects expected fragile files
check('canonical-path file injects fragility intelligence', () => {
  const dir = makeTempRepo();
  writeCanonicalWorkspaceJson(dir, {
    version: '1.0',
    generated: {
      version: '1.0',
      fileIndex: {
        'src/auth/middleware.ts': {
          fragility: 0.91,
          aiModificationCount: 8,
          humanModificationCount: 2,
        },
      },
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('src/auth/middleware.ts')) {
    throw new Error('Hook did not inject fragile file path');
  }
  if (!result.stdout.includes('0.91')) {
    throw new Error('Hook did not inject fragility score');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 4: legacy-path file is also read
check('legacy-path file is read when canonical absent', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-workspace-legacy-'));
  writeLegacyWorkspaceJson(dir, {
    version: '1.0',
    generated: {
      version: '1.0',
      fileIndex: {
        'src/legacy.ts': {
          fragility: 0.85,
          aiModificationCount: 5,
          humanModificationCount: 1,
        },
      },
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('src/legacy.ts')) {
    throw new Error('Legacy-path workspace.json was not read');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 5: canonical wins when both present
check('canonical path wins when both present', () => {
  const dir = makeTempRepo();
  writeCanonicalWorkspaceJson(dir, {
    version: '1.0',
    generated: {
      version: '1.0',
      fileIndex: {
        'src/canonical.ts': { fragility: 0.91, aiModificationCount: 5, humanModificationCount: 1 },
      },
    },
  });
  writeLegacyWorkspaceJson(dir, {
    version: '1.0',
    generated: {
      version: '1.0',
      fileIndex: {
        'src/legacy.ts': { fragility: 0.91, aiModificationCount: 5, humanModificationCount: 1 },
      },
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('src/canonical.ts')) {
    throw new Error('Canonical path file was not preferred');
  }
  if (result.stdout.includes('src/legacy.ts')) {
    throw new Error('Legacy file should not be read when canonical exists');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 6: framework manifest with low confidence is filtered
check('framework manifest filters low-confidence entries', () => {
  const dir = makeTempRepo();
  writeCanonicalWorkspaceJson(dir, {
    version: '1.0',
    generated: {
      version: '1.0',
      frameworkManifest: [
        { name: 'next', version: '14.2', confidence: 0.99 },
        { name: 'unknown-framework', version: '?', confidence: 0.3 },
      ],
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('next@14.2')) {
    throw new Error('High-confidence framework not injected');
  }
  if (result.stdout.includes('unknown-framework')) {
    throw new Error('Low-confidence framework should have been filtered');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 7: fragility threshold of 0.7 is enforced (per spec section 3.5)
check('files below 0.7 fragility threshold are not injected', () => {
  const dir = makeTempRepo();
  writeCanonicalWorkspaceJson(dir, {
    version: '1.0',
    generated: {
      version: '1.0',
      fileIndex: {
        'src/high.ts': { fragility: 0.85, aiModificationCount: 5, humanModificationCount: 1 },
        'src/low.ts': { fragility: 0.5, aiModificationCount: 2, humanModificationCount: 1 },
      },
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('src/high.ts')) {
    throw new Error('Above-threshold file was not injected');
  }
  if (result.stdout.includes('src/low.ts')) {
    throw new Error('Below-threshold file should have been filtered per spec section 3.5');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 8: manual.fragileFiles injection works (spec shape: { path, reason })
check('manual.fragileFiles are injected', () => {
  const dir = makeTempRepo();
  writeCanonicalWorkspaceJson(dir, {
    version: '1.0',
    manual: {
      fragileFiles: [
        { path: 'packages/auth/src/index.ts', reason: 'Single point of failure for all authentication. High blast radius.' },
      ],
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('packages/auth/src/index.ts')) {
    throw new Error('Manual fragile file path not injected');
  }
  if (!result.stdout.includes('Single point of failure')) {
    throw new Error('Manual fragile file reason not injected');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 9: coChangePatterns are injected (spec shape: { files, note })
check('coChangePatterns are injected', () => {
  const dir = makeTempRepo();
  writeCanonicalWorkspaceJson(dir, {
    version: '1.0',
    manual: {
      coChangePatterns: [
        {
          files: ['packages/contracts/src/user.ts', 'apps/api/src/routes/users.ts'],
          note: 'Schema changes require simultaneous API route updates.',
        },
      ],
    },
  });
  const result = runHook(dir);
  if (!result.stdout.includes('packages/contracts/src/user.ts')) {
    throw new Error('coChangePattern files not injected');
  }
  if (!result.stdout.includes('Schema changes')) {
    throw new Error('coChangePattern note not injected');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Test 10: HANDOFF.json read is unaffected by workspace.json presence
check('HANDOFF.json injection still works alongside workspace.json', () => {
  const dir = makeTempRepo();
  fs.mkdirSync(path.join(dir, '.planning'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.planning', 'HANDOFF.json'),
    JSON.stringify({
      version: '1.0',
      phase_name: 'Phase 4',
      plan: '01',
      task: 3,
      source: 'manual-pause',
      partial: false,
    })
  );
  writeCanonicalWorkspaceJson(dir, { version: '1.0', generated: { version: '1.0' } });
  const result = runHook(dir);
  if (!result.stdout.includes('Phase 4')) {
    throw new Error('HANDOFF.json injection regressed');
  }
  fs.rmSync(dir, { recursive: true, force: true });
});

// Report
let failures = 0;
for (const [ok, msg] of checks) {
  console.log(ok ? `  ok  ${msg}` : `  FAIL  ${msg}`);
  if (!ok) failures += 1;
}

if (failures > 0) {
  console.log(`\n${failures} of ${checks.length} checks failed`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} checks passed`);
process.exit(0);
