const RUNTIME_PORT_NAME = 'GOLDENDAWN_SYNC_GATEWAY_PORT'
const RUNTIME_ALLOWED_ORIGIN_NAME =
  'GOLDENDAWN_SYNC_GATEWAY_ALLOWED_ORIGIN'

const INVALID_RUNTIME_CONFIGURATION = Object.freeze({
  code: 'invalidLocalSyncGatewayRuntimeConfiguration',
  message: 'Die lokale SyncGateway-Runtime-Konfiguration ist ungültig.',
})

function createRejectedRuntimeConfiguration() {
  return Object.freeze({
    ok: false,
    status: 'runtimeConfigurationRejected',
    config: null,
    error: Object.freeze({
      code: INVALID_RUNTIME_CONFIGURATION.code,
      message: INVALID_RUNTIME_CONFIGURATION.message,
    }),
  })
}

function parseRuntimePort(value) {
  if (
    typeof value !== 'string' ||
    !/^[1-9][0-9]{0,4}$/.test(value)
  ) {
    return null
  }

  const port = Number(value)

  return Number.isSafeInteger(port) && port <= 65_535
    ? port
    : null
}

function isSupportedLoopbackHostname(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  )
}

function parseRuntimeAllowedOrigin(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  let parsedOrigin

  try {
    parsedOrigin = new URL(value)
  } catch {
    return null
  }

  if (
    (parsedOrigin.protocol !== 'http:' &&
      parsedOrigin.protocol !== 'https:') ||
    !isSupportedLoopbackHostname(parsedOrigin.hostname) ||
    parsedOrigin.origin !== value
  ) {
    return null
  }

  return value
}

export function readLocalSyncGatewayRuntimeConfig(
  environment = process.env
) {
  let rawPort
  let rawAllowedOrigin

  try {
    rawPort = environment?.[RUNTIME_PORT_NAME]
    rawAllowedOrigin = environment?.[RUNTIME_ALLOWED_ORIGIN_NAME]
  } catch {
    return createRejectedRuntimeConfiguration()
  }

  const port = parseRuntimePort(rawPort)
  const allowedOrigin = parseRuntimeAllowedOrigin(rawAllowedOrigin)

  if (port === null || allowedOrigin === null) {
    return createRejectedRuntimeConfiguration()
  }

  const config = Object.freeze({ port, allowedOrigin })

  return Object.freeze({
    ok: true,
    status: 'runtimeConfigurationAccepted',
    config,
    error: null,
  })
}
