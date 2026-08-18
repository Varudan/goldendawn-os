import { createHash, randomBytes } from 'node:crypto'
import {
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  unlink,
} from 'node:fs/promises'
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { TextDecoder } from 'node:util'
import { Script } from 'node:vm'

import { build, parseAst } from 'vite'

const GENERATOR_DIRECTORY = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PROJECT_ROOT = resolve(GENERATOR_DIRECTORY, '..', '..')
const BUNDLE_GLOBAL_NAME = 'GoldenDawnSyncGatewayBoundaryBundle'
const BUNDLE_DECLARATION_PREFIX = `var ${BUNDLE_GLOBAL_NAME} = `
const STRICT_MODE_DIRECTIVE = '"use strict";\n'
const STRICT_BUNDLE_DECLARATION_PREFIX =
  STRICT_MODE_DIRECTIVE + BUNDLE_DECLARATION_PREFIX
const BUNDLE_DECLARATION_SUFFIX = ';\n'
const IIFE_EXPRESSION_PREFIX = '(function() {'
const IIFE_EXPRESSION_SUFFIX = '})()'
const SNAPSHOT_ENTRY_SPECIFIER = 'goldendawn:sync-gateway-boundary-entry'
const SNAPSHOT_CONTRACT_MODULE_ID = '\0goldendawn/sync-contract.js'
const SNAPSHOT_BOUNDARY_MODULE_ID = '\0goldendawn/sync-boundary.js'
const SNAPSHOT_ENTRY_MODULE_ID = '\0goldendawn/sync-entry.js'
const SOURCE_TEXT_DECODER = new TextDecoder('utf-8', {
  fatal: true,
  ignoreBOM: true,
})
const GENERATED_FILE_HEADER = [
  '/*',
  ' * Generated from the canonical GoldenDawn SyncContract and request boundary.',
  ' * Regenerate with: npm run bundle:n8n:generate',
  ' * This expression returns Object.freeze({ createSyncGatewayRequestBoundary }).',
  ' */',
  '',
].join('\n')

export const SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH =
  'artifacts/n8n/syncGatewayRequestBoundary.bundle.js'
export const SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH =
  'artifacts/n8n/syncGatewayRequestBoundary.bundle.manifest.json'
export const SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS = Object.freeze([
  'src/contracts/syncContract.js',
  'src/gateways/syncGatewayRequestBoundary.js',
  'scripts/n8n/syncGatewayBoundaryBundleEntry.js',
])

const SOURCE_DEFINITIONS = Object.freeze([
  Object.freeze({
    path: SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS[0],
    moduleId: SNAPSHOT_CONTRACT_MODULE_ID,
  }),
  Object.freeze({
    path: SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS[1],
    moduleId: SNAPSHOT_BOUNDARY_MODULE_ID,
  }),
  Object.freeze({
    path: SYNC_GATEWAY_BOUNDARY_BUNDLE_SOURCE_PATHS[2],
    moduleId: SNAPSHOT_ENTRY_MODULE_ID,
  }),
])

const EXPECTED_MODULE_IDS = Object.freeze(
  SOURCE_DEFINITIONS.map(({ moduleId }) => moduleId)
)

const ALLOWED_SNAPSHOT_IMPORTS = Object.freeze([
  Object.freeze({
    importer: SNAPSHOT_ENTRY_MODULE_ID,
    source: '../../src/gateways/syncGatewayRequestBoundary.js',
    resolvedId: SNAPSHOT_BOUNDARY_MODULE_ID,
  }),
  Object.freeze({
    importer: SNAPSHOT_BOUNDARY_MODULE_ID,
    source: '../contracts/syncContract.js',
    resolvedId: SNAPSHOT_CONTRACT_MODULE_ID,
  }),
])

let temporaryFileCounter = 0

function createSha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function normalizeGeneratedText(value) {
  const normalizedValue = value.replace(/\r\n?/g, '\n')
  const withoutBom = normalizedValue.startsWith('\uFEFF')
    ? normalizedValue.slice(1)
    : normalizedValue

  return withoutBom.endsWith('\n')
    ? withoutBom
    : withoutBom + '\n'
}

function createUnsafePathError() {
  return new Error('Unsafe SyncGateway boundary bundle path')
}

function isSameResolvedPath(leftPath, rightPath) {
  return (
    relative(leftPath, rightPath) === '' &&
    relative(rightPath, leftPath) === ''
  )
}

function isPathInside(rootPath, candidatePath) {
  const relativePath = relative(rootPath, candidatePath)

  return (
    relativePath === '' ||
    (
      relativePath !== '..' &&
      !relativePath.startsWith('..' + sep) &&
      !isAbsolute(relativePath)
    )
  )
}

function haveSameFilesystemIdentity(leftStat, rightStat) {
  return (
    leftStat.dev === rightStat.dev &&
    leftStat.ino === rightStat.ino &&
    leftStat.mode === rightStat.mode
  )
}

function haveSameFileState(leftStat, rightStat) {
  return (
    haveSameFilesystemIdentity(leftStat, rightStat) &&
    leftStat.size === rightStat.size &&
    leftStat.mtimeNs === rightStat.mtimeNs &&
    leftStat.ctimeNs === rightStat.ctimeNs
  )
}

function getSafeRelativePathParts(repositoryRelativePath) {
  if (
    typeof repositoryRelativePath !== 'string' ||
    repositoryRelativePath.length === 0 ||
    isAbsolute(repositoryRelativePath) ||
    repositoryRelativePath.includes('\\')
  ) {
    throw createUnsafePathError()
  }

  const parts = repositoryRelativePath.split('/')

  if (parts.some((part) => (
    part.length === 0 || part === '.' || part === '..'
  ))) {
    throw createUnsafePathError()
  }

  return parts
}

async function createVerifiedProjectRoot(projectRoot) {
  if (typeof projectRoot !== 'string' || projectRoot.length === 0) {
    throw createUnsafePathError()
  }

  const requestedRoot = resolve(projectRoot)
  const requestedRootStat = await lstat(requestedRoot, { bigint: true })

  if (
    requestedRootStat.isSymbolicLink() ||
    !requestedRootStat.isDirectory()
  ) {
    throw createUnsafePathError()
  }

  const canonicalRoot = await realpath(requestedRoot)
  const canonicalRootStat = await lstat(canonicalRoot, { bigint: true })

  if (
    !isSameResolvedPath(requestedRoot, canonicalRoot) ||
    canonicalRootStat.isSymbolicLink() ||
    !canonicalRootStat.isDirectory() ||
    !haveSameFilesystemIdentity(requestedRootStat, canonicalRootStat)
  ) {
    throw createUnsafePathError()
  }

  return Object.freeze({
    requestedRoot,
    canonicalRoot,
    rootStat: requestedRootStat,
  })
}

async function assertProjectRootStillVerified(rootContext) {
  const currentRootStat = await lstat(rootContext.requestedRoot, {
    bigint: true,
  })
  const currentCanonicalRoot = await realpath(rootContext.requestedRoot)

  if (
    currentRootStat.isSymbolicLink() ||
    !currentRootStat.isDirectory() ||
    !haveSameFilesystemIdentity(currentRootStat, rootContext.rootStat) ||
    !isSameResolvedPath(currentCanonicalRoot, rootContext.canonicalRoot)
  ) {
    throw createUnsafePathError()
  }
}

async function resolveVerifiedDirectory(
  rootContext,
  repositoryRelativeDirectory,
  { createMissing = false, missingIsAbsent = false } = {}
) {
  await assertProjectRootStillVerified(rootContext)

  if (repositoryRelativeDirectory === '.') {
    return rootContext.canonicalRoot
  }

  const parts = getSafeRelativePathParts(repositoryRelativeDirectory)
  let currentDirectory = rootContext.canonicalRoot

  for (const part of parts) {
    const candidateDirectory = resolve(currentDirectory, part)
    let candidateStat

    if (!isPathInside(rootContext.canonicalRoot, candidateDirectory)) {
      throw createUnsafePathError()
    }

    try {
      candidateStat = await lstat(candidateDirectory, { bigint: true })
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }

      if (createMissing) {
        try {
          await mkdir(candidateDirectory)
        } catch (mkdirError) {
          if (mkdirError?.code !== 'EEXIST') {
            throw mkdirError
          }
        }
        candidateStat = await lstat(candidateDirectory, { bigint: true })
      } else if (missingIsAbsent) {
        return undefined
      } else {
        throw error
      }
    }

    if (
      candidateStat.isSymbolicLink() ||
      !candidateStat.isDirectory()
    ) {
      throw createUnsafePathError()
    }

    const canonicalDirectory = await realpath(candidateDirectory)
    const canonicalDirectoryStat = await lstat(canonicalDirectory, {
      bigint: true,
    })
    const stableCandidateStat = await lstat(candidateDirectory, {
      bigint: true,
    })

    if (
      !isPathInside(rootContext.canonicalRoot, canonicalDirectory) ||
      !isSameResolvedPath(candidateDirectory, canonicalDirectory) ||
      canonicalDirectoryStat.isSymbolicLink() ||
      !canonicalDirectoryStat.isDirectory() ||
      !haveSameFilesystemIdentity(candidateStat, canonicalDirectoryStat) ||
      !haveSameFilesystemIdentity(candidateStat, stableCandidateStat)
    ) {
      throw createUnsafePathError()
    }

    currentDirectory = canonicalDirectory
  }

  return currentDirectory
}

async function inspectVerifiedRepositoryFile(
  rootContext,
  repositoryRelativePath,
  { createParent = false, missingParentIsAbsent = false } = {}
) {
  const parts = getSafeRelativePathParts(repositoryRelativePath)
  const fileName = parts.at(-1)
  const parentRelativePath = parts.length === 1
    ? '.'
    : parts.slice(0, -1).join('/')
  const parentPath = await resolveVerifiedDirectory(
    rootContext,
    parentRelativePath,
    {
      createMissing: createParent,
      missingIsAbsent: missingParentIsAbsent,
    }
  )

  if (parentPath === undefined) {
    return Object.freeze({
      exists: false,
      parentPath: undefined,
      targetPath: undefined,
    })
  }

  const targetPath = resolve(parentPath, fileName)

  if (!isPathInside(rootContext.canonicalRoot, targetPath)) {
    throw createUnsafePathError()
  }

  let targetStat

  try {
    targetStat = await lstat(targetPath, { bigint: true })
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return Object.freeze({
        exists: false,
        parentPath,
        targetPath,
      })
    }

    throw error
  }

  if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
    throw createUnsafePathError()
  }

  const canonicalTarget = await realpath(targetPath)
  const canonicalTargetStat = await lstat(canonicalTarget, { bigint: true })
  const stableTargetStat = await lstat(targetPath, { bigint: true })

  if (
    !isPathInside(rootContext.canonicalRoot, canonicalTarget) ||
    !isSameResolvedPath(targetPath, canonicalTarget) ||
    canonicalTargetStat.isSymbolicLink() ||
    !canonicalTargetStat.isFile() ||
    !haveSameFilesystemIdentity(targetStat, canonicalTargetStat) ||
    !haveSameFilesystemIdentity(targetStat, stableTargetStat)
  ) {
    throw createUnsafePathError()
  }

  return Object.freeze({
    exists: true,
    parentPath,
    stat: targetStat,
    targetPath,
  })
}

async function readVerifiedRepositoryFile(
  rootContext,
  repositoryRelativePath
) {
  const inspectedFile = await inspectVerifiedRepositoryFile(
    rootContext,
    repositoryRelativePath
  )

  if (!inspectedFile.exists) {
    throw createUnsafePathError()
  }

  const fileHandle = await open(inspectedFile.targetPath, 'r')

  try {
    const openedStat = await fileHandle.stat({ bigint: true })

    if (
      !openedStat.isFile() ||
      !haveSameFileState(inspectedFile.stat, openedStat)
    ) {
      throw createUnsafePathError()
    }

    const bytes = await fileHandle.readFile()
    const completedStat = await fileHandle.stat({ bigint: true })

    if (!haveSameFileState(openedStat, completedStat)) {
      throw createUnsafePathError()
    }

    const stableFile = await inspectVerifiedRepositoryFile(
      rootContext,
      repositoryRelativePath
    )

    if (
      !stableFile.exists ||
      !haveSameFileState(completedStat, stableFile.stat)
    ) {
      throw createUnsafePathError()
    }

    return bytes
  } finally {
    await fileHandle.close()
  }
}

async function readCanonicalSourceSnapshot(rootContext) {
  const sourceSnapshots = []

  for (const definition of SOURCE_DEFINITIONS) {
    const sourceBytes = await readVerifiedRepositoryFile(
      rootContext,
      definition.path
    )
    let sourceText

    try {
      sourceText = SOURCE_TEXT_DECODER.decode(sourceBytes)
    } catch {
      throw new Error('Invalid SyncGateway boundary bundle source encoding')
    }

    sourceSnapshots.push(Object.freeze({
      path: definition.path,
      moduleId: definition.moduleId,
      sha256: createSha256(sourceBytes),
      sourceText,
    }))
  }

  return Object.freeze(sourceSnapshots)
}

function hasExactStringMembers(actualValues, expectedValues) {
  if (!Array.isArray(actualValues)) {
    return false
  }

  const sortedActualValues = [...actualValues].sort()
  const sortedExpectedValues = [...expectedValues].sort()

  return (
    sortedActualValues.length === sortedExpectedValues.length &&
    sortedActualValues.every((value, index) => (
      value === sortedExpectedValues[index]
    ))
  )
}

function isSingleExpressionIife(expressionCode) {
  let program

  try {
    program = parseAst(expressionCode)
  } catch {
    return false
  }

  const statement = program.body?.[0]
  const expression = statement?.expression
  const callee = expression?.callee
  const strictModeStatement = callee?.body?.body?.[0]
  const strictModeLiteral = strictModeStatement?.expression

  return (
    program.type === 'Program' &&
    program.sourceType === 'script' &&
    program.hashbang === null &&
    program.start === 0 &&
    program.end === expressionCode.length &&
    program.body.length === 1 &&
    statement.type === 'ExpressionStatement' &&
    statement.start === 0 &&
    statement.end === expressionCode.length &&
    expression.type === 'CallExpression' &&
    expression.optional === false &&
    expression.arguments.length === 0 &&
    expression.start === 0 &&
    expression.end === expressionCode.length &&
    callee.type === 'FunctionExpression' &&
    callee.id === null &&
    callee.generator === false &&
    callee.async === false &&
    callee.expression === false &&
    callee.params.length === 0 &&
    callee.body?.type === 'BlockStatement' &&
    strictModeStatement?.type === 'ExpressionStatement' &&
    strictModeStatement.directive === 'use strict' &&
    strictModeLiteral?.type === 'Literal' &&
    strictModeLiteral.value === 'use strict' &&
    strictModeLiteral.raw === '"use strict"'
  )
}

function readSingleJavaScriptChunk(buildResult) {
  const buildOutputs = Array.isArray(buildResult)
    ? buildResult
    : [buildResult]
  const outputItems = buildOutputs.flatMap((output) => output.output)
  const chunks = outputItems.filter((item) => item.type === 'chunk')
  const assets = outputItems.filter((item) => item.type === 'asset')

  if (
    chunks.length !== 1 ||
    assets.length !== 0 ||
    chunks[0].isEntry !== true
  ) {
    throw new Error('Unexpected SyncGateway boundary bundle output shape')
  }

  const chunk = chunks[0]
  const actualModuleIds = (
    chunk.modules !== null &&
    typeof chunk.modules === 'object' &&
    !Array.isArray(chunk.modules)
  )
    ? Object.keys(chunk.modules)
    : []

  if (
    !hasExactStringMembers(actualModuleIds, EXPECTED_MODULE_IDS) ||
    !hasExactStringMembers(
      chunk.moduleIds,
      EXPECTED_MODULE_IDS
    ) ||
    !hasExactStringMembers(chunk.imports, []) ||
    !hasExactStringMembers(chunk.dynamicImports, []) ||
    !hasExactStringMembers(chunk.exports, ['default']) ||
    chunk.facadeModuleId !== SNAPSHOT_ENTRY_MODULE_ID ||
    chunk.isDynamicEntry !== false
  ) {
    throw new Error('Unexpected SyncGateway boundary bundle module graph')
  }

  return chunk.code
}

export function createSyncGatewayBoundaryExpressionArtifact(generatedCode) {
  if (typeof generatedCode !== 'string') {
    throw new Error('Unexpected SyncGateway boundary IIFE declaration')
  }

  const normalizedGeneratedCode = normalizeGeneratedText(generatedCode)

  if (
    !normalizedGeneratedCode.startsWith(
      STRICT_BUNDLE_DECLARATION_PREFIX
    ) ||
    !normalizedGeneratedCode.endsWith(BUNDLE_DECLARATION_SUFFIX)
  ) {
    throw new Error('Unexpected SyncGateway boundary IIFE declaration')
  }

  const expressionCode = normalizedGeneratedCode.slice(
    STRICT_BUNDLE_DECLARATION_PREFIX.length,
    -BUNDLE_DECLARATION_SUFFIX.length
  )

  if (
    !expressionCode.startsWith(IIFE_EXPRESSION_PREFIX) ||
    !expressionCode.endsWith(IIFE_EXPRESSION_SUFFIX) ||
    !isSingleExpressionIife(expressionCode)
  ) {
    throw new Error('Unexpected SyncGateway boundary IIFE declaration')
  }

  const artifactText = normalizeGeneratedText(
    GENERATED_FILE_HEADER +
      expressionCode +
      '\n'
  )

  try {
    new Script(artifactText, {
      filename: 'syncGatewayRequestBoundary.bundle.js',
    })
    new Script(
      'const boundaryBundle =\n' +
        artifactText +
        '\n;\nvoid boundaryBundle\n',
      {
        filename: 'syncGatewayRequestBoundary.bundle.binding.js',
      }
    )
  } catch {
    throw new Error('Unexpected SyncGateway boundary IIFE declaration')
  }

  return artifactText
}

function createSourceSnapshotPlugin(sourceSnapshots) {
  const snapshotByModuleId = new Map(
    sourceSnapshots.map((snapshot) => [snapshot.moduleId, snapshot])
  )

  return {
    name: 'goldendawn-sync-gateway-boundary-snapshot',
    enforce: 'pre',
    resolveId(source, importer) {
      if (
        source === SNAPSHOT_ENTRY_SPECIFIER &&
        importer === undefined
      ) {
        return SNAPSHOT_ENTRY_MODULE_ID
      }

      const allowedImport = ALLOWED_SNAPSHOT_IMPORTS.find((candidate) => (
        candidate.importer === importer && candidate.source === source
      ))

      if (allowedImport !== undefined) {
        return allowedImport.resolvedId
      }

      if (snapshotByModuleId.has(importer)) {
        throw new Error(
          'Unexpected SyncGateway boundary bundle module graph'
        )
      }

      return null
    },
    load(moduleId) {
      const snapshot = snapshotByModuleId.get(moduleId)

      return snapshot === undefined ? null : snapshot.sourceText
    },
  }
}

async function buildExpressionBundle(projectRoot, sourceSnapshots) {
  const buildResult = await build({
    root: projectRoot,
    configFile: false,
    envFile: false,
    logLevel: 'silent',
    publicDir: false,
    appType: 'custom',
    plugins: [createSourceSnapshotPlugin(sourceSnapshots)],
    build: {
      target: 'es2020',
      lib: {
        entry: SNAPSHOT_ENTRY_SPECIFIER,
        name: BUNDLE_GLOBAL_NAME,
        formats: ['iife'],
        fileName: 'syncGatewayRequestBoundary.bundle.js',
      },
      write: false,
      minify: false,
      sourcemap: false,
      emptyOutDir: false,
      copyPublicDir: false,
      manifest: false,
      ssrManifest: false,
      reportCompressedSize: false,
      modulePreload: false,
      rolldownOptions: {
        input: SNAPSHOT_ENTRY_SPECIFIER,
        experimental: {
          attachDebugInfo: 'none',
        },
        output: {
          comments: false,
          exports: 'default',
          intro: STRICT_MODE_DIRECTIVE.trimEnd(),
          strict: true,
        },
      },
    },
  })
  const generatedCode = readSingleJavaScriptChunk(buildResult)

  return createSyncGatewayBoundaryExpressionArtifact(generatedCode)
}

async function generateSyncGatewayBoundaryBundleFromRootContext(rootContext) {
  const sourceSnapshots = await readCanonicalSourceSnapshot(rootContext)
  const artifactText = await buildExpressionBundle(
    rootContext.canonicalRoot,
    sourceSnapshots
  )
  const artifactBytes = Buffer.from(artifactText, 'utf8')
  const manifest = {
    schemaVersion: 1,
    artifact: {
      path: SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
      sha256: createSha256(artifactBytes),
    },
    sources: sourceSnapshots.map(({ path, sha256 }) => ({
      path,
      sha256,
    })),
  }
  const manifestBytes = Buffer.from(
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  )

  return {
    artifactBytes,
    manifestBytes,
    manifest,
  }
}

export async function generateSyncGatewayBoundaryBundle({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const rootContext = await createVerifiedProjectRoot(projectRoot)

  return generateSyncGatewayBoundaryBundleFromRootContext(rootContext)
}

async function fileMatches(rootContext, repositoryRelativePath, expectedBytes) {
  const inspectedFile = await inspectVerifiedRepositoryFile(
    rootContext,
    repositoryRelativePath,
    { missingParentIsAbsent: true }
  )

  if (!inspectedFile.exists) {
    return false
  }

  const currentBytes = await readVerifiedRepositoryFile(
    rootContext,
    repositoryRelativePath
  )

  return currentBytes.equals(expectedBytes)
}

function toRepositoryRelativePath(rootContext, absolutePath) {
  if (!isPathInside(rootContext.canonicalRoot, absolutePath)) {
    throw createUnsafePathError()
  }

  return relative(rootContext.canonicalRoot, absolutePath)
    .split(sep)
    .join('/')
}

async function removeTemporaryFileIfPresent(rootContext, temporaryFile) {
  if (temporaryFile === undefined) {
    return
  }

  const inspectedTemporaryFile = await inspectVerifiedRepositoryFile(
    rootContext,
    temporaryFile.relativePath
  )

  if (!inspectedTemporaryFile.exists) {
    return
  }

  if (!haveSameFilesystemIdentity(
    temporaryFile.stat,
    inspectedTemporaryFile.stat
  )) {
    throw createUnsafePathError()
  }

  try {
    await unlink(inspectedTemporaryFile.targetPath)
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }
}

async function removeTemporaryFilesIfPresent(rootContext, temporaryFiles) {
  let firstError

  for (const temporaryFile of temporaryFiles) {
    try {
      await removeTemporaryFileIfPresent(rootContext, temporaryFile)
    } catch (error) {
      firstError ??= error
    }
  }

  if (firstError !== undefined) {
    throw firstError
  }
}

async function createTemporaryOutputFile(
  rootContext,
  targetFile,
  expectedBytes
) {
  const stableParent = await resolveVerifiedDirectory(
    rootContext,
    toRepositoryRelativePath(rootContext, targetFile.parentPath)
  )

  if (!isSameResolvedPath(stableParent, targetFile.parentPath)) {
    throw createUnsafePathError()
  }

  for (let attempt = 0; attempt < 100; attempt += 1) {
    temporaryFileCounter += 1
    const temporaryName = [
      '.',
      basename(targetFile.targetPath),
      '.',
      String(process.pid),
      '.',
      String(temporaryFileCounter),
      '.',
      randomBytes(16).toString('hex'),
      '.tmp',
    ].join('')
    const temporaryPath = resolve(stableParent, temporaryName)
    let temporaryHandle

    try {
      temporaryHandle = await open(temporaryPath, 'wx', 0o600)
    } catch (error) {
      if (error?.code === 'EEXIST') {
        continue
      }

      throw error
    }

    let temporaryFile
    let writeError

    try {
      const openedStat = await temporaryHandle.stat({ bigint: true })

      if (!openedStat.isFile() || openedStat.isSymbolicLink()) {
        throw createUnsafePathError()
      }

      temporaryFile = Object.freeze({
        path: temporaryPath,
        relativePath: toRepositoryRelativePath(
          rootContext,
          temporaryPath
        ),
        stat: openedStat,
      })

      await temporaryHandle.writeFile(expectedBytes)
      await temporaryHandle.sync()

      const completedStat = await temporaryHandle.stat({ bigint: true })

      if (
        !haveSameFilesystemIdentity(openedStat, completedStat) ||
        completedStat.size !== BigInt(expectedBytes.length)
      ) {
        throw createUnsafePathError()
      }

      temporaryFile = Object.freeze({
        path: temporaryPath,
        relativePath: toRepositoryRelativePath(
          rootContext,
          temporaryPath
        ),
        stat: completedStat,
      })
    } catch (error) {
      writeError = error
    }

    try {
      await temporaryHandle.close()
    } catch (error) {
      writeError ??= error
    }

    if (writeError !== undefined) {
      await removeTemporaryFileIfPresent(rootContext, temporaryFile)
      throw writeError
    }

    try {
      const verifiedBytes = await readVerifiedRepositoryFile(
        rootContext,
        temporaryFile.relativePath
      )
      const stableTemporaryFile = await inspectVerifiedRepositoryFile(
        rootContext,
        temporaryFile.relativePath
      )

      if (
        !verifiedBytes.equals(expectedBytes) ||
        !stableTemporaryFile.exists ||
        !haveSameFileState(temporaryFile.stat, stableTemporaryFile.stat)
      ) {
        throw createUnsafePathError()
      }
    } catch (error) {
      await removeTemporaryFileIfPresent(rootContext, temporaryFile)
      throw error
    }

    return temporaryFile
  }

  throw new Error('Unable to create SyncGateway boundary bundle temp file')
}

async function publishTemporaryOutputFile(
  rootContext,
  temporaryFile,
  repositoryRelativeTargetPath,
  expectedBytes
) {
  const targetFile = await inspectVerifiedRepositoryFile(
    rootContext,
    repositoryRelativeTargetPath
  )
  const stableTemporaryFile = await inspectVerifiedRepositoryFile(
    rootContext,
    temporaryFile.relativePath
  )

  if (
    stableTemporaryFile.exists !== true ||
    !haveSameFileState(temporaryFile.stat, stableTemporaryFile.stat) ||
    !isSameResolvedPath(
      stableTemporaryFile.parentPath,
      targetFile.parentPath
    )
  ) {
    throw createUnsafePathError()
  }

  const stableTemporaryBytes = await readVerifiedRepositoryFile(
    rootContext,
    temporaryFile.relativePath
  )
  const finalTemporaryFile = await inspectVerifiedRepositoryFile(
    rootContext,
    temporaryFile.relativePath
  )

  if (
    !stableTemporaryBytes.equals(expectedBytes) ||
    !finalTemporaryFile.exists ||
    !haveSameFileState(temporaryFile.stat, finalTemporaryFile.stat)
  ) {
    throw createUnsafePathError()
  }

  const finalTargetFile = await inspectVerifiedRepositoryFile(
    rootContext,
    repositoryRelativeTargetPath
  )

  if (!isSameResolvedPath(
    finalTemporaryFile.parentPath,
    finalTargetFile.parentPath
  )) {
    throw createUnsafePathError()
  }

  await rename(finalTemporaryFile.targetPath, finalTargetFile.targetPath)

  const publishedFile = await inspectVerifiedRepositoryFile(
    rootContext,
    repositoryRelativeTargetPath
  )

  if (
    !publishedFile.exists ||
    !haveSameFilesystemIdentity(temporaryFile.stat, publishedFile.stat)
  ) {
    throw new Error('SyncGateway boundary bundle output replacement failed')
  }

  if (!await fileMatches(
    rootContext,
    repositoryRelativeTargetPath,
    expectedBytes
  )) {
    throw new Error('SyncGateway boundary bundle output replacement failed')
  }
}

export async function writeSyncGatewayBoundaryBundle({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const rootContext = await createVerifiedProjectRoot(projectRoot)
  const generatedBundle = await generateSyncGatewayBoundaryBundleFromRootContext(
    rootContext
  )
  const artifactTarget = await inspectVerifiedRepositoryFile(
    rootContext,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
    { createParent: true }
  )
  const manifestTarget = await inspectVerifiedRepositoryFile(
    rootContext,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
    { createParent: true }
  )
  const artifactMatches = await fileMatches(
    rootContext,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
    generatedBundle.artifactBytes
  )
  const manifestMatches = await fileMatches(
    rootContext,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
    generatedBundle.manifestBytes
  )
  let artifactTemporaryFile
  let manifestTemporaryFile

  try {
    if (!artifactMatches) {
      artifactTemporaryFile = await createTemporaryOutputFile(
        rootContext,
        artifactTarget,
        generatedBundle.artifactBytes
      )
    }

    if (!manifestMatches) {
      manifestTemporaryFile = await createTemporaryOutputFile(
        rootContext,
        manifestTarget,
        generatedBundle.manifestBytes
      )
    }

    if (artifactTemporaryFile !== undefined) {
      await publishTemporaryOutputFile(
        rootContext,
        artifactTemporaryFile,
        SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
        generatedBundle.artifactBytes
      )
    }

    if (!await fileMatches(
      rootContext,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
      generatedBundle.artifactBytes
    )) {
      throw new Error('SyncGateway boundary bundle artifact drift')
    }

    if (manifestTemporaryFile !== undefined) {
      await publishTemporaryOutputFile(
        rootContext,
        manifestTemporaryFile,
        SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
        generatedBundle.manifestBytes
      )
    }

    if (!await fileMatches(
      rootContext,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
      generatedBundle.manifestBytes
    )) {
      throw new Error('SyncGateway boundary bundle manifest drift')
    }

    if (!await fileMatches(
      rootContext,
      SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
      generatedBundle.artifactBytes
    )) {
      throw new Error('SyncGateway boundary bundle artifact drift')
    }

    return generatedBundle
  } finally {
    await removeTemporaryFilesIfPresent(rootContext, [
      artifactTemporaryFile,
      manifestTemporaryFile,
    ])
  }
}

export async function checkSyncGatewayBoundaryBundle({
  projectRoot = DEFAULT_PROJECT_ROOT,
} = {}) {
  const rootContext = await createVerifiedProjectRoot(projectRoot)
  const generatedBundle = await generateSyncGatewayBoundaryBundleFromRootContext(
    rootContext
  )
  const artifactMatches = await fileMatches(
    rootContext,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_ARTIFACT_PATH,
    generatedBundle.artifactBytes
  )
  const manifestMatches = await fileMatches(
    rootContext,
    SYNC_GATEWAY_BOUNDARY_BUNDLE_MANIFEST_PATH,
    generatedBundle.manifestBytes
  )

  return Object.freeze({
    ok: artifactMatches && manifestMatches,
    artifactMatches,
    manifestMatches,
  })
}

export async function runSyncGatewayBoundaryBundleGeneratorCli(
  argumentsList,
  { projectRoot = DEFAULT_PROJECT_ROOT } = {}
) {
  if (
    !Array.isArray(argumentsList) ||
    argumentsList.length !== 1
  ) {
    return 2
  }

  if (argumentsList[0] === '--write') {
    await writeSyncGatewayBoundaryBundle({ projectRoot })
    return 0
  }

  if (argumentsList[0] === '--check') {
    const checkResult = await checkSyncGatewayBoundaryBundle({ projectRoot })
    return checkResult.ok ? 0 : 1
  }

  return 2
}

function isDirectExecution() {
  const entryPath = process.argv[1]

  return (
    typeof entryPath === 'string' &&
    pathToFileURL(resolve(entryPath)).href === import.meta.url
  )
}

if (isDirectExecution()) {
  runSyncGatewayBoundaryBundleGeneratorCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode
    })
    .catch(() => {
      process.exitCode = 1
      process.stderr.write(
        'Das n8n-Boundary-Bundle konnte nicht sicher verarbeitet werden.\n'
      )
    })
}
