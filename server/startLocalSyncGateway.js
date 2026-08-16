import { pathToFileURL } from 'node:url'

import {
  createLocalSyncGatewayHttpServer,
} from './localSyncGatewayHttpServer.js'
import {
  readLocalSyncGatewayRuntimeConfig,
} from './localSyncGatewayRuntimeConfig.js'

const CONFIGURATION_FAILURE_MESSAGE =
  'Das lokale SyncGateway wurde wegen ungültiger Runtime-Konfiguration nicht gestartet.'
const START_FAILURE_MESSAGE =
  'Das lokale SyncGateway konnte nicht gestartet werden.'
const STOP_FAILURE_MESSAGE =
  'Das lokale SyncGateway konnte nicht kontrolliert gestoppt werden.'
const RUNTIME_FAILURE_MESSAGE =
  'Das lokale SyncGateway wurde nach einem internen Serverfehler beendet.'
const STARTED_MESSAGE =
  'Das lokale SyncGateway lauscht ausschließlich auf 127.0.0.1.'

function isMainModule() {
  const entryPath = process.argv[1]

  if (typeof entryPath !== 'string' || entryPath.length === 0) {
    return false
  }

  try {
    return import.meta.url === pathToFileURL(entryPath).href
  } catch {
    return false
  }
}

async function startLocalSyncGatewayProcess() {
  const runtimeConfiguration = readLocalSyncGatewayRuntimeConfig()

  if (!runtimeConfiguration.ok) {
    console.error(CONFIGURATION_FAILURE_MESSAGE)
    process.exitCode = 1
    return
  }

  let localSyncGateway
  let fatalObserved = false
  let resolveFatal
  const fatalCompletion = new Promise((resolve) => {
    resolveFatal = resolve
  })

  function onFatal() {
    if (fatalObserved) {
      return
    }

    fatalObserved = true
    resolveFatal()
  }

  try {
    localSyncGateway = createLocalSyncGatewayHttpServer({
      ...runtimeConfiguration.config,
      onFatal,
    })
  } catch {
    console.error(START_FAILURE_MESSAGE)
    process.exitCode = 1
    return
  }

  const startResult = await localSyncGateway.start()

  if (!startResult.ok) {
    console.error(START_FAILURE_MESSAGE)
    process.exitCode = 1

    try {
      await localSyncGateway.stop()
    } catch {
      // Die statische Startfehlermeldung bleibt die einzige Ausgabe.
    }

    return
  }

  let completionStarted = false

  function removeSignalHandlers() {
    process.off('SIGINT', handleSignal)
    process.off('SIGTERM', handleSignal)
  }

  async function completeProcess({ fatal }) {
    if (completionStarted) {
      return
    }

    completionStarted = true
    removeSignalHandlers()

    if (fatal) {
      process.exitCode = 1
      console.error(RUNTIME_FAILURE_MESSAGE)
    }

    let stopSucceeded = false

    try {
      const stopResult = await localSyncGateway.stop()
      stopSucceeded = stopResult?.ok === true
    } catch {
      stopSucceeded = false
    }

    if (!fatal && !stopSucceeded) {
      console.error(STOP_FAILURE_MESSAGE)
      process.exitCode = 1
    }
  }

  function handleSignal() {
    void completeProcess({ fatal: false })
  }

  process.once('SIGINT', handleSignal)
  process.once('SIGTERM', handleSignal)
  void fatalCompletion
    .then(() => completeProcess({ fatal: true }))
    .catch(() => {})

  if (fatalObserved) {
    await completeProcess({ fatal: true })
    return
  }

  console.info(STARTED_MESSAGE)
}

if (isMainModule()) {
  startLocalSyncGatewayProcess().catch(() => {
    console.error(START_FAILURE_MESSAGE)
    process.exitCode = 1
  })
}
