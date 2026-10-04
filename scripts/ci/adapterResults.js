import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

// These are test artefacts, never BrowserTransportDiagnosticRecords. Sources
// and the complete plan come from the current trusted checkout, not artefacts.
export const MAX_RESULT_BYTES = 8 * 1024 * 1024;
const MAX_LOG_BYTES = 64 * 1024 * 1024;
const MAX_CASES = 4096;
const MAX_VARIANTS = 4096;
const SHA256 = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/@+\-=]*$/;
const VARIANT_ID = /^[^\u0000-\u001f\u007f]+$/u;
const NODE_VERSION = /^\d+\.\d+\.\d+$/;

function requireCondition(condition, reason) {
  if (!condition) throw new Error(`Invalid adapter test result: ${reason}.`);
}

// Public validators also reject non-JSON values without invoking getters or
// toJSON. The file reader decodes JSON only; no imported or evaluated content.
function assertJsonTree(root) {
  const active = new Set();
  let nodes = 0;
  function visit(value, depth) {
    requireCondition(++nodes <= 100000 && depth <= 32, 'JSON limit');
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'string') {
      requireCondition(value.length <= MAX_RESULT_BYTES, 'string limit');
      return;
    }
    if (typeof value === 'number') {
      requireCondition(Number.isFinite(value), 'non-finite number');
      return;
    }
    requireCondition(typeof value === 'object', 'non-JSON value');
    requireCondition(!active.has(value), 'cyclic value');
    const array = Array.isArray(value);
    requireCondition(Object.getPrototypeOf(value) === (array ? Array.prototype : Object.prototype), 'JSON prototype');
    const keys = Reflect.ownKeys(value);
    if (array) {
      const length = Object.getOwnPropertyDescriptor(value, 'length').value;
      requireCondition(length <= 100000 && keys.length === length + 1, 'array shape');
      for (let index = 0; index < length; index += 1) {
        requireCondition(Object.hasOwn(value, String(index)), 'sparse array');
      }
    }
    active.add(value);
    for (const key of keys) {
      if (array && key === 'length') continue;
      requireCondition(typeof key === 'string', 'symbol key');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      requireCondition(descriptor.enumerable && Object.hasOwn(descriptor, 'value'), 'non-data property');
      visit(descriptor.value, depth + 1);
    }
    active.delete(value);
  }
  visit(root, 0);
}

function exactKeys(value, expected, label) {
  requireCondition(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} record`);
  const keys = Object.keys(value);
  requireCondition(keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key)), `${label} keys`);
}

function natural(value, label, maximum = Number.MAX_SAFE_INTEGER) {
  requireCondition(Number.isSafeInteger(value) && value >= 0 && value <= maximum, label);
}

function identifier(value, label) {
  requireCondition(typeof value === 'string' && value.length <= 1024 && IDENTIFIER.test(value), label);
}

function uniqueStrings(values, label, maximum, pattern = IDENTIFIER) {
  requireCondition(Array.isArray(values) && values.length > 0 && values.length <= maximum, `${label} array`);
  const seen = new Set();
  for (const value of values) {
    requireCondition(typeof value === 'string' && value.length <= 2048 && pattern.test(value), label);
    requireCondition(!seen.has(value), `${label} duplicate`);
    seen.add(value);
  }
  return seen;
}

function validateContext(context) {
  exactKeys(context, ['kind', 'runId', 'attempt'], 'context');
  requireCondition(context.kind === 'local' || context.kind === 'ci', 'context kind');
  identifier(context.runId, 'run ID');
  identifier(context.attempt, 'attempt');
}

function prepareExpected(expected) {
  assertJsonTree(expected);
  exactKeys(expected, ['context', 'sources', 'plan', 'planSha256', 'nodeVersions'], 'expectation');
  validateContext(expected.context);
  requireCondition(typeof expected.planSha256 === 'string' && SHA256.test(expected.planSha256), 'expected plan digest');
  requireCondition(expected.sources !== null && typeof expected.sources === 'object' && !Array.isArray(expected.sources)
    && Object.keys(expected.sources).length > 0, 'expected source binding');
  const nodes = uniqueStrings(expected.nodeVersions, 'expected Node versions', 8, NODE_VERSION);
  const plan = expected.plan;
  requireCondition(plan !== null && typeof plan === 'object' && !Array.isArray(plan) && plan.schemaVersion === 1, 'expected plan');
  const groups = uniqueStrings(plan.groups, 'expected groups', 32);
  requireCondition(Array.isArray(plan.cases) && plan.cases.length > 0 && plan.cases.length <= MAX_CASES, 'expected cases');
  const cases = new Map();
  const families = new Map();
  const groupCases = new Map([...groups].map((group) => [group, new Map()]));
  for (const entry of plan.cases) {
    requireCondition(entry !== null && typeof entry === 'object' && !Array.isArray(entry), 'expected case record');
    identifier(entry.id, 'expected case ID');
    identifier(entry.family, 'expected family ID');
    requireCondition(groups.has(entry.group) && !cases.has(entry.id), 'expected case assignment');
    const variants = uniqueStrings(entry.variants, 'expected variants', MAX_VARIANTS, VARIANT_ID);
    requireCondition(!families.has(entry.family) || families.get(entry.family) === entry.group, 'split causal family');
    families.set(entry.family, entry.group);
    cases.set(entry.id, variants);
    groupCases.get(entry.group).set(entry.id, variants);
  }
  requireCondition([...groupCases.values()].every((group) => group.size > 0), 'empty expected group');
  return { nodes, groups, groupCases };
}

function validatePreparedResult(result, expected, prepared) {
  assertJsonTree(result);
  exactKeys(result, ['schemaVersion', 'context', 'sources', 'planSha256', 'nodeVersion', 'group', 'cases',
    'completion', 'footer', 'native', 'startedAt', 'endedAt', 'durationMs', 'memory', 'logs'], 'result');
  requireCondition(result.schemaVersion === 1, 'schema version');
  validateContext(result.context);
  requireCondition(isDeepStrictEqual(result.context, expected.context), 'foreign run or attempt');
  requireCondition(isDeepStrictEqual(result.sources, expected.sources), 'foreign source binding');
  requireCondition(result.planSha256 === expected.planSha256, 'foreign plan');
  requireCondition(prepared.nodes.has(result.nodeVersion), 'foreign Node version');
  requireCondition(prepared.groups.has(result.group), 'unknown group');
  const expectedCases = prepared.groupCases.get(result.group);
  requireCondition(Array.isArray(result.cases) && result.cases.length === expectedCases.size, 'case cardinality');
  const seen = new Set();
  let variantCount = 0;
  for (const entry of result.cases) {
    exactKeys(entry, ['id', 'variants', 'status'], 'case');
    requireCondition(expectedCases.has(entry.id) && !seen.has(entry.id), 'unknown or duplicate case');
    seen.add(entry.id);
    requireCondition(entry.status === 'pass', 'case did not pass');
    const variants = uniqueStrings(entry.variants, 'case variants', MAX_VARIANTS, VARIANT_ID);
    const expectedVariants = expectedCases.get(entry.id);
    requireCondition(variants.size === expectedVariants.size
      && [...variants].every((variant) => expectedVariants.has(variant)), 'foreign or missing variant');
    variantCount += variants.size;
  }
  const completion = result.completion;
  exactKeys(completion, ['registered', 'passed', 'failed', 'cancelled', 'skipped', 'todo', 'cleanup'], 'completion');
  exactKeys(result.footer, ['tests', 'passed', 'failed', 'cancelled', 'skipped', 'todo'], 'footer');
  requireCondition(completion.registered === expectedCases.size && completion.passed === expectedCases.size
    && result.footer.tests === expectedCases.size && result.footer.passed === expectedCases.size, 'incomplete completion');
  for (const key of ['failed', 'cancelled', 'skipped', 'todo']) {
    requireCondition(completion[key] === 0 && result.footer[key] === 0, `nonzero ${key}`);
  }
  const cleanup = completion.cleanup;
  exactKeys(cleanup, ['created', 'removed', 'pending', 'confirmed'], 'cleanup');
  natural(cleanup.created, 'created count');
  natural(cleanup.removed, 'removed count');
  requireCondition(cleanup.created === cleanup.removed && cleanup.pending === 0 && cleanup.confirmed === true, 'unconfirmed cleanup');
  exactKeys(result.native, ['exitCode', 'signal', 'timedOut'], 'native completion');
  requireCondition(result.native.exitCode === 0 && result.native.signal === null && result.native.timedOut === false, 'native process failed');
  for (const key of ['startedAt', 'endedAt']) {
    requireCondition(typeof result[key] === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(result[key])
      && Number.isFinite(Date.parse(result[key])) && new Date(result[key]).toISOString() === result[key], `${key} UTC time`);
  }
  requireCondition(Date.parse(result.endedAt) >= Date.parse(result.startedAt), 'reversed time');
  requireCondition(typeof result.durationMs === 'number' && Number.isFinite(result.durationMs)
    && result.durationMs >= 0 && result.durationMs <= 24 * 60 * 60 * 1000, 'duration');
  exactKeys(result.memory, ['method', 'unit', 'scope', 'maxRss', 'limitations'], 'memory');
  requireCondition(result.memory.method === 'node-resource-usage' && result.memory.unit === 'KiB'
    && result.memory.scope === 'test-process' && result.memory.limitations === 'excludes-runner-and-descendants', 'memory scope');
  natural(result.memory.maxRss, 'peak RSS');
  exactKeys(result.logs, ['stdout', 'stderr'], 'logs');
  for (const stream of ['stdout', 'stderr']) {
    exactKeys(result.logs[stream], ['bytes', 'sha256'], `${stream} log`);
    natural(result.logs[stream].bytes, `${stream} byte length`, MAX_LOG_BYTES);
    requireCondition(typeof result.logs[stream].sha256 === 'string' && SHA256.test(result.logs[stream].sha256), `${stream} digest`);
  }
  return { group: result.group, nodeVersion: result.nodeVersion, caseCount: seen.size, variantCount };
}

export function validateGroupResult(result, expected) {
  return validatePreparedResult(result, expected, prepareExpected(expected));
}

export function aggregateResults(results, expected) {
  const prepared = prepareExpected(expected);
  assertJsonTree(results);
  requireCondition(Array.isArray(results) && results.length === prepared.nodes.size * prepared.groups.size, 'group cardinality');
  const byNode = new Map([...prepared.nodes].map((nodeVersion) => [nodeVersion, new Map()]));
  for (const result of results) {
    const validated = validatePreparedResult(result, expected, prepared);
    const groups = byNode.get(validated.nodeVersion);
    requireCondition(!groups.has(validated.group), 'duplicate group');
    groups.set(validated.group, validated);
  }
  const nodeVersions = [...byNode].map(([nodeVersion, groups]) => {
    requireCondition(groups.size === prepared.groups.size, 'missing Node group');
    return {
      nodeVersion,
      groups: [...prepared.groups],
      cases: [...groups.values()].reduce((sum, group) => sum + group.caseCount, 0),
      variants: [...groups.values()].reduce((sum, group) => sum + group.variantCount, 0),
    };
  });
  return {
    status: 'pass', nodeVersions, groups: results.length,
    cases: nodeVersions.reduce((sum, node) => sum + node.cases, 0),
    variants: nodeVersions.reduce((sum, node) => sum + node.variants, 0),
  };
}

function samePath(left, right) {
  return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right;
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size
    && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}

// JSON.parse has last-key-wins semantics. Reject duplicate names (including
// escaped aliases) and excessive nesting before it loses that information.
function rejectDuplicateKeys(text) {
  const stack = [];
  for (let cursor = 0; cursor < text.length; cursor += 1) {
    const character = text[cursor];
    if (character === '"') {
      const start = cursor;
      for (cursor += 1; cursor < text.length; cursor += 1) {
        if (text[cursor] === '\\') cursor += 1;
        else if (text[cursor] === '"') break;
      }
      let after = cursor + 1;
      while (/\s/.test(text[after] ?? '') && after < text.length) after += 1;
      if (text[after] === ':' && stack.at(-1) instanceof Set) {
        const key = JSON.parse(text.slice(start, cursor + 1));
        requireCondition(!stack.at(-1).has(key), 'duplicate JSON member');
        stack.at(-1).add(key);
      }
    } else if (character === '{' || character === '[') {
      stack.push(character === '{' ? new Set() : null);
      requireCondition(stack.length <= 32, 'JSON nesting limit');
    } else if (character === '}' || character === ']') stack.pop();
  }
}

export async function readResultFile(filePath) {
  requireCondition(typeof filePath === 'string' && isAbsolute(filePath), 'absolute result path');
  const target = resolve(filePath);
  const parent = dirname(target);
  requireCondition(samePath(await realpath(parent), parent), 'noncanonical result parent');
  const before = await lstat(target, { bigint: true });
  requireCondition(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n
    && before.size > 0n && before.size <= BigInt(MAX_RESULT_BYTES), 'result file type or size');
  const handle = await open(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    requireCondition(sameFile(before, await handle.stat({ bigint: true })), 'changed result identity');
    const bytes = Buffer.alloc(Number(before.size) + 1);
    let length = 0;
    while (length < bytes.length) {
      const read = await handle.read(bytes, length, bytes.length - length, length);
      if (read.bytesRead === 0) break;
      length += read.bytesRead;
    }
    requireCondition(length === Number(before.size), 'changed result length');
    const after = await lstat(target, { bigint: true });
    requireCondition(after.isFile() && !after.isSymbolicLink() && sameFile(before, after)
      && sameFile(before, await handle.stat({ bigint: true }))
      && samePath(await realpath(parent), parent), 'changed result file');
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes.subarray(0, length));
    rejectDuplicateKeys(text);
    const parsed = JSON.parse(text);
    assertJsonTree(parsed);
    return parsed;
  } finally {
    await handle.close();
  }
}
