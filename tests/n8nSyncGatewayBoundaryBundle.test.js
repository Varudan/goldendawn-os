import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import {
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

import {
  SYNC_CONTRACT_MAX_RAW_BODY_BYTES,
} from '../src/contracts/syncContract.js'
import {
  createSyncGatewayRequestBoundary as createCanonicalBoundary,
} from '../src/gateways/syncGatewayRequestBoundary.js'
import {
  SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
  SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
  SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS,
  checkSyncGatewayBoundaryBundle,
  createSyncGatewayBoundaryExpressionArtifact,
  generateSyncGatewayBoundaryBundle,
  runSyncGatewayBoundaryBundleGeneratorCli,
  writeSyncGatewayBoundaryBundle,
} from '../scripts/n8n/generateSyncGatewayBoundaryBundle.js'

const REPOSITORY_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..'
)
const ARTIFACT_FILE = resolve(
  REPOSITORY_ROOT,
  SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH
)
const MANIFEST_FILE = resolve(
  REPOSITORY_ROOT,
  SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH
)
const GENERATOR_FILE = resolve(
  REPOSITORY_ROOT,
  'scripts/n8n/generateSyncGatewayBoundaryBundle.js'
)

const REFERENCE_TIMESTAMP = '2031-04-05T10:20:30.000Z'
const REQUEST_TIMESTAMP = '2031-04-05T10:20:30.125Z'
const REQUEST_ID = 'req_48be0e81-2ace-46df-b713-3d580f313b71'
const GATEWAY_REQUEST_ID =
  'gateway_9ac43e87-13de-4cdd-9cf1-7745b7d783b2'
const SECOND_GATEWAY_REQUEST_ID =
  'gateway_7fa71011-8d52-40bc-ac72-512536ab062a'

const ARTIFACT_API_PROPERTY_NAMES = Object.freeze([
  'createSyncGatewayRequestBoundary',
])
const BOUNDARY_API_PROPERTY_NAMES = Object.freeze(['processSyncRawBody'])
const RESULT_PROPERTY_NAMES = Object.freeze([
  'ok',
  'status',
  'syncRequest',
  'gatewayErrorResponse',
  'error',
])
const REQUEST_PROPERTY_NAMES = Object.freeze([
  'version',
  'action',
  'source',
  'requestId',
  'timestamp',
  'payload',
])
const RESPONSE_PROPERTY_NAMES = Object.freeze([
  'version',
  'success',
  'requestId',
  'action',
  'handledBy',
  'timestamp',
  'data',
  'error',
  'warnings',
  'meta',
])
const RESPONSE_ERROR_PROPERTY_NAMES = Object.freeze([
  'code',
  'message',
  'retryable',
  'details',
])
const META_PROPERTY_NAMES = Object.freeze(['durationMs', 'processedBy'])
const LOCAL_ERROR_PROPERTY_NAMES = Object.freeze(['code', 'message'])

const HOST_REALM = Object.freeze({
  objectPrototype: Object.prototype,
  arrayPrototype: Array.prototype,
  functionPrototype: Function.prototype,
})

function createRequest(overrides = {}) {
  return {
    version: '1.0',
    action: 'syncTest',
    source: 'goldendawn-os',
    requestId: REQUEST_ID,
    timestamp: REQUEST_TIMESTAMP,
    payload: {},
    ...overrides,
  }
}

function createRawRequest(overrides = {}) {
  return JSON.stringify(createRequest(overrides))
}

function createSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function toPortablePath(value) {
  return value.split(sep).join('/')
}

async function createTemporaryProject() {
  const projectRoot = await mkdtemp(
    join(tmpdir(), 'goldendawn-n8n-boundary-bundle-')
  )

  for (const sourcePath of SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS) {
    const sourceFile = resolve(REPOSITORY_ROOT, sourcePath)
    const targetFile = resolve(projectRoot, sourcePath)
    await mkdir(dirname(targetFile), { recursive: true })
    await writeFile(targetFile, await readFile(sourceFile))
  }

  return projectRoot
}

async function removeTemporaryProject(projectRoot) {
  await rm(projectRoot, { recursive: true, force: true })
}

async function removeTestLinkIfPresent(linkPath) {
  try {
    await unlink(linkPath)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }
}

async function readGeneratedFiles(projectRoot) {
  return {
    artifactBytes: await readFile(resolve(
      projectRoot,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH
    )),
    manifestBytes: await readFile(resolve(
      projectRoot,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH
    )),
  }
}

async function snapshotProjectTree(projectRoot) {
  const snapshot = []

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    entries.sort((left, right) => (
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0
    ))

    for (const entry of entries) {
      const entryPath = join(directory, entry.name)
      const portableRelativePath = toPortablePath(
        relative(projectRoot, entryPath)
      )
      const entryStat = await stat(entryPath, { bigint: true })

      if (entry.isDirectory()) {
        snapshot.push({
          path: portableRelativePath + '/',
          type: 'directory',
          mtimeNs: String(entryStat.mtimeNs),
        })
        await visit(entryPath)
        continue
      }

      const bytes = await readFile(entryPath)
      snapshot.push({
        path: portableRelativePath,
        type: 'file',
        size: String(entryStat.size),
        mtimeNs: String(entryStat.mtimeNs),
        sha256: createSha256(bytes),
      })
    }
  }

  await visit(projectRoot)
  return snapshot
}

function restoreOwnProperty(target, propertyName, descriptor) {
  Object.defineProperty(target, propertyName, descriptor)
}

function createConsoleRecorder() {
  const calls = []
  const recorder = {}

  for (const methodName of [
    'debug',
    'error',
    'info',
    'log',
    'trace',
    'warn',
  ]) {
    recorder[methodName] = (...argumentsList) => {
      calls.push({ methodName, argumentsList })
    }
  }

  return { calls, recorder: Object.freeze(recorder) }
}

function evaluateBundle(artifactText, extraGlobals = {}) {
  const consoleRecorder = createConsoleRecorder()
  const sandbox = {
    console: consoleRecorder.recorder,
    ...extraGlobals,
  }
  const context = vm.createContext(sandbox, {
    name: 'goldendawn-n8n-boundary-bundle-test',
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  })
  const globalKeysBefore = Reflect.ownKeys(sandbox)
  const artifactApi = new vm.Script(artifactText, {
    filename: 'syncGatewayRequestBoundary.bundle.js',
  }).runInContext(context, { timeout: 1_000 })
  const globalKeysAfter = Reflect.ownKeys(sandbox)
  const realm = vm.runInContext(
    `({
      objectPrototype: Object.prototype,
      arrayPrototype: Array.prototype,
      functionPrototype: Function.prototype,
    })`,
    context,
    { timeout: 1_000 }
  )

  return {
    artifactApi,
    consoleCalls: consoleRecorder.calls,
    context,
    globalKeysAfter,
    globalKeysBefore,
    realm,
  }
}

function assertExactFrozenDataRecord(
  value,
  expectedPropertyNames,
  expectedPrototype
) {
  assert.equal(typeof value, 'object')
  assert.notEqual(value, null)
  assert.equal(Array.isArray(value), false)
  assert.equal(Object.getPrototypeOf(value), expectedPrototype)
  assert.deepEqual(Reflect.ownKeys(value), expectedPropertyNames)
  assert.equal(Object.isFrozen(value), true)

  for (const propertyName of expectedPropertyNames) {
    const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)
    assert.notEqual(descriptor, undefined)
    assert.equal(Object.hasOwn(descriptor, 'value'), true)
    assert.equal(descriptor.enumerable, true)
    assert.equal(descriptor.configurable, false)
    assert.equal(descriptor.writable, false)
  }
}

function assertExactFrozenDataArray(value, expectedPrototype) {
  assert.equal(Array.isArray(value), true)
  assert.equal(Object.getPrototypeOf(value), expectedPrototype)
  assert.equal(Object.isFrozen(value), true)

  const ownKeys = Reflect.ownKeys(value)
  const expectedOwnKeys = []

  for (let index = 0; index < value.length; index += 1) {
    expectedOwnKeys.push(String(index))
  }

  expectedOwnKeys.push('length')
  assert.deepEqual(ownKeys, expectedOwnKeys)

  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
    assert.equal(Object.hasOwn(descriptor, 'value'), true)
    assert.equal(descriptor.enumerable, true)
    assert.equal(descriptor.configurable, false)
    assert.equal(descriptor.writable, false)
  }

  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
  assert.equal(Object.hasOwn(lengthDescriptor, 'value'), true)
  assert.equal(lengthDescriptor.enumerable, false)
  assert.equal(lengthDescriptor.configurable, false)
  assert.equal(lengthDescriptor.writable, false)
}

function assertArtifactApi(artifactApi, realm) {
  assertExactFrozenDataRecord(
    artifactApi,
    ARTIFACT_API_PROPERTY_NAMES,
    realm.objectPrototype
  )
  assert.equal(
    typeof artifactApi.createSyncGatewayRequestBoundary,
    'function'
  )
  assert.equal(
    Object.getPrototypeOf(artifactApi.createSyncGatewayRequestBoundary),
    realm.functionPrototype
  )
}

function assertBoundaryApi(boundary, realm) {
  assertExactFrozenDataRecord(
    boundary,
    BOUNDARY_API_PROPERTY_NAMES,
    realm.objectPrototype
  )
  assert.equal(typeof boundary.processSyncRawBody, 'function')
  assert.equal(
    Object.getPrototypeOf(boundary.processSyncRawBody),
    realm.functionPrototype
  )
}

function assertBoundaryResultShape(result, realm) {
  assertExactFrozenDataRecord(
    result,
    RESULT_PROPERTY_NAMES,
    realm.objectPrototype
  )

  if (result.syncRequest !== null) {
    assertExactFrozenDataRecord(
      result.syncRequest,
      REQUEST_PROPERTY_NAMES,
      realm.objectPrototype
    )
    assertExactFrozenDataRecord(
      result.syncRequest.payload,
      [],
      realm.objectPrototype
    )
  }

  if (result.gatewayErrorResponse !== null) {
    const response = result.gatewayErrorResponse
    assertExactFrozenDataRecord(
      response,
      RESPONSE_PROPERTY_NAMES,
      realm.objectPrototype
    )
    assertExactFrozenDataRecord(
      response.error,
      RESPONSE_ERROR_PROPERTY_NAMES,
      realm.objectPrototype
    )
    assertExactFrozenDataArray(response.error.details, realm.arrayPrototype)
    assertExactFrozenDataArray(response.warnings, realm.arrayPrototype)
    assertExactFrozenDataRecord(
      response.meta,
      META_PROPERTY_NAMES,
      realm.objectPrototype
    )
    assertExactFrozenDataArray(
      response.meta.processedBy,
      realm.arrayPrototype
    )
  }

  if (result.error !== null) {
    assertExactFrozenDataRecord(
      result.error,
      LOCAL_ERROR_PROPERTY_NAMES,
      realm.objectPrototype
    )
  }
}

function getRealmValueKind(value, realm) {
  if (Array.isArray(value)) {
    assert.equal(Object.getPrototypeOf(value), realm.arrayPrototype)
    return 'array'
  }

  const prototype = Object.getPrototypeOf(value)

  if (prototype === realm.objectPrototype) {
    return 'record'
  }

  if (prototype === null) {
    return 'nullPrototypeRecord'
  }

  assert.fail('Der Ergebnisgraph enthält einen unerwarteten Prototyp.')
}

function assertRealmAwareGraphParity(
  actual,
  expected,
  {
    actualRealm,
    expectedRealm,
    path = '$',
    expectedToActual = new Map(),
    actualToExpected = new Map(),
  }
) {
  if (
    actual === null ||
    expected === null ||
    (typeof actual !== 'object' && typeof actual !== 'function') ||
    (typeof expected !== 'object' && typeof expected !== 'function')
  ) {
    assert.equal(
      Object.is(actual, expected),
      true,
      `${path}: primitive Werte weichen ab.`
    )
    return
  }

  assert.notEqual(typeof actual, 'function', `${path}: unerwartete Funktion`)
  assert.notEqual(typeof expected, 'function', `${path}: unerwartete Funktion`)

  if (expectedToActual.has(expected)) {
    assert.equal(
      actual,
      expectedToActual.get(expected),
      `${path}: erwartete Identitätswiederverwendung fehlt.`
    )
    return
  }

  assert.equal(
    actualToExpected.has(actual),
    false,
    `${path}: unerwartete Identitätszusammenlegung.`
  )
  expectedToActual.set(expected, actual)
  actualToExpected.set(actual, expected)

  assert.equal(
    getRealmValueKind(actual, actualRealm),
    getRealmValueKind(expected, expectedRealm),
    `${path}: Realm-Prototypklasse weicht ab.`
  )
  assert.equal(
    Object.isFrozen(actual),
    Object.isFrozen(expected),
    `${path}: Freeze-Zustand weicht ab.`
  )
  assert.equal(
    Object.isExtensible(actual),
    Object.isExtensible(expected),
    `${path}: Erweiterbarkeit weicht ab.`
  )

  const actualKeys = Reflect.ownKeys(actual)
  const expectedKeys = Reflect.ownKeys(expected)
  assert.equal(
    actualKeys.every((key) => typeof key === 'string'),
    true,
    `${path}: Symbolfelder sind nicht erlaubt.`
  )
  assert.equal(
    expectedKeys.every((key) => typeof key === 'string'),
    true,
    `${path}: Das Referenzergebnis enthält Symbolfelder.`
  )
  assert.deepEqual(
    actualKeys,
    expectedKeys,
    `${path}: Own-Key-Reihenfolge weicht ab.`
  )

  for (const propertyName of expectedKeys) {
    const propertyPath = `${path}.${propertyName}`
    const actualDescriptor = Object.getOwnPropertyDescriptor(
      actual,
      propertyName
    )
    const expectedDescriptor = Object.getOwnPropertyDescriptor(
      expected,
      propertyName
    )

    assert.notEqual(actualDescriptor, undefined, propertyPath)
    assert.notEqual(expectedDescriptor, undefined, propertyPath)
    assert.equal(
      Object.hasOwn(actualDescriptor, 'value'),
      Object.hasOwn(expectedDescriptor, 'value'),
      `${propertyPath}: Deskriptortyp weicht ab.`
    )
    assert.equal(
      actualDescriptor.enumerable,
      expectedDescriptor.enumerable,
      `${propertyPath}: enumerable weicht ab.`
    )
    assert.equal(
      actualDescriptor.configurable,
      expectedDescriptor.configurable,
      `${propertyPath}: configurable weicht ab.`
    )

    if (Object.hasOwn(expectedDescriptor, 'value')) {
      assert.equal(
        actualDescriptor.writable,
        expectedDescriptor.writable,
        `${propertyPath}: writable weicht ab.`
      )
      assertRealmAwareGraphParity(
        actualDescriptor.value,
        expectedDescriptor.value,
        {
          actualRealm,
          expectedRealm,
          path: propertyPath,
          expectedToActual,
          actualToExpected,
        }
      )
      continue
    }

    assert.equal(
      actualDescriptor.get,
      expectedDescriptor.get,
      `${propertyPath}: Getter weicht ab.`
    )
    assert.equal(
      actualDescriptor.set,
      expectedDescriptor.set,
      `${propertyPath}: Setter weicht ab.`
    )
  }
}

function captureOwnDataGraph(rootValue) {
  const nodes = new Map()

  function capture(value) {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      nodes.has(value)
    ) {
      return
    }

    const node = {
      extensible: Object.isExtensible(value),
      frozen: Object.isFrozen(value),
      keys: Reflect.ownKeys(value),
      prototype: Object.getPrototypeOf(value),
      descriptors: new Map(),
    }
    nodes.set(value, node)

    for (const propertyName of node.keys) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)
      node.descriptors.set(propertyName, descriptor)

      if (Object.hasOwn(descriptor, 'value')) {
        capture(descriptor.value)
      }
    }
  }

  capture(rootValue)
  return nodes
}

function assertOwnDataGraphUnchanged(snapshot) {
  for (const [value, node] of snapshot) {
    assert.equal(Object.getPrototypeOf(value), node.prototype)
    assert.equal(Object.isExtensible(value), node.extensible)
    assert.equal(Object.isFrozen(value), node.frozen)
    assert.deepEqual(Reflect.ownKeys(value), node.keys)

    for (const propertyName of node.keys) {
      const current = Object.getOwnPropertyDescriptor(value, propertyName)
      const original = node.descriptors.get(propertyName)
      assert.notEqual(current, undefined)
      assert.equal(
        Object.hasOwn(current, 'value'),
        Object.hasOwn(original, 'value')
      )
      assert.equal(current.enumerable, original.enumerable)
      assert.equal(current.configurable, original.configurable)

      if (Object.hasOwn(original, 'value')) {
        assert.equal(current.writable, original.writable)
        assert.equal(Object.is(current.value, original.value), true)
      } else {
        assert.equal(current.get, original.get)
        assert.equal(current.set, original.set)
      }
    }
  }
}

function collectOwnDataObjects(rootValue) {
  const objects = new Set()

  function collect(value) {
    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      objects.has(value)
    ) {
      return
    }

    objects.add(value)

    for (const propertyName of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (descriptor !== undefined && Object.hasOwn(descriptor, 'value')) {
        collect(descriptor.value)
      }
    }
  }

  collect(rootValue)
  return objects
}

function assertOwnDataGraphsAreDisjoint(firstRoot, secondRoot) {
  const firstObjects = collectOwnDataObjects(firstRoot)
  const secondObjects = collectOwnDataObjects(secondRoot)

  for (const firstObject of firstObjects) {
    assert.equal(secondObjects.has(firstObject), false)
  }
}

function collectStringLeaves(rootValue) {
  const strings = []
  const seen = new Set()

  function visit(value) {
    if (typeof value === 'string') {
      strings.push(value)
      return
    }

    if (
      value === null ||
      (typeof value !== 'object' && typeof value !== 'function') ||
      seen.has(value)
    ) {
      return
    }

    seen.add(value)

    for (const propertyName of Reflect.ownKeys(value)) {
      if (typeof propertyName === 'string') {
        strings.push(propertyName)
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, propertyName)

      if (descriptor !== undefined && Object.hasOwn(descriptor, 'value')) {
        visit(descriptor.value)
      }
    }
  }

  visit(rootValue)
  return strings
}

function createDependencySystem(configuration = {}) {
  const calls = {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 0,
  }
  const options = {}

  if (configuration.clockMode === 'nonFunction') {
    options.getCurrentTimestamp = null
  } else {
    options.getCurrentTimestamp = () => {
      calls.getCurrentTimestamp += 1

      if (configuration.clockMode === 'throw') {
        throw new Error(configuration.clockMarker ?? 'clock-failure')
      }

      if (configuration.clockMode === 'object') {
        return { marker: configuration.clockMarker ?? 'clock-object' }
      }

      return configuration.timestamp ?? REFERENCE_TIMESTAMP
    }
  }

  if (configuration.generatorMode === 'nonFunction') {
    options.generateGatewayRequestId = null
  } else {
    const generatedIds = configuration.generatedIds ?? [GATEWAY_REQUEST_ID]

    options.generateGatewayRequestId = () => {
      const callIndex = calls.generateGatewayRequestId
      calls.generateGatewayRequestId += 1

      if (configuration.generatorMode === 'throw') {
        throw new Error(
          configuration.generatorMarker ?? 'generator-failure'
        )
      }

      if (configuration.generatorMode === 'object') {
        return {
          marker: configuration.generatorMarker ?? 'generator-object',
        }
      }

      return generatedIds[Math.min(callIndex, generatedIds.length - 1)]
    }
  }

  return { calls, options }
}

function invokeBoundary(
  createBoundary,
  realm,
  rawBody,
  configuration = {},
  invocationArguments
) {
  const dependencies = createDependencySystem(configuration)
  const optionsSnapshot = captureOwnDataGraph(dependencies.options)
  const boundary = createBoundary(dependencies.options)
  assertBoundaryApi(boundary, realm)
  assertOwnDataGraphUnchanged(optionsSnapshot)

  const argumentsList = invocationArguments ?? [rawBody]
  const result = Reflect.apply(
    boundary.processSyncRawBody,
    boundary,
    argumentsList
  )

  assert.equal(
    result instanceof Promise,
    false,
    'Die synchrone Boundary darf kein Promise liefern.'
  )
  assertBoundaryResultShape(result, realm)

  return {
    boundary,
    calls: dependencies.calls,
    result,
  }
}

function assertBoundaryParity(
  loadedBundle,
  rawBody,
  configuration = {},
  invocationArguments
) {
  const canonical = invokeBoundary(
    createCanonicalBoundary,
    HOST_REALM,
    rawBody,
    configuration,
    invocationArguments
  )
  const generated = invokeBoundary(
    loadedBundle.artifactApi.createSyncGatewayRequestBoundary,
    loadedBundle.realm,
    rawBody,
    configuration,
    invocationArguments
  )

  assert.deepEqual(generated.calls, canonical.calls)
  assertRealmAwareGraphParity(generated.result, canonical.result, {
    actualRealm: loadedBundle.realm,
    expectedRealm: HOST_REALM,
  })

  return { canonical, generated }
}

async function createMutatedArtifactCopy(mutateArtifact) {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), 'goldendawn-n8n-boundary-mutation-')
  )
  const canonicalArtifact = await readFile(ARTIFACT_FILE, 'utf8')
  const mutatedArtifact = mutateArtifact(canonicalArtifact)
  const artifactFile = join(
    temporaryDirectory,
    'syncGatewayRequestBoundary.bundle.js'
  )
  await writeFile(artifactFile, mutatedArtifact, 'utf8')

  return {
    artifactFile,
    artifactText: await readFile(artifactFile, 'utf8'),
    temporaryDirectory,
  }
}

test('exportiert feste Pfade und weist unerwartete Bundler-Trailer fail-closed ab', () => {
  assert.equal(
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
    'artifacts/n8n/syncGatewayRequestBoundary.bundle.js'
  )
  assert.equal(
    SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
    'artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json'
  )
  assert.deepEqual(SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS, [
    'src/contracts/syncContract.js',
    'src/gateways/syncGatewayRequestBoundary.js',
    'scripts/n8n/syncGatewayBoundaryBundleEntry.js',
  ])
  assert.equal(
    Object.isFrozen(SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS),
    true
  )

  const expectedBundlerOutput = [
    '"use strict";',
    'var GoldenDawnSyncGatewayBoundaryBundle = (function() {',
    '\t"use strict";',
    '\treturn Object.freeze({});',
    '})();',
    '',
  ].join('\n')
  const artifactText = createSyncGatewayBoundaryExpressionArtifact(
    expectedBundlerOutput
  )

  assert.match(artifactText, /\*\/\n\(function\(\) \{\n\t"use strict";/)
  assert.equal(artifactText.endsWith('})()\n'), true)
  assert.equal(artifactText.endsWith('})();\n'), false)
  assert.doesNotMatch(
    artifactText,
    /var GoldenDawnSyncGatewayBoundaryBundle/
  )
  assert.throws(
    () => createSyncGatewayBoundaryExpressionArtifact(
      expectedBundlerOutput + 'globalThis.unexpectedTrailer = true;\n'
    ),
    /Unexpected SyncGateway boundary IIFE declaration/
  )

  const commaExpressionTrailer = [
    '"use strict";',
    'var GoldenDawnSyncGatewayBoundaryBundle = (function() {',
    '\t"use strict";',
    '\treturn Object.freeze({});',
    '})(), unexpectedTrailer = (globalThis.unexpectedTrailer = true, function() {',
    '\treturn Object.freeze({});',
    '})();',
    '',
  ].join('\n')

  assert.throws(
    () => createSyncGatewayBoundaryExpressionArtifact(
      commaExpressionTrailer
    ),
    /Unexpected SyncGateway boundary IIFE declaration/
  )

  const sloppyOnlyBundlerOutput = [
    '"use strict";',
    'var GoldenDawnSyncGatewayBoundaryBundle = (function() {',
    '\t"use strict";',
    '\twith ({}) {}',
    '\treturn Object.freeze({});',
    '})();',
    '',
  ].join('\n')

  assert.throws(
    () => createSyncGatewayBoundaryExpressionArtifact(
      sloppyOnlyBundlerOutput
    ),
    /Unexpected SyncGateway boundary IIFE declaration/
  )

  const templateLiteralBundlerOutput = [
    '"use strict";',
    'var GoldenDawnSyncGatewayBoundaryBundle = (function() {',
    '\t"use strict";',
    '\tconst marker = `before',
    '//#region literal-content',
    'after`;',
    '\treturn Object.freeze({ marker });',
    '})();',
    '',
  ].join('\n')
  const templateLiteralArtifact =
    createSyncGatewayBoundaryExpressionArtifact(
      templateLiteralBundlerOutput
    )

  assert.match(
    templateLiteralArtifact,
    /`before\n\/\/#region literal-content\nafter`/
  )
})

test('generiert aus identischen Quellen wiederholt byteidentische eingecheckte Artefakte', async () => {
  const first = await generateSyncGatewayBoundaryBundle({
    projectRoot: REPOSITORY_ROOT,
  })
  const second = await generateSyncGatewayBoundaryBundle({
    projectRoot: REPOSITORY_ROOT,
  })
  const committedArtifact = await readFile(ARTIFACT_FILE)
  const committedManifest = await readFile(MANIFEST_FILE)

  assert.equal(first.artifactBytes.equals(second.artifactBytes), true)
  assert.equal(first.manifestBytes.equals(second.manifestBytes), true)
  assert.equal(first.artifactBytes.equals(committedArtifact), true)
  assert.equal(first.manifestBytes.equals(committedManifest), true)
})

test('bindet Hash und Bundlerinput an denselben einmaligen Quell-Snapshot trotz deterministischem ABA', { concurrency: false }, async () => {
  const projectRoot = await createTemporaryProject()
  const sourceFile = resolve(
    projectRoot,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS[0]
  )
  const originalSourceBytes = await readFile(sourceFile)
  const originalSourceText = originalSourceBytes.toString('utf8')
  const mutationMarker = 'syncTestAbaMutation'
  const mutatedSourceText = originalSourceText.replace(
    "Object.freeze(['syncTest'])",
    `Object.freeze(['${mutationMarker}'])`
  )
  const baseline = await generateSyncGatewayBoundaryBundle({ projectRoot })
  const hashProbe = createHash('sha256')
  let hashPrototype = Object.getPrototypeOf(hashProbe)

  while (
    hashPrototype !== null &&
    !Object.hasOwn(hashPrototype, 'digest')
  ) {
    hashPrototype = Object.getPrototypeOf(hashPrototype)
  }

  const digestDescriptor = Object.getOwnPropertyDescriptor(
    hashPrototype,
    'digest'
  )
  const flatMapDescriptor = Object.getOwnPropertyDescriptor(
    Array.prototype,
    'flatMap'
  )
  let digestCallCount = 0
  let sourceMutationCount = 0
  let sourceRestoreCount = 0
  let generated
  let sourceBytesAfterGeneration

  assert.notEqual(mutatedSourceText, originalSourceText)
  assert.notEqual(hashPrototype, null)
  assert.notEqual(digestDescriptor, undefined)
  assert.notEqual(flatMapDescriptor, undefined)

  try {
    Object.defineProperty(hashPrototype, 'digest', {
      ...digestDescriptor,
      value(...argumentsList) {
        const result = Reflect.apply(
          digestDescriptor.value,
          this,
          argumentsList
        )
        digestCallCount += 1

        if (digestCallCount === 3) {
          writeFileSync(sourceFile, mutatedSourceText, 'utf8')
          sourceMutationCount += 1
        }

        return result
      },
    })
    Object.defineProperty(Array.prototype, 'flatMap', {
      ...flatMapDescriptor,
      value(callback, thisArgument) {
        const isTargetBuildOutput = (
          sourceRestoreCount === 0 &&
          Array.isArray(this) &&
          this.length > 0 &&
          this.every((output) => (
            output !== null &&
            typeof output === 'object' &&
            Array.isArray(output.output)
          )) &&
          this.some((output) => output.output.some((item) => (
            item?.type === 'chunk' &&
            typeof item.code === 'string' &&
            item.code.includes('GoldenDawnSyncGatewayBoundaryBundle')
          )))
        )

        if (isTargetBuildOutput) {
          writeFileSync(sourceFile, originalSourceBytes)
          sourceRestoreCount += 1
        }

        return Reflect.apply(
          flatMapDescriptor.value,
          this,
          [callback, thisArgument]
        )
      },
    })

    generated = await generateSyncGatewayBoundaryBundle({ projectRoot })
    sourceBytesAfterGeneration = await readFile(sourceFile)
  } finally {
    restoreOwnProperty(hashPrototype, 'digest', digestDescriptor)
    restoreOwnProperty(Array.prototype, 'flatMap', flatMapDescriptor)
    writeFileSync(sourceFile, originalSourceBytes)
    await removeTemporaryProject(projectRoot)
  }

  assert.equal(sourceMutationCount, 1)
  assert.equal(sourceRestoreCount, 1)
  assert.equal(sourceBytesAfterGeneration.equals(originalSourceBytes), true)
  assert.equal(generated.artifactBytes.equals(baseline.artifactBytes), true)
  assert.equal(generated.manifestBytes.equals(baseline.manifestBytes), true)
  assert.equal(
    generated.artifactBytes.toString('utf8').includes(mutationMarker),
    false
  )
})

test('bleibt über verschiedene Temp-Pfade, Zeitzonen, Locale- und Zufallswerte byteidentisch', { concurrency: false }, async () => {
  const firstProjectRoot = await createTemporaryProject()
  const secondProjectRoot = await createTemporaryProject()
  const dateNowDescriptor = Object.getOwnPropertyDescriptor(Date, 'now')
  const randomDescriptor = Object.getOwnPropertyDescriptor(Math, 'random')
  const originalTimezone = process.env.TZ
  const originalLocale = process.env.LANG
  let first
  let second

  try {
    Object.defineProperty(Date, 'now', {
      ...dateNowDescriptor,
      value: () => 946_684_800_000,
    })
    Object.defineProperty(Math, 'random', {
      ...randomDescriptor,
      value: () => 0.125,
    })
    process.env.TZ = 'Pacific/Kiritimati'
    process.env.LANG = 'de_DE.UTF-8'
    first = await generateSyncGatewayBoundaryBundle({
      projectRoot: firstProjectRoot,
    })

    Object.defineProperty(Date, 'now', {
      ...dateNowDescriptor,
      value: () => 4_102_444_800_000,
    })
    Object.defineProperty(Math, 'random', {
      ...randomDescriptor,
      value: () => 0.875,
    })
    process.env.TZ = 'America/Adak'
    process.env.LANG = 'C'
    second = await generateSyncGatewayBoundaryBundle({
      projectRoot: secondProjectRoot,
    })
  } finally {
    restoreOwnProperty(Date, 'now', dateNowDescriptor)
    restoreOwnProperty(Math, 'random', randomDescriptor)
    if (originalTimezone === undefined) {
      delete process.env.TZ
    } else {
      process.env.TZ = originalTimezone
    }

    if (originalLocale === undefined) {
      delete process.env.LANG
    } else {
      process.env.LANG = originalLocale
    }

    await Promise.all([
      removeTemporaryProject(firstProjectRoot),
      removeTemporaryProject(secondProjectRoot),
    ])
  }

  assert.equal(first.artifactBytes.equals(second.artifactBytes), true)
  assert.equal(first.manifestBytes.equals(second.manifestBytes), true)

  for (const generatedBytes of [
    first.artifactBytes,
    first.manifestBytes,
    second.artifactBytes,
    second.manifestBytes,
  ]) {
    const generatedText = generatedBytes.toString('utf8')
    assert.equal(generatedText.includes(firstProjectRoot), false)
    assert.equal(generatedText.includes(secondProjectRoot), false)
    assert.equal(
      generatedText.includes(toPortablePath(firstProjectRoot)),
      false
    )
    assert.equal(
      generatedText.includes(toPortablePath(secondProjectRoot)),
      false
    )
  }
})

test('manifestiert Artefakt und Quellen mit exakten SHA-256-Werten und fester Property-Reihenfolge', async () => {
  const artifactBytes = await readFile(ARTIFACT_FILE)
  const manifestBytes = await readFile(MANIFEST_FILE)
  const manifest = JSON.parse(manifestBytes.toString('utf8'))

  assert.deepEqual(Object.keys(manifest), [
    'schemaVersion',
    'artifact',
    'sources',
  ])
  assert.equal(manifest.schemaVersion, 1)
  assert.deepEqual(Object.keys(manifest.artifact), ['path', 'sha256'])
  assert.equal(
    manifest.artifact.path,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH
  )
  assert.equal(manifest.artifact.sha256, createSha256(artifactBytes))
  assert.equal(/^[a-f0-9]{64}$/.test(manifest.artifact.sha256), true)
  assert.deepEqual(
    manifest.sources.map((source) => source.path),
    SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS
  )

  for (const source of manifest.sources) {
    assert.deepEqual(Object.keys(source), ['path', 'sha256'])
    assert.equal(
      source.sha256,
      createSha256(await readFile(resolve(REPOSITORY_ROOT, source.path)))
    )
    assert.equal(/^[a-f0-9]{64}$/.test(source.sha256), true)
  }
})

test('stellt explizite Write- und Check-Modi mit kontrollierten Exitcodes bereit', async () => {
  const projectRoot = await createTemporaryProject()

  try {
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli(
        ['--write'],
        { projectRoot }
      ),
      0
    )
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli(
        ['--check'],
        { projectRoot }
      ),
      0
    )
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli([], { projectRoot }),
      2
    )
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli(
        ['--write', '--check'],
        { projectRoot }
      ),
      2
    )
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli(
        ['--unknown'],
        { projectRoot }
      ),
      2
    )

    const checkResult = await checkSyncGatewayBoundaryBundle({ projectRoot })
    assertExactFrozenDataRecord(
      checkResult,
      ['ok', 'artifactMatches', 'manifestMatches'],
      Object.prototype
    )
    assert.deepEqual(checkResult, {
      ok: true,
      artifactMatches: true,
      manifestMatches: true,
    })
  } finally {
    await removeTemporaryProject(projectRoot)
  }
})

test('Check-Modus erkennt eine Artefakt-Byteänderung und schreibt auch bei Drift nichts', async () => {
  const projectRoot = await createTemporaryProject()

  try {
    await writeSyncGatewayBoundaryBundle({ projectRoot })
    const artifactFile = resolve(
      projectRoot,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH
    )
    const canonicalArtifact = await readFile(artifactFile)
    const mutatedArtifact = Buffer.concat([
      canonicalArtifact.subarray(0, canonicalArtifact.length - 1),
      Buffer.from(' \n', 'utf8'),
    ])
    await writeFile(artifactFile, mutatedArtifact)
    const beforeCheck = await snapshotProjectTree(projectRoot)

    const checkResult = await checkSyncGatewayBoundaryBundle({ projectRoot })
    assert.deepEqual(checkResult, {
      ok: false,
      artifactMatches: false,
      manifestMatches: true,
    })
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli(
        ['--check'],
        { projectRoot }
      ),
      1
    )
    assert.deepEqual(
      await snapshotProjectTree(projectRoot),
      beforeCheck
    )
  } finally {
    await removeTemporaryProject(projectRoot)
  }
})

test('Check erkennt Quelldrift read-only und Generator weist Zusatzmodule ab', async () => {
  const projectRoot = await createTemporaryProject()

  try {
    await writeSyncGatewayBoundaryBundle({ projectRoot })
    const sourceFile = resolve(
      projectRoot,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS[0]
    )
    const sourceText = await readFile(sourceFile, 'utf8')
    await writeFile(
      sourceFile,
      sourceText + '// stale-source-integrity-mutation\n',
      'utf8'
    )
    const beforeCheck = await snapshotProjectTree(projectRoot)
    const checkResult = await checkSyncGatewayBoundaryBundle({ projectRoot })

    assert.equal(checkResult.ok, false)
    assert.equal(checkResult.manifestMatches, false)
    assert.equal(
      await runSyncGatewayBoundaryBundleGeneratorCli(
        ['--check'],
        { projectRoot }
      ),
      1
    )
    assert.deepEqual(
      await snapshotProjectTree(projectRoot),
      beforeCheck
    )

    const entryFile = resolve(
      projectRoot,
      'scripts',
      'n8n',
      'syncGatewayBoundaryBundleEntry.js'
    )
    const helperFile = resolve(
      projectRoot,
      'scripts',
      'n8n',
      'unexpectedBundleHelper.js'
    )
    const entryText = await readFile(entryFile, 'utf8')
    const mutatedEntryText = [
      "import { unexpectedBundleValue } from './unexpectedBundleHelper.js'",
      '',
      entryText.replace(
        '  createSyncGatewayRequestBoundary,\n',
        '  createSyncGatewayRequestBoundary,\n  unexpectedBundleValue,\n'
      ),
    ].join('\n')

    await writeFile(
      helperFile,
      "export const unexpectedBundleValue = 'unexpected'\n",
      'utf8'
    )
    await writeFile(entryFile, mutatedEntryText, 'utf8')
    const beforeRejectedGeneration = await snapshotProjectTree(projectRoot)

    await assert.rejects(
      generateSyncGatewayBoundaryBundle({ projectRoot }),
      /Unexpected SyncGateway boundary bundle module graph/
    )
    assert.deepEqual(
      await snapshotProjectTree(projectRoot),
      beforeRejectedGeneration
    )
  } finally {
    await removeTemporaryProject(projectRoot)
  }
})

test('Generate folgt weder verlinktem Artefakt- noch Manifestziel und lässt externe Sentinelbytes unverändert', async () => {
  for (const targetRelativePath of [
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
  ]) {
    const projectRoot = await createTemporaryProject()
    const outsideDirectory = await mkdtemp(
      join(tmpdir(), 'goldendawn-n8n-boundary-outside-target-')
    )
    const outputDirectory = resolve(projectRoot, 'artifacts', 'n8n')
    const linkedTarget = resolve(projectRoot, targetRelativePath)
    const sentinelFile = resolve(outsideDirectory, 'external-sentinel.js')
    const sentinelBytes = Buffer.from('external-target-sentinel\n', 'utf8')

    try {
      await mkdir(outputDirectory, { recursive: true })
      await writeFile(sentinelFile, sentinelBytes)
      try {
        await symlink(sentinelFile, linkedTarget, 'file')
      } catch (error) {
        if (
          process.platform !== 'win32' ||
          !['EACCES', 'EPERM'].includes(error?.code)
        ) {
          throw error
        }

        await symlink(outsideDirectory, linkedTarget, 'junction')
      }

      await assert.rejects(
        writeSyncGatewayBoundaryBundle({ projectRoot }),
        /Unsafe SyncGateway boundary bundle path/
      )
      assert.equal((await readFile(sentinelFile)).equals(sentinelBytes), true)
      assert.deepEqual(
        (await readdir(outputDirectory)).filter((name) => name.endsWith('.tmp')),
        []
      )
    } finally {
      await removeTestLinkIfPresent(linkedTarget)
      await Promise.all([
        removeTemporaryProject(projectRoot),
        rm(outsideDirectory, { recursive: true, force: true }),
      ])
    }
  }
})

test('Generate folgt weder dem verlinkten artifacts- noch n8n-Output-Parent und lässt externe Sentinelbytes unverändert', async () => {
  for (const parentRelativePath of ['artifacts', 'artifacts/n8n']) {
    const projectRoot = await createTemporaryProject()
    const outsideDirectory = await mkdtemp(
      join(tmpdir(), 'goldendawn-n8n-boundary-outside-parent-')
    )
    const linkedOutputDirectory = resolve(projectRoot, parentRelativePath)
    const sentinelFile = resolve(
      outsideDirectory,
      'syncGatewayRequestBoundary.bundle.js'
    )
    const sentinelBytes = Buffer.from('external-parent-sentinel\n', 'utf8')

    try {
      await mkdir(dirname(linkedOutputDirectory), { recursive: true })
      await writeFile(sentinelFile, sentinelBytes)
      await symlink(
        outsideDirectory,
        linkedOutputDirectory,
        process.platform === 'win32' ? 'junction' : 'dir'
      )

      await assert.rejects(
        writeSyncGatewayBoundaryBundle({ projectRoot }),
        /Unsafe SyncGateway boundary bundle path/
      )
      assert.equal((await readFile(sentinelFile)).equals(sentinelBytes), true)
      assert.deepEqual(
        (await readdir(outsideDirectory)).filter((name) => name.endsWith('.tmp')),
        []
      )
    } finally {
      await removeTestLinkIfPresent(linkedOutputDirectory)
      await Promise.all([
        removeTemporaryProject(projectRoot),
        rm(outsideDirectory, { recursive: true, force: true }),
      ])
    }
  }
})

test('bereinigt Temp-Write-Fehler und publiziert bei einem begrenzten Teilfehler Artefakt vor Manifest', { concurrency: false }, async () => {
  const projectRoot = await createTemporaryProject()
  const artifactFile = resolve(
    projectRoot,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH
  )
  const manifestFile = resolve(
    projectRoot,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH
  )
  const outputDirectory = dirname(artifactFile)
  const equalsDescriptor = Object.getOwnPropertyDescriptor(
    Buffer.prototype,
    'equals'
  )
  let artifactVerificationCount = 0
  let syncDescriptor
  let syncFailureCount = 0
  let syncPrototype

  try {
    await writeSyncGatewayBoundaryBundle({ projectRoot })
    const expected = await generateSyncGatewayBoundaryBundle({ projectRoot })
    const staleArtifactBytes = Buffer.concat([
      expected.artifactBytes,
      Buffer.from('// stale artifact\n', 'utf8'),
    ])
    const staleManifestBytes = Buffer.concat([
      expected.manifestBytes,
      Buffer.from(' ', 'utf8'),
    ])

    await writeFile(artifactFile, staleArtifactBytes)
    await writeFile(manifestFile, staleManifestBytes)

    const syncProbe = await open(
      resolve(projectRoot, SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS[0]),
      'r'
    )

    try {
      syncPrototype = Object.getPrototypeOf(syncProbe)

      while (
        syncPrototype !== null &&
        !Object.hasOwn(syncPrototype, 'sync')
      ) {
        syncPrototype = Object.getPrototypeOf(syncPrototype)
      }

      syncDescriptor = syncPrototype === null
        ? undefined
        : Object.getOwnPropertyDescriptor(syncPrototype, 'sync')
    } finally {
      await syncProbe.close()
    }

    assert.notEqual(syncPrototype, null)
    assert.notEqual(syncDescriptor, undefined)
    Object.defineProperty(syncPrototype, 'sync', {
      ...syncDescriptor,
      async value() {
        syncFailureCount += 1
        throw new Error('injected temporary sync failure')
      },
    })

    await assert.rejects(
      writeSyncGatewayBoundaryBundle({ projectRoot }),
      /injected temporary sync failure/
    )
    restoreOwnProperty(syncPrototype, 'sync', syncDescriptor)

    assert.equal(syncFailureCount, 1)
    assert.equal(
      (await readFile(artifactFile)).equals(staleArtifactBytes),
      true
    )
    assert.equal(
      (await readFile(manifestFile)).equals(staleManifestBytes),
      true
    )
    assert.deepEqual(
      (await readdir(outputDirectory)).filter((name) => name.endsWith('.tmp')),
      []
    )

    Object.defineProperty(Buffer.prototype, 'equals', {
      ...equalsDescriptor,
      value(otherBuffer) {
        const matches = Reflect.apply(
          equalsDescriptor.value,
          this,
          [otherBuffer]
        )
        const comparesExpectedArtifact = (
          Buffer.isBuffer(otherBuffer) &&
          Reflect.apply(
            equalsDescriptor.value,
            expected.artifactBytes,
            [otherBuffer]
          )
        )

        if (matches && comparesExpectedArtifact) {
          artifactVerificationCount += 1

          if (artifactVerificationCount === 3) {
            throw new Error('injected manifest-last interruption')
          }
        }

        return matches
      },
    })

    await assert.rejects(
      writeSyncGatewayBoundaryBundle({ projectRoot }),
      /injected manifest-last interruption/
    )
    restoreOwnProperty(Buffer.prototype, 'equals', equalsDescriptor)

    assert.equal(
      (await readFile(artifactFile)).equals(expected.artifactBytes),
      true
    )
    assert.equal(
      (await readFile(manifestFile)).equals(staleManifestBytes),
      true
    )
    assert.deepEqual(
      await checkSyncGatewayBoundaryBundle({ projectRoot }),
      {
        ok: false,
        artifactMatches: true,
        manifestMatches: false,
      }
    )
    assert.deepEqual(
      (await readdir(outputDirectory)).filter((name) => name.endsWith('.tmp')),
      []
    )
  } finally {
    restoreOwnProperty(Buffer.prototype, 'equals', equalsDescriptor)
    if (syncDescriptor !== undefined) {
      restoreOwnProperty(syncPrototype, 'sync', syncDescriptor)
    }
    await removeTemporaryProject(projectRoot)
  }
})

test('Check-Modus lässt einen aktuellen Projektbaum einschließlich Zeitmetadaten vollständig unverändert', async () => {
  const projectRoot = await createTemporaryProject()

  try {
    await writeSyncGatewayBoundaryBundle({ projectRoot })
    const beforeCheck = await snapshotProjectTree(projectRoot)
    const checkResult = await checkSyncGatewayBoundaryBundle({ projectRoot })

    assert.deepEqual(checkResult, {
      ok: true,
      artifactMatches: true,
      manifestMatches: true,
    })
    assert.deepEqual(
      await snapshotProjectTree(projectRoot),
      beforeCheck
    )
  } finally {
    await removeTemporaryProject(projectRoot)
  }
})

test('Artefakt und Manifest erfüllen Format-, Pfad- und Runtime-Hygiene ohne verbotene Imports oder Zugriffe', async () => {
  const artifactBytes = await readFile(ARTIFACT_FILE)
  const manifestBytes = await readFile(MANIFEST_FILE)
  const artifactText = artifactBytes.toString('utf8')
  const manifestText = manifestBytes.toString('utf8')
  const generatorText = await readFile(GENERATOR_FILE, 'utf8')

  for (const [label, bytes, text] of [
    ['artifact', artifactBytes, artifactText],
    ['manifest', manifestBytes, manifestText],
  ]) {
    assert.equal(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false, label)
    assert.equal(text.includes('\r'), false, label)
    assert.equal(text.endsWith('\n'), true, label)
    assert.doesNotMatch(text, /[A-Za-z]:[\\/]/, label)
    assert.doesNotMatch(
      text,
      /\/(?:app|home|mnt|opt|private|root|srv|tmp|Users|usr|var|workspace)\//,
      label
    )
    assert.doesNotMatch(
      text,
      /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z\b/,
      label
    )
    assert.doesNotMatch(
      text,
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
      label
    )
  }

  assert.doesNotMatch(artifactText, /\b(?:import|export)\s*(?:\(|[\s{*])/)
  assert.doesNotMatch(artifactText, /\brequire\s*\(/)
  assert.doesNotMatch(artifactText, /sourceMappingURL|\.map\b/)
  assert.doesNotMatch(artifactText, /\/\/#(?:end)?region\b/)
  assert.doesNotMatch(artifactText, /\beval\s*\(|\bnew\s+Function\b/)
  assert.doesNotMatch(
    artifactText,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\b/
  )
  assert.doesNotMatch(
    artifactText,
    /\b(?:process|Deno|Bun)\b|node:fs|node:path|node:child_process/
  )
  assert.doesNotMatch(
    artifactText,
    /\b(?:console|credential|secret|token|password)\b/i
  )
  assert.doesNotMatch(
    artifactText,
    /\$(?:json|input)\b|\bitems\b|\bwebhook\b/i
  )
  assert.doesNotMatch(
    generatorText,
    /\bDate\b|Math\.random|randomUUID|localeCompare|toLocale|\bIntl\b/
  )
})

test('bindet die unveränderten Artefaktbytes in einer Code-Node-artigen Funktionskomposition direkt an die nutzbare API', async () => {
  const artifactText = await readFile(ARTIFACT_FILE, 'utf8')
  const consoleRecorder = createConsoleRecorder()
  const sandbox = {
    console: consoleRecorder.recorder,
  }
  const context = vm.createContext(sandbox, {
    name: 'goldendawn-n8n-code-node-composition-test',
    codeGeneration: {
      strings: false,
      wasm: false,
    },
  })
  const compositionPrefix = [
    '(function runCodeNodeLikeComposition() {',
    '  const boundaryBundle =',
    '',
  ].join('\n')
  const compositionSuffix = [
    '  ;',
    '  const boundary = boundaryBundle.createSyncGatewayRequestBoundary({',
    `    generateGatewayRequestId: () => '${GATEWAY_REQUEST_ID}',`,
    `    getCurrentTimestamp: () => '${REFERENCE_TIMESTAMP}',`,
    '  })',
    `  const result = boundary.processSyncRawBody(${JSON.stringify(createRawRequest())})`,
    '  return { boundaryBundle, result }',
    '})()',
    '',
  ].join('\n')
  const compositionSource = (
    compositionPrefix + artifactText + compositionSuffix
  )
  const globalKeysBefore = Reflect.ownKeys(sandbox)
  const compositionResult = new vm.Script(compositionSource, {
    filename: 'goldendawn-n8n-code-node-composition.js',
  }).runInContext(context, { timeout: 1_000 })
  const realm = vm.runInContext(
    `({
      objectPrototype: Object.prototype,
      arrayPrototype: Array.prototype,
      functionPrototype: Function.prototype,
    })`,
    context,
    { timeout: 1_000 }
  )

  assert.equal(compositionSource.includes(artifactText), true)
  assert.equal(typeof compositionResult.boundaryBundle, 'object')
  assert.notEqual(compositionResult.boundaryBundle, 'use strict')
  assert.notEqual(compositionResult.boundaryBundle, undefined)
  assertArtifactApi(compositionResult.boundaryBundle, realm)
  assert.equal(compositionResult.result.ok, true)
  assert.equal(compositionResult.result.status, 'syncRequestAccepted')
  assert.deepEqual(Reflect.ownKeys(sandbox), globalKeysBefore)
  assert.deepEqual(consoleRecorder.calls, [])
})

test('Auswertung ist seiteneffektfrei und liefert exakt die eingefrorene Artefakt- und Boundary-API', async () => {
  const artifactText = await readFile(ARTIFACT_FILE, 'utf8')
  let parseResolutionCount = 0
  const jsonProbe = {}
  Object.defineProperty(jsonProbe, 'parse', {
    configurable: false,
    enumerable: true,
    get() {
      parseResolutionCount += 1
      return JSON.parse
    },
  })
  const loadedBundle = evaluateBundle(artifactText, {
    JSON: Object.freeze(jsonProbe),
  })

  assert.deepEqual(
    loadedBundle.globalKeysAfter,
    loadedBundle.globalKeysBefore
  )
  assert.deepEqual(loadedBundle.consoleCalls, [])
  assert.equal(parseResolutionCount, 0)
  assertArtifactApi(loadedBundle.artifactApi, loadedBundle.realm)

  const boundary = loadedBundle.artifactApi.createSyncGatewayRequestBoundary({
    generateGatewayRequestId: () => GATEWAY_REQUEST_ID,
    getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
  })
  assertBoundaryApi(boundary, loadedBundle.realm)
  assert.equal(parseResolutionCount, 0)
  assert.deepEqual(loadedBundle.consoleCalls, [])
})

test('hält descriptor-, prototyp-, key-order- und freeze-genaue Parität über die vollständige Raw-Body-Matrix', async (testContext) => {
  const artifactText = await readFile(ARTIFACT_FILE, 'utf8')
  const loadedBundle = evaluateBundle(artifactText)
  const exactSizeBody =
    '"' + 'a'.repeat(SYNC_CONTRACT_MAX_RAW_BODY_BYTES - 2) + '"'
  const oversizedBody = exactSizeBody.slice(0, -1) + 'a"'
  const cases = [
    ['gültiger leerer synthetischer syncTest', createRawRequest()],
    ['leerer Raw Body', ''],
    ['ungültiges JSON', '{"private":"invalid-json"'],
    ['JSON null', 'null'],
    ['JSON boolean', 'true'],
    ['JSON number', '17'],
    ['JSON string', '"synthetic"'],
    ['JSON array', '[]'],
    ['leeres JSON object', '{}'],
    ['fehlendes Feld', JSON.stringify({
      version: '1.0',
      action: 'syncTest',
      source: 'goldendawn-os',
      requestId: REQUEST_ID,
      timestamp: REQUEST_TIMESTAMP,
    })],
    ['zusätzliches unbekanntes Feld', createRawRequest({ extra: true })],
    ['ungültige Version', createRawRequest({ version: '2.0' })],
    ['unbekannte Aktion', createRawRequest({ action: 'unknownAction' })],
    ['ungültige Quelle', createRawRequest({ source: 'unknown-source' })],
    ['ungültige Request-ID', createRawRequest({ requestId: 'invalid' })],
    ['zu lange Request-ID', createRawRequest({
      requestId: 'req_' + 'a'.repeat(61),
    })],
    ['ungültiger Zeitstempel', createRawRequest({ timestamp: 'invalid' })],
    ['Zeitstempel außerhalb Toleranz', createRawRequest({
      timestamp: '2031-04-05T10:25:30.001Z',
    })],
    ['nicht leeres Payload', createRawRequest({ payload: { value: true } })],
    ['Payload als Array', createRawRequest({ payload: [] })],
    ['Payload null', createRawRequest({ payload: null })],
    ['U+FEFF vor gültigem JSON', '\uFEFF' + createRawRequest()],
    ['exakt 65.536 UTF-8-Bytes', exactSizeBody],
    ['65.537 UTF-8-Bytes', oversizedBody],
  ]

  assert.equal(Buffer.byteLength(exactSizeBody, 'utf8'), 65_536)
  assert.equal(Buffer.byteLength(oversizedBody, 'utf8'), 65_537)

  for (const [label, rawBody] of cases) {
    await testContext.test(label, () => {
      assertBoundaryParity(loadedBundle, rawBody)
    })
  }

  await testContext.test('fehlende Argumente', () => {
    assertBoundaryParity(loadedBundle, undefined, {}, [])
  })
  await testContext.test('zusätzliche Argumente', () => {
    assertBoundaryParity(
      loadedBundle,
      createRawRequest(),
      {},
      [createRawRequest(), 'additional']
    )
  })
  assert.deepEqual(loadedBundle.consoleCalls, [])
})

test('hält kontrollierte Clock- und Gateway-ID-Injektion sowie Dependency-Fehler exakt paritätisch', async (testContext) => {
  const loadedBundle = evaluateBundle(await readFile(ARTIFACT_FILE, 'utf8'))
  const dependencyCases = [
    ['deterministischer Erfolg', createRawRequest(), {}],
    ['deterministische Ablehnung', '', {}],
    ['werfende Clock', createRawRequest(), {
      clockMode: 'throw',
      clockMarker: 'PRIVATE_CLOCK_THROW',
    }],
    ['nicht primitive Clock', createRawRequest(), {
      clockMode: 'object',
      clockMarker: 'PRIVATE_CLOCK_OBJECT',
    }],
    ['nicht funktionale Clock', createRawRequest(), {
      clockMode: 'nonFunction',
    }],
    ['ungültige Referenzzeit', createRawRequest(), {
      timestamp: 'invalid-reference-time',
    }],
    ['werfender Generator', '', {
      generatorMode: 'throw',
      generatorMarker: 'PRIVATE_GENERATOR_THROW',
    }],
    ['nicht primitiver Generator', '', {
      generatorMode: 'object',
      generatorMarker: 'PRIVATE_GENERATOR_OBJECT',
    }],
    ['nicht funktionaler Generator', '', {
      generatorMode: 'nonFunction',
    }],
    ['syntaktisch ungültige Gateway-ID', '', {
      generatedIds: ['private-invalid-gateway-id'],
    }],
  ]

  for (const [label, rawBody, configuration] of dependencyCases) {
    await testContext.test(label, () => {
      assertBoundaryParity(loadedBundle, rawBody, configuration)
    })
  }

  const accepted = assertBoundaryParity(loadedBundle, createRawRequest())
  assert.deepEqual(accepted.generated.calls, {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 1,
  })
  const rejected = assertBoundaryParity(loadedBundle, '')
  assert.deepEqual(rejected.generated.calls, {
    generateGatewayRequestId: 1,
    getCurrentTimestamp: 1,
  })
  assert.deepEqual(loadedBundle.consoleCalls, [])
})

test('parst exakt einmal ohne Reviver, mutiert keinen Parsed-Input und verarbeitet nicht erneut', async () => {
  const rawBody = createRawRequest()
  const loadedBundle = evaluateBundle(await readFile(ARTIFACT_FILE, 'utf8'))
  const parsedInput = vm.runInContext(
    `JSON.parse(${JSON.stringify(rawBody)})`,
    loadedBundle.context,
    { timeout: 1_000 }
  )
  loadedBundle.context.__parsedInput = parsedInput
  vm.runInContext(
    `globalThis.__parseCalls = [];
    globalThis.__nativeJsonParse = JSON.parse;
    JSON.parse = function (...argumentsList) {
      globalThis.__parseCalls.push({
        argumentsList,
        receiverMatches: this === JSON,
      });
      return globalThis.__parsedInput;
    };
    JSON.stringify = function () {
      throw new Error('PRIVATE_STRINGIFY_MARKER');
    };`,
    loadedBundle.context,
    { timeout: 1_000 }
  )
  const inputSnapshot = captureOwnDataGraph(parsedInput)
  const inputObjects = collectOwnDataObjects(parsedInput)
  const system = invokeBoundary(
    loadedBundle.artifactApi.createSyncGatewayRequestBoundary,
    loadedBundle.realm,
    rawBody
  )
  const parseCalls = loadedBundle.context.__parseCalls

  assert.equal(parseCalls.length, 1)
  assert.equal(parseCalls[0].receiverMatches, true)
  assert.equal(parseCalls[0].argumentsList.length, 1)
  assert.equal(parseCalls[0].argumentsList[0], rawBody)
  assert.deepEqual(system.calls, {
    generateGatewayRequestId: 0,
    getCurrentTimestamp: 1,
  })
  assertOwnDataGraphUnchanged(inputSnapshot)
  assert.notEqual(system.result.syncRequest, parsedInput)
  assert.notEqual(system.result.syncRequest.payload, parsedInput.payload)

  for (const resultObject of collectOwnDataObjects(system.result)) {
    assert.equal(inputObjects.has(resultObject), false)
  }

  assert.deepEqual(loadedBundle.consoleCalls, [])
})

test('liefert bei wiederholten Erfolgen, Ablehnungen und lokalen Fehlern vollständig frische Graphen', async () => {
  const loadedBundle = evaluateBundle(await readFile(ARTIFACT_FILE, 'utf8'))
  const dependencies = createDependencySystem({
    generatedIds: [GATEWAY_REQUEST_ID, SECOND_GATEWAY_REQUEST_ID],
  })
  const boundary = loadedBundle.artifactApi.createSyncGatewayRequestBoundary(
    dependencies.options
  )
  assertBoundaryApi(boundary, loadedBundle.realm)

  const firstAccepted = boundary.processSyncRawBody(createRawRequest())
  const secondAccepted = boundary.processSyncRawBody(createRawRequest())
  const firstRejected = boundary.processSyncRawBody('')
  const secondRejected = boundary.processSyncRawBody('')
  assertBoundaryResultShape(firstAccepted, loadedBundle.realm)
  assertBoundaryResultShape(secondAccepted, loadedBundle.realm)
  assertBoundaryResultShape(firstRejected, loadedBundle.realm)
  assertBoundaryResultShape(secondRejected, loadedBundle.realm)
  assertOwnDataGraphsAreDisjoint(firstAccepted, secondAccepted)
  assertOwnDataGraphsAreDisjoint(firstRejected, secondRejected)
  assertOwnDataGraphsAreDisjoint(firstAccepted, firstRejected)

  const failingBoundary =
    loadedBundle.artifactApi.createSyncGatewayRequestBoundary({
      generateGatewayRequestId: () => GATEWAY_REQUEST_ID,
      getCurrentTimestamp: () => {
        throw new Error('PRIVATE_FRESH_LOCAL_FAILURE')
      },
    })
  const firstFailure = failingBoundary.processSyncRawBody(createRawRequest())
  const secondFailure = failingBoundary.processSyncRawBody(createRawRequest())
  assertBoundaryResultShape(firstFailure, loadedBundle.realm)
  assertBoundaryResultShape(secondFailure, loadedBundle.realm)
  assertOwnDataGraphsAreDisjoint(firstFailure, secondFailure)
  assert.deepEqual(loadedBundle.consoleCalls, [])
})

test('redigiert Raw-Body-, Clock- und Generator-Marker vollständig aus Resultaten und Console', async () => {
  const loadedBundle = evaluateBundle(await readFile(ARTIFACT_FILE, 'utf8'))
  const markers = [
    'PRIVATE_RAW_BODY_MARKER',
    'PRIVATE_CLOCK_MARKER',
    'PRIVATE_GENERATOR_MARKER',
  ]
  const results = [
    invokeBoundary(
      loadedBundle.artifactApi.createSyncGatewayRequestBoundary,
      loadedBundle.realm,
      '{"PRIVATE_RAW_BODY_MARKER"'
    ).result,
    invokeBoundary(
      loadedBundle.artifactApi.createSyncGatewayRequestBoundary,
      loadedBundle.realm,
      createRawRequest(),
      {
        clockMode: 'throw',
        clockMarker: 'PRIVATE_CLOCK_MARKER',
      }
    ).result,
    invokeBoundary(
      loadedBundle.artifactApi.createSyncGatewayRequestBoundary,
      loadedBundle.realm,
      '',
      {
        generatorMode: 'throw',
        generatorMarker: 'PRIVATE_GENERATOR_MARKER',
      }
    ).result,
  ]
  const observableText = [
    ...results.flatMap(collectStringLeaves),
    ...loadedBundle.consoleCalls.flatMap((call) => (
      call.argumentsList.map(String)
    )),
  ].join('\n')

  for (const marker of markers) {
    assert.equal(observableText.includes(marker), false)
  }

  assert.deepEqual(loadedBundle.consoleCalls, [])
})

test('eine gezielte semantische Bundle-Mutation wird durch die Realm-Paritätsprüfung erkannt', async () => {
  const mutation = await createMutatedArtifactCopy((artifactText) => {
    const mutated = artifactText.replace(
      'status: "syncRequestAccepted"',
      'status: "syncRequestMutated"'
    )
    assert.notEqual(mutated, artifactText)
    return mutated
  })

  try {
    const loadedBundle = evaluateBundle(mutation.artifactText)
    assert.throws(() => {
      assertBoundaryParity(loadedBundle, createRawRequest())
    }, assert.AssertionError)
  } finally {
    await removeTemporaryProject(mutation.temporaryDirectory)
  }
})

test('entfernte Artefakt- und Boundary-API-Freeze-Garantien werden gezielt erkannt', async (testContext) => {
  const mutations = [
    [
      'Artefakt-API',
      'return Object.freeze({ createSyncGatewayRequestBoundary });',
      'return { createSyncGatewayRequestBoundary };',
      (loadedBundle) => assertArtifactApi(
        loadedBundle.artifactApi,
        loadedBundle.realm
      ),
    ],
    [
      'Boundary-API',
      'return Object.freeze({ processSyncRawBody });',
      'return { processSyncRawBody };',
      (loadedBundle) => {
        const boundary =
          loadedBundle.artifactApi.createSyncGatewayRequestBoundary({
            generateGatewayRequestId: () => GATEWAY_REQUEST_ID,
            getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
          })
        assertBoundaryApi(boundary, loadedBundle.realm)
      },
    ],
  ]

  for (const [label, searchValue, replacement, assertMutation] of mutations) {
    await testContext.test(label, async () => {
      const mutation = await createMutatedArtifactCopy((artifactText) => {
        const mutated = artifactText.replace(searchValue, replacement)
        assert.notEqual(mutated, artifactText)
        return mutated
      })

      try {
        const loadedBundle = evaluateBundle(mutation.artifactText)
        assert.throws(() => {
          assertMutation(loadedBundle)
        }, assert.AssertionError)
      } finally {
        await removeTemporaryProject(mutation.temporaryDirectory)
      }
    })
  }
})

test('ein in eine temporäre Bundle-Exception mutierter privater Marker bleibt statisch redigiert', async () => {
  const privateMarker = 'PRIVATE_MUTATED_EXCEPTION_MARKER'
  const mutation = await createMutatedArtifactCopy((artifactText) => {
    const mutated = artifactText.replace(
      'crypto.randomUUID is unavailable',
      privateMarker
    )
    assert.notEqual(mutated, artifactText)
    return mutated
  })

  try {
    const loadedBundle = evaluateBundle(mutation.artifactText, {
      crypto: undefined,
    })
    const boundary =
      loadedBundle.artifactApi.createSyncGatewayRequestBoundary({
        getCurrentTimestamp: () => REFERENCE_TIMESTAMP,
      })
    const result = boundary.processSyncRawBody('')
    assertBoundaryResultShape(result, loadedBundle.realm)

    const observableText = [
      ...collectStringLeaves(result),
      ...loadedBundle.consoleCalls.flatMap((call) => (
        call.argumentsList.map(String)
      )),
    ].join('\n')
    assert.equal(observableText.includes(privateMarker), false)
    assert.deepEqual(loadedBundle.consoleCalls, [])
  } finally {
    await removeTemporaryProject(mutation.temporaryDirectory)
  }
})
