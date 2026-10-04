import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cp, link, lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { release, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { aggregateResults, MAX_RESULT_BYTES, readResultFile, validateGroupResult } from '../scripts/ci/adapterResults.js';
import { ADAPTER_BASELINE, ADAPTER_GROUPS, ADAPTER_PLAN_BASELINE, discoverAdapterPlan,
  readAdapterSelection, reconstructAdapterBaseline, verifyAdapterBaseline, verifyAdapterPlan } from '../scripts/ci/adapterTestPlan.js';
import { bindSources, parseFooter } from '../scripts/ci/runAdapterGroups.js';

// Infrastructure-only synthetic fixtures and registration metadata. Discovery
// imports the suite only in plan mode; no adapter callback, conformance copy,
// or diagnostic foundation is executed by these tests.
const digest = (value) => createHash('sha256').update(value).digest('hex');
const clone = (value) => JSON.parse(JSON.stringify(value));

function fixture() {
  const plan = {
    schemaVersion: 1,
    groups: ['source', 'timing'],
    cases: [
      { id: 'source/control', group: 'source', family: 'source', variants: ['base', 'edge'] },
      { id: 'source/mutant', group: 'source', family: 'source', variants: ['control', 'mutation'] },
      { id: 'timing/one', group: 'timing', family: 'timing', variants: ['boundary'] },
    ],
  };
  const expected = {
    context: { kind: 'ci', runId: '12345', attempt: '1' },
    sources: {
      repository: 'synthetic/repository', workflow: '.github/workflows/ci.yml', head: '1'.repeat(40),
      dirty: true, files: [{ path: 'synthetic.js', bytes: 12, sha256: digest('local bytes') }],
    },
    plan, planSha256: digest(JSON.stringify(plan)), nodeVersions: ['20.19.0', '22.12.0'],
  };
  const results = expected.nodeVersions.flatMap((nodeVersion) => plan.groups.map((group) => {
    const cases = plan.cases.filter((entry) => entry.group === group)
      .map((entry) => ({ id: entry.id, variants: [...entry.variants], status: 'pass' }));
    return {
      schemaVersion: 1, context: clone(expected.context), sources: clone(expected.sources),
      planSha256: expected.planSha256, nodeVersion, group, cases,
      completion: {
        registered: cases.length, passed: cases.length, failed: 0, cancelled: 0, skipped: 0, todo: 0,
        cleanup: { created: 3, removed: 3, pending: 0, confirmed: true },
      },
      footer: { tests: cases.length, passed: cases.length, failed: 0, cancelled: 0, skipped: 0, todo: 0 },
      native: { exitCode: 0, signal: null, timedOut: false },
      startedAt: '2026-09-28T10:00:00.000Z', endedAt: '2026-09-28T10:00:01.000Z', durationMs: 1000,
      memory: { method: 'node-resource-usage', unit: 'KiB', scope: 'test-process', maxRss: 128,
        limitations: 'excludes-runner-and-descendants' },
      logs: { stdout: { bytes: 12, sha256: digest('synthetic stdout') }, stderr: { bytes: 0, sha256: digest('') } },
    };
  }));
  return { expected, results };
}

test('CI grouping accepts complete exact sets on both expected Node versions', () => {
  const { results, expected } = fixture();
  const before = clone({ results, expected });
  assert.deepEqual(validateGroupResult(results[0], expected), {
    group: 'source', nodeVersion: '20.19.0', caseCount: 2, variantCount: 4,
  });
  assert.deepEqual(aggregateResults(results, expected), {
    status: 'pass',
    nodeVersions: [
      { nodeVersion: '20.19.0', groups: ['source', 'timing'], cases: 3, variants: 5 },
      { nodeVersion: '22.12.0', groups: ['source', 'timing'], cases: 3, variants: 5 },
    ],
    groups: 4, cases: 6, variants: 10,
  });
  assert.deepEqual({ results, expected }, before);
});

test('CI grouping compares identities independently from received order', () => {
  const { results, expected } = fixture();
  results.reverse();
  for (const result of results) {
    result.cases.reverse();
    for (const entry of result.cases) entry.variants.reverse();
  }
  assert.equal(aggregateResults(results, expected).status, 'pass');
});

test('CI grouping binds a local context separately from a CI context', () => {
  const { results, expected } = fixture();
  expected.context = { kind: 'local', runId: 'local-unique-session', attempt: '1' };
  for (const result of results) result.context = clone(expected.context);
  assert.equal(aggregateResults(results, expected).status, 'pass');
  results[0].context.kind = 'ci';
  assert.throws(() => aggregateResults(results, expected), /foreign run or attempt/);
});

const resultMutations = [
  ['missing group', (results) => results.pop()],
  ['additional group', (results) => results.push(clone(results[0]))],
  ['duplicate replaces missing group', (results) => { results[1] = clone(results[0]); }],
  ['unknown group', (results) => { results[0].group = 'unknown'; }],
  ['wrong Node version', (results) => { results[0].nodeVersion = '24.19.0'; }],
  ['one Node version cannot replace the other', (results) => { results[2].nodeVersion = results[0].nodeVersion; }],
  ['wrong source bytes', (results) => { results[0].sources.files[0].sha256 = digest('different'); }],
  ['HEAD alone cannot replace checkout bytes', (results) => { delete results[0].sources.files; }],
  ['wrong workflow configuration', (results) => { results[0].sources.workflow = 'other.yml'; }],
  ['wrong plan', (results) => { results[0].planSha256 = digest('other plan'); }],
  ['wrong run', (results) => { results[0].context.runId = 'other-run'; }],
  ['wrong attempt', (results) => { results[0].context.attempt = '2'; }],
  ['partial rerun mixture', (results) => { results[2].context.attempt = '2'; results[3].context.attempt = '2'; }],
  ['missing case', (results) => results[0].cases.pop()],
  ['duplicate case', (results) => { results[0].cases[1] = clone(results[0].cases[0]); }],
  ['foreign case', (results) => { results[0].cases[0].id = 'foreign/case'; }],
  ['wrong-group case', (results) => { results[0].cases[0] = clone(results[1].cases[0]); }],
  ['missing variant', (results) => results[0].cases[0].variants.pop()],
  ['duplicate variant', (results) => { results[0].cases[0].variants[1] = results[0].cases[0].variants[0]; }],
  ['foreign variant', (results) => { results[0].cases[0].variants[0] = 'foreign'; }],
  ['failed case', (results) => { results[0].cases[0].status = 'fail'; }],
  ['missing completion', (results) => { delete results[0].completion; }],
  ['registered count mismatch', (results) => { results[0].completion.registered += 1; }],
  ['passed count mismatch', (results) => { results[0].completion.passed -= 1; }],
  ['failed completion', (results) => { results[0].completion.failed = 1; }],
  ['cancelled completion', (results) => { results[0].completion.cancelled = 1; }],
  ['skipped completion', (results) => { results[0].completion.skipped = 1; }],
  ['todo completion', (results) => { results[0].completion.todo = 1; }],
  ['missing footer', (results) => { delete results[0].footer; }],
  ['footer count contradiction', (results) => { results[0].footer.tests += 1; }],
  ['footer pass contradiction', (results) => { results[0].footer.passed -= 1; }],
  ['footer failure', (results) => { results[0].footer.failed = 1; }],
  ['footer cancellation', (results) => { results[0].footer.cancelled = 1; }],
  ['footer skip', (results) => { results[0].footer.skipped = 1; }],
  ['footer todo', (results) => { results[0].footer.todo = 1; }],
  ['missing native process completion', (results) => { delete results[0].native; }],
  ['native failure', (results) => { results[0].native.exitCode = 1; }],
  ['native signal', (results) => { results[0].native.signal = 'SIGTERM'; }],
  ['native timeout', (results) => { results[0].native.timedOut = true; }],
  ['missing cleanup proof', (results) => { delete results[0].completion.cleanup; }],
  ['unconfirmed cleanup', (results) => { results[0].completion.cleanup.confirmed = false; }],
  ['pending cleanup', (results) => { results[0].completion.cleanup.pending = 1; }],
  ['unremoved copy', (results) => { results[0].completion.cleanup.removed = 2; }],
  ['negative copy count', (results) => { results[0].completion.cleanup.created = -1; }],
  ['unknown root field', (results) => { results[0].runtimeRecord = null; }],
  ['unknown nested field', (results) => { results[0].cases[0].extra = true; }],
  ['unsupported schema', (results) => { results[0].schemaVersion = 2; }],
  ['noncanonical timestamp', (results) => { results[0].startedAt = '2026-09-28'; }],
  ['invalid calendar date', (results) => { results[0].startedAt = '2026-02-30T10:00:00.000Z'; }],
  ['reversed timestamp', (results) => { results[0].endedAt = '2026-09-27T10:00:00.000Z'; }],
  ['negative duration', (results) => { results[0].durationMs = -1; }],
  ['non-finite duration', (results) => { results[0].durationMs = Infinity; }],
  ['memory unit confusion', (results) => { results[0].memory.unit = 'bytes'; }],
  ['runner scope cannot masquerade as process RSS', (results) => { results[0].memory.scope = 'runner'; }],
  ['bad log digest', (results) => { results[0].logs.stdout.sha256 = 'invalid'; }],
  ['oversized log binding', (results) => { results[0].logs.stdout.bytes = 64 * 1024 * 1024 + 1; }],
  ['sparse result array', (results) => { delete results[0]; }],
  ['non-JSON result', (results) => { results[0] = null; }],
  ['cyclic result', (results) => { results[0].sources.self = results[0]; }],
  ['unexpected object prototype', (results) => { Object.setPrototypeOf(results[0], null); }],
];

for (const [name, mutate] of resultMutations) {
  test(`CI grouping rejects ${name}`, () => {
    const { results, expected } = fixture();
    mutate(results);
    assert.throws(() => aggregateResults(results, expected), /Invalid adapter test result/);
  });
}

test('CI grouping rejects accessor artefacts without invoking the accessor', () => {
  const { results, expected } = fixture();
  let reads = 0;
  Object.defineProperty(results[0], 'cases', { enumerable: true, get() { reads += 1; throw new Error('not JSON'); } });
  assert.throws(() => aggregateResults(results, expected), /non-data property/);
  assert.equal(reads, 0);
});

test('CI grouping rejects an expected plan that splits a causal family', () => {
  const { results, expected } = fixture();
  expected.plan.cases[1].group = 'timing';
  assert.throws(() => aggregateResults(results, expected), /split causal family/);
});

test('CI grouping rejects duplicate expected case and variant identities', () => {
  const { results, expected } = fixture();
  expected.plan.cases[1].id = expected.plan.cases[0].id;
  assert.throws(() => aggregateResults(results, expected), /expected case assignment/);
  const fresh = fixture();
  fresh.expected.plan.cases[0].variants.push('base');
  assert.throws(() => aggregateResults(fresh.results, fresh.expected), /expected variants duplicate/);
});

test('CI grouping rejects an empty expected group and duplicate Node matrix', () => {
  const { results, expected } = fixture();
  expected.plan.groups.push('unused');
  assert.throws(() => aggregateResults(results, expected), /empty expected group/);
  const fresh = fixture();
  fresh.expected.nodeVersions.push(fresh.expected.nodeVersions[0]);
  assert.throws(() => aggregateResults(fresh.results, fresh.expected), /expected Node versions duplicate/);
});

async function withResultDirectory(callback) {
  const root = await mkdtemp(join(await realpath(tmpdir()), 'goldendawn-ci-result-test-'));
  const identity = await lstat(root, { bigint: true });
  try {
    await callback(root);
  } finally {
    const current = await lstat(root, { bigint: true });
    assert.equal(current.dev, identity.dev);
    assert.equal(current.ino, identity.ino);
    assert.equal(current.isDirectory(), true);
    assert.equal(current.isSymbolicLink(), false);
    await rm(root, { recursive: true, force: false });
    await assert.rejects(lstat(root), { code: 'ENOENT' });
  }
}

test('CI grouping reads a complete bounded regular JSON file', async () => {
  await withResultDirectory(async (root) => {
    const { results, expected } = fixture();
    const path = join(root, 'result.json');
    await writeFile(path, JSON.stringify(results[0]), { flag: 'wx' });
    assert.deepEqual(await readResultFile(path), results[0]);
    assert.equal(validateGroupResult(await readResultFile(path), expected).caseCount, 2);
  });
});

const fileMutations = [
  ['empty JSON file', Buffer.alloc(0)],
  ['oversized JSON file', Buffer.alloc(MAX_RESULT_BYTES + 1, 32)],
  ['invalid UTF-8', Buffer.from([0xc3, 0x28])],
  ['BOM-prefixed JSON', Buffer.from('\ufeff{}')],
  ['truncated JSON', Buffer.from('{"schemaVersion":')],
  ['duplicate JSON members', Buffer.from('{"schemaVersion":1,"schemaVersion":1}')],
  ['escaped duplicate JSON members', Buffer.from('{"schemaVersion":1,"schema\\u0056ersion":1}')],
  ['deeply nested JSON', Buffer.from('['.repeat(34) + '0' + ']'.repeat(34))],
];

for (const [name, bytes] of fileMutations) {
  test(`CI grouping rejects ${name}`, async () => {
    await withResultDirectory(async (root) => {
      const path = join(root, 'result.json');
      await writeFile(path, bytes, { flag: 'wx' });
      await assert.rejects(readResultFile(path));
    });
  });
}

test('CI grouping rejects relative paths, directories and hardlinked files', async () => {
  await assert.rejects(readResultFile('result.json'), /absolute result path/);
  await withResultDirectory(async (root) => {
    await assert.rejects(readResultFile(root), /result file type or size/);
    const source = join(root, 'source.json');
    const alias = join(root, 'alias.json');
    await writeFile(source, '{}', { flag: 'wx' });
    await link(source, alias);
    await assert.rejects(readResultFile(alias), /result file type or size/);
  });
});

test('CI grouping rejects a linked parent directory', async () => {
  await withResultDirectory(async (root) => {
    const directory = join(root, 'actual');
    const alias = join(root, 'alias');
    await mkdir(directory);
    await writeFile(join(directory, 'result.json'), '{}', { flag: 'wx' });
    await symlink(directory, alias, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(readResultFile(join(alias, 'result.json')), /noncanonical result parent/);
    await rm(alias, { recursive: false });
  });
});

test('CI grouping metadata preserves all baseline registrations and indivisible families', async () => {
  const plan = await discoverAdapterPlan();
  assert.equal(verifyAdapterPlan(plan), plan);
  assert.equal(digest(JSON.stringify(plan)), ADAPTER_PLAN_BASELINE.sha256);
  assert.equal(plan.schemaVersion, 1);
  assert.deepEqual(plan.groups, [...ADAPTER_GROUPS]);
  assert.equal(plan.cases.length, ADAPTER_BASELINE.cases);
  assert.equal(plan.cases.length, 1010);
  assert.equal(new Set(plan.cases.map((entry) => entry.name)).size, 1000);
  assert.equal(new Set(plan.cases.map((entry) => entry.id)).size, 1010);
  assert.equal(plan.baseline.reconstructedSha256, ADAPTER_BASELINE.sha256);
  const byFamily = new Map();
  for (const entry of plan.cases) {
    assert.ok(ADAPTER_GROUPS.includes(entry.group));
    assert.equal(entry.group, plan.familyGroups[entry.family]);
    assert.equal(byFamily.has(entry.family) ? byFamily.get(entry.family) : entry.group, entry.group);
    byFamily.set(entry.family, entry.group);
    assert.match(entry.site, /^L[1-9][0-9]*$/);
    assert.ok(entry.id.startsWith(`${entry.family}/${entry.site}/`));
    assert.match(entry.bodySha256, /^[a-f0-9]{64}$/);
    assert.ok(entry.variants.includes(`body:${entry.bodySha256}`));
    assert.equal(new Set(entry.variants).size, entry.variants.length);
  }
  for (const group of ADAPTER_GROUPS) assert.ok(plan.cases.some((entry) => entry.group === group));
  assert.deepEqual(Object.fromEntries(ADAPTER_GROUPS.map((group) =>
    [group, plan.cases.filter((entry) => entry.group === group).length])), ADAPTER_PLAN_BASELINE.groupCases);
  const obligations = plan.cases.reduce((count, entry) => count + entry.variants.length, 0);
  assert.equal(obligations - plan.cases.length, ADAPTER_PLAN_BASELINE.additionalVariants);
  assert.equal(obligations, ADAPTER_PLAN_BASELINE.obligations);
  assert.equal(plan.cases.filter((entry) => entry.site === 'L2988').length, 8);
  assert.equal(plan.cases.filter((entry) => entry.site === 'L2079').length, 7);
  const replayCases = plan.cases.filter((entry) => entry.site === 'L5204');
  assert.ok(replayCases.length > 0);
  for (const entry of replayCases) {
    assert.equal(entry.variants.filter((variant) => variant.startsWith('replay-control:')).length, 59);
    assert.equal(entry.variants.filter((variant) => variant.startsWith('replay-mutant:')).length, 59);
  }
});

test('CI grouping rejects a family marker change hidden by baseline reconstruction', async () => {
  const source = await readFile(new URL('./browserSyncTransportRuntimeDiagnosticAdapter.test.js', import.meta.url), 'utf8');
  const marker = "g36CaseTest('L728', 'registerAdapterHarnessBaselineTests',";
  assert.equal(source.split(marker).length - 1, 1);
  const changedSource = source.replace(marker, "g36CaseTest('L728', 'registerAdr36ClockContractTests',");
  assert.equal(reconstructAdapterBaseline(changedSource), reconstructAdapterBaseline(source));
  assert.deepEqual(verifyAdapterBaseline(changedSource), verifyAdapterBaseline(source));

  const plan = clone(await discoverAdapterPlan());
  const changed = plan.cases.filter((entry) => entry.site === 'L728'
    && entry.family === 'registerAdapterHarnessBaselineTests');
  assert.equal(changed.length, 4);
  for (const entry of changed) {
    entry.family = 'registerAdr36ClockContractTests';
    entry.group = 'timing';
    entry.id = `${entry.family}/${entry.site}/${digest(entry.variantKey)}`;
  }
  assert.equal(plan.cases.length, ADAPTER_PLAN_BASELINE.cases);
  assert.throws(() => verifyAdapterPlan(plan), /adapter plan group case counts changed/);
});

test('CI grouping rejects a site marker change with unchanged counts and reconstructed baseline', async () => {
  const source = await readFile(new URL('./browserSyncTransportRuntimeDiagnosticAdapter.test.js', import.meta.url), 'utf8');
  const marker = "g36CaseTest('L728', 'registerAdapterHarnessBaselineTests',";
  assert.equal(source.split(marker).length - 1, 1);
  const changedSource = source.replace(marker, "g36CaseTest('L729', 'registerAdapterHarnessBaselineTests',");
  assert.equal(reconstructAdapterBaseline(changedSource), reconstructAdapterBaseline(source));
  assert.deepEqual(verifyAdapterBaseline(changedSource), verifyAdapterBaseline(source));

  const original = await discoverAdapterPlan();
  const plan = clone(original);
  const changed = plan.cases.filter((entry) => entry.site === 'L728'
    && entry.family === 'registerAdapterHarnessBaselineTests');
  assert.equal(changed.length, 4);
  for (const entry of changed) {
    entry.site = 'L729';
    entry.id = `${entry.family}/${entry.site}/${digest(entry.variantKey)}`;
  }
  const counts = (value) => ({
    cases: value.cases.length,
    groupCases: Object.fromEntries(ADAPTER_GROUPS.map((group) =>
      [group, value.cases.filter((entry) => entry.group === group).length])),
    additionalVariants: value.cases.reduce((count, entry) => count + entry.variants.length - 1, 0),
    obligations: value.cases.reduce((count, entry) => count + entry.variants.length, 0),
  });
  assert.deepEqual(counts(plan), counts(original));
  assert.deepEqual(counts(plan), {
    cases: 1010, groupCases: ADAPTER_PLAN_BASELINE.groupCases, additionalVariants: 1312, obligations: 2322,
  });
  assert.throws(() => verifyAdapterPlan(plan), /adapter plan identity changed/);
});

test('CI grouping selection defaults to all and accepts exactly its six groups', () => {
  assert.deepEqual(readAdapterSelection({}), { group: 'all', planOnly: false });
  assert.deepEqual(readAdapterSelection({ GD_ADAPTER_MODE: 'plan' }), { group: 'all', planOnly: true });
  for (const group of ADAPTER_GROUPS) {
    assert.deepEqual(readAdapterSelection({ GD_ADAPTER_GROUP: group }), { group, planOnly: false });
  }
});

const invalidSelections = [
  ['unknown group', { GD_ADAPTER_GROUP: 'unknown' }],
  ['empty group', { GD_ADAPTER_GROUP: '' }],
  ['multiple groups', { GD_ADAPTER_GROUP: 'source,parser' }],
  ['explicit all group', { GD_ADAPTER_GROUP: 'all' }],
  ['invalid mode', { GD_ADAPTER_MODE: 'execute' }],
  ['empty mode', { GD_ADAPTER_MODE: '' }],
  ['plan and group', { GD_ADAPTER_MODE: 'plan', GD_ADAPTER_GROUP: 'source' }],
  ['plan and report', { GD_ADAPTER_MODE: 'plan', GD_ADAPTER_REPORT: 'unexpected.json' }],
];

for (const [name, selection] of invalidSelections) {
  test(`CI grouping selection fails before discovery for ${name}`, () => {
    const environment = { ...process.env };
    for (const key of Object.keys(environment)) if (key.startsWith('GD_ADAPTER_')) delete environment[key];
    delete environment.NODE_OPTIONS;
    Object.assign(environment, selection);
    const probe = spawnSync(process.execPath, ['--input-type=module', '-e',
      "import { readAdapterSelection } from './scripts/ci/adapterTestPlan.js'; readAdapterSelection();"], {
      env: environment, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024, windowsHide: true,
    });
    assert.equal(probe.error, undefined);
    assert.equal(probe.signal, null);
    assert.notEqual(probe.status, 0);
    assert.equal(probe.stdout, '');
    assert.match(probe.stderr, /AssertionError/);
  });
}

const tapFooter = '# tests 3\n# suites 0\n# pass 3\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 1.25\n';
const groupTap = `TAP version 13\n1..3\n${tapFooter}`;

test('CI grouping accepts one complete native TAP footer', () => {
  assert.deepEqual(parseFooter(groupTap), {
    tests: 3, passed: 3, failed: 0, cancelled: 0, skipped: 0, todo: 0,
  });
  assert.equal(parseFooter(groupTap.replaceAll('\n', '\r\n')).passed, 3);
});

test('CI grouping accepts a nested reference TAP log with an npm banner and smaller root plan', () => {
  const reference = `\n> goldendawn@0.2.2 test\n> node --test\n\nTAP version 13\n# Subtest: nested\n    1..2\n`;
  assert.deepEqual(parseFooter(`${reference}1..2\n${tapFooter}`, { reference: true }), {
    tests: 3, passed: 3, failed: 0, cancelled: 0, skipped: 0, todo: 0,
  });
});

const badFooters = [
  ['missing footer', ''],
  ['missing header', groupTap.replace('TAP version 13\n', '')],
  ['duplicate header', groupTap.replace('TAP version 13\n', 'TAP version 13\nTAP version 13\n')],
  ['wrong header', groupTap.replace('TAP version 13', 'TAP version 12')],
  ['missing root plan', groupTap.replace('1..3\n', '')],
  ['duplicate root plan', groupTap.replace('1..3\n', '1..3\n1..3\n')],
  ['wrong root plan', groupTap.replace('1..3\n', '1..2\n')],
  ['missing suites', groupTap.replace('# suites 0\n', '')],
  ['missing duration', groupTap.replace('# duration_ms 1.25\n', '')],
  ['duplicate footer', groupTap.replace('# todo 0\n', '# todo 0\n# todo 0\n')],
  ['wrong footer order', groupTap.replace('# tests 3\n# suites 0\n', '# suites 0\n# tests 3\n')],
  ['trailing content', `${groupTap}unexpected\n`],
  ['trailing blank line', `${groupTap}\n`],
  ['count mismatch', groupTap.replace('# tests 3', '# tests 4')],
  ['failure', groupTap.replace('# fail 0', '# fail 1')],
  ['cancellation', groupTap.replace('# cancelled 0', '# cancelled 1')],
  ['skip', groupTap.replace('# skipped 0', '# skipped 1')],
  ['todo', groupTap.replace('# todo 0', '# todo 1')],
  ['unsafe count', groupTap.replace('# tests 3', '# tests 9007199254740992')],
  ['negative duration', groupTap.replace('# duration_ms 1.25', '# duration_ms -1')],
  ['non-numeric duration', groupTap.replace('# duration_ms 1.25', '# duration_ms NaN')],
  ['infinite duration', groupTap.replace('# duration_ms 1.25', '# duration_ms Infinity')],
];

for (const [name, footer] of badFooters) {
  test(`CI grouping rejects native TAP ${name}`, () => assert.throws(() => parseFooter(footer)));
}

test('CI grouping aggregate CLI rejects a rehashed group log without its root plan', async () => {
  await withResultDirectory(async (root) => {
    const context = { kind: 'local', runId: `adr0038-${randomUUID()}`, attempt: '1' };
    const contextFile = join(root, 'context.json');
    await writeFile(contextFile, `${JSON.stringify(context)}\n`, { flag: 'wx' });
    const positive = join(root, 'positive');
    const negative = join(root, 'negative');
    await mkdir(positive);
    const plan = await discoverAdapterPlan();
    const sources = bindSources();
    const planSha256 = digest(JSON.stringify(plan));
    const nodeVersion = process.versions.node;
    const startedAt = '2026-10-03T00:00:00.000Z';
    const endedAt = '2026-10-03T00:00:00.001Z';
    const durationMs = 1;
    const nativeCompletion = { exitCode: 0, signal: null, timedOut: false };
    const memory = { method: 'node-resource-usage', unit: 'KiB', scope: 'test-process', maxRss: 0,
      limitations: 'excludes-runner-and-descendants' };
    const args = ['--test', '--experimental-vm-modules', '--no-warnings', '--test-concurrency=1',
      '--test-reporter=tap', 'tests/browserSyncTransportRuntimeDiagnosticAdapter.test.js'];
    const writeJson = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

    for (const group of ADAPTER_GROUPS) {
      const directory = join(positive, group);
      await mkdir(directory);
      const cases = plan.cases.filter((entry) => entry.group === group)
        .map((entry) => ({ id: entry.id, variants: [...entry.variants], status: 'pass' }));
      const count = cases.length;
      const stdout = `TAP version 13\n1..${count}\n# tests ${count}\n# suites 0\n# pass ${count}\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n# duration_ms 1\n`;
      const logs = {
        stdout: { bytes: Buffer.byteLength(stdout), sha256: digest(stdout) },
        stderr: { bytes: 0, sha256: digest('') },
      };
      const completion = { registered: count, passed: count, failed: 0, cancelled: 0, skipped: 0, todo: 0,
        cleanup: { created: 0, removed: 0, pending: 0, confirmed: true } };
      const child = { schemaVersion: 1, group, nodeVersion, cases, completion, memory };
      const result = { schemaVersion: 1, context, sources, planSha256, nodeVersion, group, cases, completion,
        footer: { tests: count, passed: count, failed: 0, cancelled: 0, skipped: 0, todo: 0 },
        native: nativeCompletion, startedAt, endedAt, durationMs, memory, logs };
      const native = { executable: process.execPath, args, nodeVersion,
        environment: { platform: process.platform, arch: process.arch, osRelease: release() },
        startedAt, endedAt, durationMs, native: nativeCompletion, spawnError: null, overflow: false, logs };
      await Promise.all([
        writeJson(join(directory, 'binding.json'), { context, sources, plan, planSha256, nodeVersion }),
        writeJson(join(directory, 'child.json'), child),
        writeJson(join(directory, 'native.json'), native),
        writeJson(join(directory, 'result.json'), result),
        writeFile(join(directory, 'stdout.log'), stdout, { flag: 'wx' }),
        writeFile(join(directory, 'stderr.log'), '', { flag: 'wx' }),
      ]);
    }

    const runner = fileURLToPath(new URL('../scripts/ci/runAdapterGroups.js', import.meta.url));
    const checkout = fileURLToPath(new URL('../', import.meta.url));
    const invoke = (directory) => spawnSync(process.execPath, [runner, 'aggregate', directory, contextFile], {
      cwd: checkout, encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
    });
    const accepted = invoke(positive);
    assert.equal(accepted.error, undefined);
    assert.equal(accepted.signal, null);
    assert.equal(accepted.status, 0, accepted.stderr);
    assert.equal(JSON.parse(accepted.stdout).status, 'pass');

    await cp(positive, negative, { recursive: true, errorOnExist: true });
    const changedDirectory = join(negative, 'boundary');
    const stdoutFile = join(changedDirectory, 'stdout.log');
    const original = await readFile(stdoutFile, 'utf8');
    const changed = original.replace(/^1\.\.[0-9]+\r?\n/m, '');
    assert.notEqual(changed, original);
    await writeFile(stdoutFile, changed);
    const logBinding = { bytes: Buffer.byteLength(changed), sha256: digest(changed) };
    for (const name of ['result.json', 'native.json']) {
      const file = join(changedDirectory, name);
      const value = JSON.parse(await readFile(file, 'utf8'));
      value.logs.stdout = logBinding;
      await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
    }
    const rejected = invoke(negative);
    assert.equal(rejected.error, undefined);
    assert.equal(rejected.signal, null);
    assert.notEqual(rejected.status, 0);
    assert.equal(rejected.stdout, '');
    assert.match(rejected.stderr, /missing or repeated native root plan/);
  });
});
