const CapturedObject = Object
const CapturedArray = Array
const CapturedPromise = Promise
const CapturedDate = Date
const capturedObjectPrototype = Object.prototype
const capturedArrayPrototype = Array.prototype
const capturedPromisePrototype = Promise.prototype
const capturedReflectApply = Reflect.apply
const capturedReflectOwnKeys = Reflect.ownKeys
const capturedArrayIsArray = Array.isArray
const capturedGetPrototypeOf = Object.getPrototypeOf
const capturedGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
const capturedObjectFreeze = Object.freeze
const capturedObjectIsFrozen = Object.isFrozen
const capturedObjectHasOwn = Object.hasOwn
const capturedObjectCreate = Object.create
const capturedDefineProperty = Object.defineProperty
const CapturedString = String
const capturedStringCharCodeAt = String.prototype.charCodeAt
const capturedStringSlice = String.prototype.slice
const capturedNumberIsFinite = Number.isFinite
const capturedNumberIsInteger = Number.isInteger
const capturedNumberIsSafeInteger = Number.isSafeInteger
const capturedNumberMaximumSafeInteger = Number.MAX_SAFE_INTEGER
const capturedMathFloor = Math.floor
const capturedRegExpTest = RegExp.prototype.test
const capturedDateToISOString = Date.prototype.toISOString
const capturedPromiseThen = Promise.prototype.then
const capturedPromiseThenDescriptor = Object.getOwnPropertyDescriptor(
  Promise.prototype,
  'then'
)
const capturedPromiseConstructorDescriptor = Object.getOwnPropertyDescriptor(
  Promise.prototype,
  'constructor'
)
const capturedPromiseSpeciesDescriptor = Object.getOwnPropertyDescriptor(
  Promise,
  Symbol.species
)
const capturedPromiseSpecies = Symbol.species
const capturedWeakSetHas = WeakSet.prototype.has
const capturedWeakSetAdd = WeakSet.prototype.add
const CapturedWeakSet = WeakSet
const CapturedSet = Set
const CapturedMap = Map
const capturedSetHas = Set.prototype.has
const capturedSetAdd = Set.prototype.add
const capturedMapHas = Map.prototype.has
const capturedMapGet = Map.prototype.get
const capturedMapSet = Map.prototype.set
const capturedMapDelete = Map.prototype.delete
const capturedMapClear = Map.prototype.clear
const capturedMapSizeGetter = Object.getOwnPropertyDescriptor(
  Map.prototype,
  'size'
).get

const FACTORY_DEPENDENCY_ERROR =
  'invalidBrowserSyncTransportRuntimeDiagnosticObserverDependencies'
const FOUNDATION_RESULT_TYPE =
  'browser-transport-diagnostic-foundation-run-v1'
const FOUNDATION_PROJECTION_TYPE =
  'browser-transport-diagnostic-foundation-projection'
const FOUNDATION_ERROR_CODE =
  'BROWSER_TRANSPORT_DIAGNOSTIC_FOUNDATION_FAILED'
const FOUNDATION_ERROR_MESSAGE =
  'Die Browser-Transport-Diagnosefoundation ist fehlgeschlagen.'
const EFFECT_PORT_PROFILE = 'adr-0033-foundation-effect-port-v1'
const EFFECT_CAPABILITY_SET = 'clock-cap-send-dequeue-cleanup-v1'
const EVALUATION_SHA256 =
  'a623ffafee8dfcbc1d2ddc374cc35f0dbf800defd97619a3b58337d972090f7b'
const ENDPOINT_URL = 'http://127.0.0.1:8787/api/sync-test'
const TOP_LEVEL_URL = 'http://127.0.0.1:5173/'
const SETUP_WINDOW_MILLISECONDS = 6000
const CAPTURE_WINDOW_MILLISECONDS = 6000
const DURATION_CAP_MILLISECONDS = 60000
const MAX_DEQUEUED_OBSERVATIONS = 128
const MAX_TARGET_INFOS = 128
const MAX_EPHEMERAL_IDENTIFIER_CODE_UNITS = 256
const MAX_CDP_URL_CODE_UNITS = 2048
const MAX_HTTP_METHOD_CODE_UNITS = 16

const LEASE_IDLE = 'idle'
const LEASE_OBSERVABLE_PENDING = 'observable-pending'
const LEASE_SETTLEMENT_UNOBSERVABLE = 'settlement-unobservable'
const LEASE_CLOSED = 'closed'

const RUN_BINDING_KEYS = capturedObjectFreeze([
  'diagnosticRunId',
  'observedAt',
  'timeZone',
  'replayContextId',
  'repositoryCommit',
  'profileInstanceObservation',
  'unexplainedCausalDeviationObservation',
  'replayOperands',
  'viteRuntimeVersionObservation',
])
const FOUNDATION_PROJECTION_KEYS = capturedObjectFreeze([
  'schemaVersion',
  'projectionType',
  'diagnosticRunId',
  'observedAt',
  'timeZone',
  'historicalEvidence',
  'replay',
  'observer',
  'requestBudget',
  'publicSettlement',
  'stages',
  'timing',
  'cleanup',
  'adr0029OverallGate',
  'candidateObserverGate',
  'candidateFinding',
  'causeStatus',
])
const PROFILE_INSTANCE_KEYS = capturedObjectFreeze([
  'newInstanceObserved',
  'historicalInstanceReuseObserved',
])
const CAUSAL_DEVIATION_KEYS = capturedObjectFreeze([
  'reviewCompleted',
  'deviationObserved',
])
const REPLAY_OPERAND_KEYS = capturedObjectFreeze([
  'fieldId',
  'observationState',
  'replayValue',
])
const INTENT_KINDS = capturedObjectFreeze([
  'capability-probe',
  'controller-clock-sample',
  'cap-arm',
  'cap-cancel',
  'protocol-command-send',
  'observation-dequeue',
  'cleanup-step',
])
const PROTOCOL_COMMANDS = capturedObjectFreeze([
  'Target.getTargets',
  'Target.attachToTarget',
  'Network.enable',
  'Runtime.evaluate',
  'Network.disable',
  'Target.detachFromTarget',
])
const INTEGRITY_CHECK_IDS = capturedObjectFreeze([
  'sourceUnmodified',
  'instrumentedSourceCopyAbsent',
  'compositionSeamsAbsent',
  'protocolAllowlistOnly',
  'runtimeSurfaceMutationAbsent',
  'fetchInterceptionAbsent',
  'debuggerBreakpointsAndSteppingAbsent',
  'profilerAndTracingAbsent',
  'responseBodyReadAbsent',
  'freeRawInspectionAbsent',
  'additionalNativeFetchAbsent',
  'observerProductEndpointRequestAbsent',
  'rawPersistenceAbsent',
  'observerDiagnosticDuringRunOutputAbsent',
  'closedPrimitiveProjectionConfirmed',
  'singleTargetAndSessionConfirmed',
  'singleMainWorldEvaluationConfirmed',
])
const CLEANUP_CHECK_IDS = capturedObjectFreeze([
  'cleanupStarted',
  'networkDomainClosed',
  'targetSessionClosed',
  'debugPipeClosed',
  'controllerObservationClosed',
  'browserStopped',
  'devServerStopped',
  'gatewayStopped',
  'profileRemoved',
  'harnessFragmentsRemoved',
  'objectGroupsAbsentOrReleased',
  'rawEventsDiscarded',
  'ephemeralIdentifiersDiscarded',
  'permissionSiteCacheAndServiceWorkerStateCleared',
  'environmentRestored',
  'portsFree',
  'repositoryAndIndexRestored',
  'historicalEvidenceHashUnchanged',
  'observerStorageLogAndTelemetryResidueAbsent',
  'cleanupCompleted',
])
const CLEANUP_STEPS = capturedObjectFreeze([
  capturedObjectFreeze(['debugPipeClosed', 'close-debug-pipe']),
  capturedObjectFreeze(['browserStopped', 'stop-browser']),
  capturedObjectFreeze(['devServerStopped', 'stop-dev-server']),
  capturedObjectFreeze(['gatewayStopped', 'stop-gateway']),
  capturedObjectFreeze(['profileRemoved', 'remove-profile']),
  capturedObjectFreeze(['harnessFragmentsRemoved', 'remove-harness-fragments']),
  capturedObjectFreeze([
    'permissionSiteCacheAndServiceWorkerStateCleared',
    'clear-profile-site-state',
  ]),
  capturedObjectFreeze(['environmentRestored', 'restore-environment']),
  capturedObjectFreeze(['portsFree', 'verify-bound-ports-free']),
  capturedObjectFreeze([
    'repositoryAndIndexRestored',
    'verify-repository-index-restored',
  ]),
  capturedObjectFreeze([
    'historicalEvidenceHashUnchanged',
    'verify-historical-evidence-hash',
  ]),
  capturedObjectFreeze([
    'observerStorageLogAndTelemetryResidueAbsent',
    'verify-observer-residue-absent',
  ]),
])

const STAGE_DEFINITIONS = capturedObjectFreeze([
  capturedObjectFreeze(['observer-armed', 'controller', 'controller-monotonic']),
  capturedObjectFreeze([
    'transport-call-dispatched',
    'javascript-main-world',
    'javascript-main-world',
  ]),
  capturedObjectFreeze([
    'preflight-request-observed',
    'browser-network',
    'browser-network',
  ]),
  capturedObjectFreeze([
    'preflight-204-observed',
    'browser-network',
    'browser-network',
  ]),
  capturedObjectFreeze([
    'post-request-observed',
    'browser-network',
    'browser-network',
  ]),
  capturedObjectFreeze([
    'post-response-200-observed',
    'browser-network',
    'browser-network',
  ]),
  capturedObjectFreeze([
    'post-loading-terminal',
    'browser-network',
    'browser-network',
  ]),
  capturedObjectFreeze([
    'public-promise-settled',
    'javascript-main-world',
    'javascript-main-world',
  ]),
  capturedObjectFreeze(['cleanup-started', 'cleanup', 'controller-monotonic']),
  capturedObjectFreeze(['cleanup-completed', 'cleanup', 'controller-monotonic']),
])

const REPLAY_DEFINITIONS = capturedObjectFreeze([
  ['artifact.transport.src/transports/browserSyncTransport.js.sha256', 'historical-commit-artifact-sha256', '3c41b17e1d80e94e4b05e7c76f019d3fd3af281b451e85c8f90d80fd25391c28', 'H64'],
  ['artifact.contract.src/contracts/syncContract.js.sha256', 'historical-commit-artifact-sha256', '96ad2c52fb4545d6e587d9b3fd86d76a4a735e8cb33e9b572a3d7d5f4e5a6aeb', 'H64'],
  ['artifact.gateway.server/startLocalSyncGateway.js.sha256', 'historical-commit-artifact-sha256', '677be5e9cace926ba0a1f3540e39926f5b5c54dd57440bd1ac53de6f255ca6d5', 'H64'],
  ['artifact.gateway.server/localSyncGatewayRuntimeConfig.js.sha256', 'historical-commit-artifact-sha256', 'e9a4419666e33b57d1ed5712e00f3d954a5b82c1cc7956b9a7582e0462743836', 'H64'],
  ['artifact.gateway.server/localSyncGatewayHttpServer.js.sha256', 'historical-commit-artifact-sha256', '70243e66f85448c23920ea30409a03be7ed349b6868535729f4a798f012fdbb8', 'H64'],
  ['artifact.gateway.src/gateways/syncGatewayRequestBoundary.js.sha256', 'historical-commit-artifact-sha256', 'b1e55f03283bfdd1d35562951503471b4a812ac61868af0b927a05623e597b79', 'H64'],
  ['artifact.gateway.src/agents/syncAgent.js.sha256', 'historical-commit-artifact-sha256', '899e06d3a80925cab8680749d133e9a8d87f30a2fd1d509cf7339eb1c8d65db0', 'H64'],
  ['artifact.frontend.runtime-source-set.sha256', 'historical-commit-artifact-sha256', '6f3d5740b043308b4d38df33b6293c9064d8dd1b3f0c5801d50844336c195591', 'H64'],
  ['repository.state', 'historical-record-value', 'clean', 'STATE'],
  ['hostRuntime.executionClass', 'historical-record-value', 'local-disposable', 'A64'],
  ['operatingSystem.family', 'historical-record-value', 'windows', 'A32'],
  ['operatingSystem.edition', 'historical-record-value', 'Windows 11 Home', 'A64'],
  ['operatingSystem.architecture', 'historical-record-value', 'x64', 'A16'],
  ['operatingSystem.version', 'historical-record-value', '25H2', 'A64'],
  ['operatingSystem.build', 'historical-record-value', '26200', 'A32'],
  ['operatingSystem.patch', 'historical-record-value', '9168', 'A32'],
  ['node.version', 'historical-record-value', '24.19.0', 'S32'],
  ['browser.product', 'historical-record-value', 'chrome', 'A32'],
  ['browser.channel', 'historical-record-value', 'stable', 'A32'],
  ['browser.version', 'historical-record-value', '151.0.7922.174', 'A64'],
  ['browser.engine', 'historical-record-value', 'blink', 'A32'],
  ['browser.engineBuild', 'historical-record-value', '@39c51c70dd5feca6b6aba5bb7997b595011c553d', 'A128'],
  ['browser.executionMode', 'historical-record-value', 'visible', 'A32'],
  ['browser.privateMode', 'historical-record-value', true, 'B'],
  ['profile.lifecycle', 'historical-record-value', 'fresh-disposable', 'A64'],
  ['profile.extensions', 'historical-record-value', 'none', 'A64'],
  ['profile.startParameters', 'historical-record-value', 'effective-non-bypassing', 'A128'],
  ['profile.featureFlags', 'historical-record-value', 'none-effective', 'A128'],
  ['profile.enterprisePolicies', 'historical-record-value', 'none-effective', 'A128'],
  ['networkEnvironment.proxy', 'historical-record-value', 'inactive', 'A32'],
  ['networkEnvironment.vpn', 'historical-record-value', 'inactive', 'A32'],
  ['initialState.serviceWorker', 'historical-record-value', 'absent', 'A64'],
  ['initialState.permission', 'historical-record-value', 'prompt', 'A64'],
  ['initialState.preflightCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['initialState.siteCache', 'historical-record-value', 'empty-confirmed', 'A64'],
  ['bindingComparisonProfile', 'historical-record-value', 'ephemeral-exact-effective-context-comparison-without-retention', 'A128'],
  ['frontend.topLevelUrl', 'historical-record-value', 'http://127.0.0.1:5173/', 'A2048'],
  ['frontend.serializedOrigin', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['frontend.contextKind', 'historical-record-value', 'top-level', 'A32'],
  ['frontend.isSecureContext', 'historical-record-value', true, 'B'],
  ['transportRequest.factoryProfile', 'historical-record-value', 'real-default-factory', 'A64'],
  ['transportRequest.compositionProfile', 'historical-record-value', 'transport-only', 'A64'],
  ['transportRequest.requestProfile', 'historical-record-value', 'synthetic-v1-syncTest-empty-payload', 'A128'],
  ['transportRequest.requestEqualityMethod', 'historical-record-value', 'ephemeral-full-value-comparison-without-retention', 'A128'],
  ['transportRequest.initialUrl', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['transportRequest.initialScheme', 'historical-record-value', 'http', 'A16'],
  ['transportRequest.initialHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['transportRequest.initialPort', 'historical-record-value', 8787, 'P'],
  ['transportRequest.initialPath', 'historical-record-value', '/api/sync-test', 'A1024'],
  ['transportRequest.requestInitProfile', 'historical-record-value', 'adr-0028-fixed', 'A64'],
  ['gateway.listenerHost', 'historical-record-value', '127.0.0.1', 'A256'],
  ['gateway.listenerPort', 'historical-record-value', 8787, 'P'],
  ['gateway.portEnvironmentValue', 'historical-record-value', '"8787"', 'A16'],
  ['gateway.allowedOrigin.value', 'historical-record-value', 'http://127.0.0.1:5173', 'A2048'],
  ['gateway.allowedOrigin.relationToFrontend', 'historical-record-value', 'matches-frontend-origin', 'A64'],
  ['gateway.endpoint', 'historical-record-value', 'http://127.0.0.1:8787/api/sync-test', 'A2048'],
  ['gateway.responderProfile', 'historical-record-value', 'production-gateway', 'A64'],
  ['gateway.responseProfile', 'historical-record-closed-derivation', 'adr-0020-options204-post200-syncresponse-v1', 'A128'],
  ['toolchain.vite.lockfileVersion', 'historical-commit-closed-derivation', '8.1.4', 'S32'],
])
for (let index = 0; index < REPLAY_DEFINITIONS.length; index += 1) {
  capturedObjectFreeze(REPLAY_DEFINITIONS[index])
}

const IDENTIFIER_PATTERN = /^[a-z0-9-]{1,32}$/
const LOWER_HEX_40_PATTERN = /^[0-9a-f]{40}$/
const LOWER_HEX_64_PATTERN = /^[0-9a-f]{64}$/
const CORE_SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/
const HTTP_METHOD_PATTERN = /^[A-Za-z0-9!#$%&'*+\-.^_|~]+$/
const ASCII_MAXIMUM_BY_TYPE = capturedObjectFreeze({
  A16: 16,
  A32: 32,
  A64: 64,
  A128: 128,
  A256: 256,
  A1024: 1024,
  A2048: 2048,
})

const EVALUATION_EXPRESSION = '(async()=>{const A=Reflect.apply,K=Reflect.ownKeys,D=Object.getOwnPropertyDescriptor,G=Object.getPrototypeOf,F=Object.isFrozen,H=Object.hasOwn,O=Object.prototype,N=Number.isFinite,L=Math.floor;const c=(f,e)=>{try{return f()===e?"match":"mismatch"}catch{return"unproven"}};const p={url:{contextResult:c(()=>globalThis.location.href,"http://127.0.0.1:5173/")},origin:{contextResult:c(()=>globalThis.location.origin,"http://127.0.0.1:5173")},topLevel:{contextResult:c(()=>globalThis.top===globalThis,true)},secureContext:{contextResult:c(()=>globalThis.isSecureContext,true)}};const o=(d,f,t,s)=>({preTransportContext:p,execution:{factoryCallCount:f,transportCallCount:t,dispatchState:d},settlement:s});if(p.url.contextResult==="mismatch"||p.origin.contextResult==="mismatch"||p.topLevel.contextResult==="mismatch"||p.secureContext.contextResult==="mismatch")return o("blocked-context-mismatch","zero","zero",null);if(p.url.contextResult==="unproven"||p.origin.contextResult==="unproven"||p.topLevel.contextResult==="unproven"||p.secureContext.contextResult==="unproven")return o("blocked-context-unproven","zero","zero",null);const q=(v,n,x)=>{const d=D(v,n);return d!==undefined&&H(d,"value")&&!H(d,"get")&&!H(d,"set")&&d.enumerable===true&&d.writable===false&&d.configurable===false&&d.value===x};const h=()=>{try{const v=globalThis.performance.now();return typeof v==="number"&&N(v)?v:null}catch{return null}};const z=(a,b)=>{if(a===null||b===null)return{relativeMilliseconds:null,timingState:"unavailable"};const d=b-a;if(typeof d!=="number"||!N(d)||d<0)return{relativeMilliseconds:null,timingState:"unavailable"};return d>=60000?{relativeMilliseconds:60000,timingState:"at-or-above-cap"}:{relativeMilliseconds:10*L(d/10),timingState:"measured"}};const e=v=>{try{if(v===null||typeof v!=="object"||G(v)!==O||!F(v))return false;const k=K(v),a=D(v,"code"),b=D(v,"message");return k.length===2&&k[0]==="code"&&k[1]==="message"&&a!==undefined&&b!==undefined&&H(a,"value")&&H(b,"value")&&!H(a,"get")&&!H(a,"set")&&!H(b,"get")&&!H(b,"set")&&a.enumerable===true&&a.writable===false&&a.configurable===false&&b.enumerable===true&&b.writable===false&&b.configurable===false&&a.value==="BROWSER_SYNC_TRANSPORT_FAILED"&&b.value==="Der lokale Browser-SyncTransport ist fehlgeschlagen."}catch{return false}};let fc="zero",tc="zero",pp,start;try{const m=await import("/src/transports/browserSyncTransport.js");const f=m.createBrowserSyncTransport;if(typeof f!=="function")throw 0;fc="one";const t=A(f,undefined,[]),tk=K(t),sd=D(t,"sendSyncRequest");if(t===null||typeof t!=="object"||G(t)!==O||!F(t)||tk.length!==1||tk[0]!=="sendSyncRequest"||sd===undefined||!H(sd,"value")||H(sd,"get")||H(sd,"set")||sd.enumerable!==true||sd.writable!==false||sd.configurable!==false||typeof sd.value!=="function")throw 0;const send=sd.value,cp=globalThis.crypto,rd=cp.randomUUID;if(typeof rd!=="function")throw 0;const id="req_"+A(rd,cp,[]),ts=new Date().toISOString(),payload=Object.freeze({}),r=Object.freeze({version:"1.0",action:"syncTest",source:"goldendawn-os",requestId:id,timestamp:ts,payload}),rk=K(r),pk=K(payload);if(G(r)!==O||G(payload)!==O||G(O)!==null||!F(r)||!F(payload)||rk.length!==6||rk[0]!=="version"||rk[1]!=="action"||rk[2]!=="source"||rk[3]!=="requestId"||rk[4]!=="timestamp"||rk[5]!=="payload"||pk.length!==0||D(r,"toJSON")!==undefined||D(payload,"toJSON")!==undefined||D(O,"toJSON")!==undefined||!q(r,"version","1.0")||!q(r,"action","syncTest")||!q(r,"source","goldendawn-os")||!q(r,"requestId",id)||!q(r,"timestamp",ts)||!q(r,"payload",payload)||typeof id!=="string"||id.length<5||id.length>64||!/^req_[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)||typeof ts!=="string"||ts.length!==24||new Date(ts).toISOString()!==ts)throw 0;tc="one";start=h();pp=A(send,undefined,[r])}catch{return o("failed-before-public-settlement",fc,tc,null)}let end,outcome,staticProfileResult;try{await pp;end=h();outcome="fulfilled";staticProfileResult="not-applicable"}catch(v){end=h();if(e(v)){outcome="static-redacted-rejection";staticProfileResult="match"}else{outcome="other-rejection";staticProfileResult="mismatch"}}const timing=z(start,end);return o("dispatched","one","one",{outcome,staticProfileResult,relativeMilliseconds:timing.relativeMilliseconds,timingState:timing.timingState})})()'

const machineIdentities = new CapturedWeakSet()

function isOneOf(value, values) {
  for (let index = 0; index < values.length; index += 1) {
    if (value === values[index]) {
      return true
    }
  }
  return false
}

function exactKeys(actual, expected) {
  if (actual.length !== expected.length) {
    return false
  }
  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      return false
    }
  }
  return true
}

function readOwnDataDescriptor(node, key) {
  const descriptor = capturedGetOwnPropertyDescriptor(node, key)
  if (
    descriptor === undefined ||
    descriptor.enumerable !== true ||
    capturedObjectHasOwn(descriptor, 'value') !== true ||
    capturedObjectHasOwn(descriptor, 'get') === true ||
    capturedObjectHasOwn(descriptor, 'set') === true
  ) {
    throw new TypeError('invalidClosedDataProperty')
  }
  return descriptor.value
}

function markClosedForeignNode(visited, node) {
  if (visited === undefined || visited === null) {
    return
  }
  if (capturedReflectApply(capturedWeakSetHas, visited, [node])) {
    throw new TypeError('aliasedClosedNode')
  }
  capturedReflectApply(capturedWeakSetAdd, visited, [node])
}

function defineArrayElement(array, index, value) {
  capturedDefineProperty(array, CapturedString(index), {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  })
}

function readClosedRecord(node, keys, visited) {
  if (typeof node !== 'object' || node === null) {
    throw new TypeError('invalidClosedRecord')
  }
  markClosedForeignNode(visited, node)
  if (capturedArrayIsArray(node) !== false) {
    throw new TypeError('invalidClosedRecord')
  }
  if (capturedGetPrototypeOf(node) !== capturedObjectPrototype) {
    throw new TypeError('invalidClosedRecord')
  }
  const ownKeys = capturedReflectOwnKeys(node)
  if (!exactKeys(ownKeys, keys)) {
    throw new TypeError('invalidClosedRecord')
  }
  const values = new CapturedArray(keys.length)
  for (let index = 0; index < keys.length; index += 1) {
    defineArrayElement(values, index, readOwnDataDescriptor(node, keys[index]))
  }
  return values
}

function readClosedArray(node, expectedLength, visited) {
  if (typeof node !== 'object' || node === null) {
    throw new TypeError('invalidClosedArray')
  }
  markClosedForeignNode(visited, node)
  if (capturedArrayIsArray(node) !== true) {
    throw new TypeError('invalidClosedArray')
  }
  if (capturedGetPrototypeOf(node) !== capturedArrayPrototype) {
    throw new TypeError('invalidClosedArray')
  }
  const ownKeys = capturedReflectOwnKeys(node)
  if (ownKeys.length !== expectedLength + 1) {
    throw new TypeError('invalidClosedArray')
  }
  for (let index = 0; index < expectedLength; index += 1) {
    if (ownKeys[index] !== CapturedString(index)) {
      throw new TypeError('invalidClosedArray')
    }
  }
  if (ownKeys[expectedLength] !== 'length') {
    throw new TypeError('invalidClosedArray')
  }
  const lengthDescriptor = capturedGetOwnPropertyDescriptor(node, 'length')
  if (
    lengthDescriptor === undefined ||
    capturedObjectHasOwn(lengthDescriptor, 'value') !== true ||
    lengthDescriptor.value !== expectedLength ||
    lengthDescriptor.enumerable !== false ||
    lengthDescriptor.writable !== true ||
    lengthDescriptor.configurable !== false
  ) {
    throw new TypeError('invalidClosedArray')
  }
  const values = new CapturedArray(expectedLength)
  for (let index = 0; index < expectedLength; index += 1) {
    defineArrayElement(
      values,
      index,
      readOwnDataDescriptor(node, CapturedString(index))
    )
  }
  return values
}

function deepFreezeGenerated(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }
  const keys = capturedReflectOwnKeys(value)
  for (let index = 0; index < keys.length; index += 1) {
    const descriptor = capturedGetOwnPropertyDescriptor(value, keys[index])
    if (
      descriptor !== undefined &&
      capturedObjectHasOwn(descriptor, 'value') === true
    ) {
      deepFreezeGenerated(descriptor.value)
    }
  }
  return capturedObjectFreeze(value)
}

function isPrintableAscii(value, maximum) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maximum) {
    return false
  }
  for (let index = 0; index < value.length; index += 1) {
    const code = capturedReflectApply(capturedStringCharCodeAt, value, [index])
    if (code < 0x20 || code > 0x7e) {
      return false
    }
  }
  return true
}

function testPattern(pattern, value) {
  return capturedReflectApply(capturedRegExpTest, pattern, [value])
}

function isCoreSemver(value) {
  return (
    isPrintableAscii(value, 32) &&
    testPattern(CORE_SEMVER_PATTERN, value) === true
  )
}

function isTimeZone(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 64) {
    return false
  }
  if (value === 'UTC') {
    return true
  }
  let componentCount = 1
  let atComponentStart = true
  for (let index = 0; index < value.length; index += 1) {
    const code = capturedReflectApply(capturedStringCharCodeAt, value, [index])
    if (code === 0x2f) {
      if (atComponentStart) {
        return false
      }
      componentCount += 1
      atComponentStart = true
      continue
    }
    const letter =
      (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)
    if (atComponentStart) {
      if (!letter) {
        return false
      }
      atComponentStart = false
      continue
    }
    const digit = code >= 0x30 && code <= 0x39
    if (!letter && !digit && code !== 0x2e && code !== 0x5f && code !== 0x2b && code !== 0x2d) {
      return false
    }
  }
  return componentCount >= 2 && atComponentStart === false
}

function isCanonicalUtcTimestamp(value) {
  if (
    typeof value !== 'string' ||
    value.length !== 24 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [4]) !== 0x2d ||
    capturedReflectApply(capturedStringCharCodeAt, value, [7]) !== 0x2d ||
    capturedReflectApply(capturedStringCharCodeAt, value, [10]) !== 0x54 ||
    capturedReflectApply(capturedStringCharCodeAt, value, [13]) !== 0x3a ||
    capturedReflectApply(capturedStringCharCodeAt, value, [16]) !== 0x3a ||
    capturedReflectApply(capturedStringCharCodeAt, value, [19]) !== 0x2e ||
    capturedReflectApply(capturedStringCharCodeAt, value, [23]) !== 0x5a
  ) {
    return false
  }
  for (let index = 0; index < value.length; index += 1) {
    if (
      index === 4 || index === 7 || index === 10 || index === 13 ||
      index === 16 || index === 19 || index === 23
    ) {
      continue
    }
    const code = capturedReflectApply(capturedStringCharCodeAt, value, [index])
    if (code < 0x30 || code > 0x39) {
      return false
    }
  }
  try {
    const date = new CapturedDate(value)
    return capturedReflectApply(capturedDateToISOString, date, []) === value
  } catch {
    return false
  }
}

function isReplayScalar(value, type) {
  if (type === 'H64') {
    return typeof value === 'string' && testPattern(LOWER_HEX_64_PATTERN, value)
  }
  if (type === 'B') {
    return typeof value === 'boolean'
  }
  if (type === 'P') {
    return capturedNumberIsSafeInteger(value) && value >= 0 && value <= 65535
  }
  if (type === 'S32') {
    return isCoreSemver(value)
  }
  if (type === 'STATE') {
    return value === 'clean' || value === 'dirty' || value === 'unknown'
  }
  if (typeof type === 'string' && capturedObjectHasOwn(ASCII_MAXIMUM_BY_TYPE, type)) {
    return isPrintableAscii(value, ASCII_MAXIMUM_BY_TYPE[type])
  }
  return false
}

function copyRunBinding(untrusted, existingVisited) {
  const visited = existingVisited === undefined ? new CapturedWeakSet() : existingVisited
  const root = readClosedRecord(untrusted, RUN_BINDING_KEYS, visited)
  const diagnosticRunId = root[0]
  const observedAt = root[1]
  const timeZone = root[2]
  const replayContextId = root[3]
  const repositoryCommit = root[4]
  if (
    typeof diagnosticRunId !== 'string' ||
    !testPattern(IDENTIFIER_PATTERN, diagnosticRunId) ||
    !isCanonicalUtcTimestamp(observedAt) ||
    !isTimeZone(timeZone) ||
    typeof replayContextId !== 'string' ||
    !testPattern(IDENTIFIER_PATTERN, replayContextId) ||
    replayContextId === 'chrome-stable-win-t0-01' ||
    typeof repositoryCommit !== 'string' ||
    !testPattern(LOWER_HEX_40_PATTERN, repositoryCommit)
  ) {
    throw new TypeError('invalidRunBinding')
  }

  const profileValues = readClosedRecord(root[5], PROFILE_INSTANCE_KEYS, visited)
  const deviationValues = readClosedRecord(root[6], CAUSAL_DEVIATION_KEYS, visited)
  for (let index = 0; index < profileValues.length; index += 1) {
    if (profileValues[index] !== null && typeof profileValues[index] !== 'boolean') {
      throw new TypeError('invalidRunBinding')
    }
  }
  for (let index = 0; index < deviationValues.length; index += 1) {
    if (deviationValues[index] !== null && typeof deviationValues[index] !== 'boolean') {
      throw new TypeError('invalidRunBinding')
    }
  }
  if (profileValues[0] === true && profileValues[1] === true) {
    throw new TypeError('invalidRunBinding')
  }
  if (deviationValues[0] === false && deviationValues[1] === true) {
    throw new TypeError('invalidRunBinding')
  }

  const replayNodes = readClosedArray(root[7], REPLAY_DEFINITIONS.length, visited)
  const replayOperands = new CapturedArray(REPLAY_DEFINITIONS.length)
  for (let index = 0; index < REPLAY_DEFINITIONS.length; index += 1) {
    const values = readClosedRecord(replayNodes[index], REPLAY_OPERAND_KEYS, visited)
    const definition = REPLAY_DEFINITIONS[index]
    if (values[0] !== definition[0] || !isOneOf(values[1], ['observed', 'not-observed', 'ambiguous'])) {
      throw new TypeError('invalidRunBinding')
    }
    if (values[1] === 'observed') {
      if (values[2] === null || !isReplayScalar(values[2], definition[3])) {
        throw new TypeError('invalidRunBinding')
      }
    } else if (values[2] !== null) {
      throw new TypeError('invalidRunBinding')
    }
    defineArrayElement(replayOperands, index, {
      fieldId: values[0],
      observationState: values[1],
      replayValue: values[2],
    })
  }

  const viteRuntimeVersionObservation = root[8]
  if (
    viteRuntimeVersionObservation !== null &&
    !isCoreSemver(viteRuntimeVersionObservation)
  ) {
    throw new TypeError('invalidRunBinding')
  }

  return deepFreezeGenerated({
    diagnosticRunId,
    observedAt,
    timeZone,
    replayContextId,
    repositoryCommit,
    profileInstanceObservation: {
      newInstanceObserved: profileValues[0],
      historicalInstanceReuseObserved: profileValues[1],
    },
    unexplainedCausalDeviationObservation: {
      reviewCompleted: deviationValues[0],
      deviationObserved: deviationValues[1],
    },
    replayOperands,
    viteRuntimeVersionObservation,
  })
}

function createLocalResolvedPromise(value) {
  let localResolve
  const promise = new CapturedPromise(function captureLocalResolve(resolve) {
    localResolve = resolve
  })
  capturedReflectApply(localResolve, undefined, [value])
  return promise
}

function createFoundationErrorResult() {
  const error = deepFreezeGenerated({
    code: FOUNDATION_ERROR_CODE,
    message: FOUNDATION_ERROR_MESSAGE,
  })
  const result = capturedObjectCreate(null)
  result.ok = false
  result.resultType = FOUNDATION_RESULT_TYPE
  result.evidenceStatus = 'NOT_EVIDENCE'
  result.runtimeAuthorized = false
  result.persistenceAuthorized = false
  result.recordProjection = null
  result.error = error
  const frozenResult = deepFreezeGenerated(result)
  assertFoundationResultSchema(frozenResult)
  return frozenResult
}

function createFoundationSuccessResult(projection) {
  const result = capturedObjectCreate(null)
  result.ok = true
  result.resultType = FOUNDATION_RESULT_TYPE
  result.evidenceStatus = 'NOT_EVIDENCE'
  result.runtimeAuthorized = false
  result.persistenceAuthorized = false
  result.recordProjection = projection
  result.error = null
  const frozenResult = deepFreezeGenerated(result)
  assertFoundationResultSchema(frozenResult)
  return frozenResult
}

function deriveCandidateObserverGate(input) {
  if (arguments.length !== 1) {
    throw new TypeError('invalidCandidateGateInput')
  }
  const values = readClosedRecord(
    input,
    ['hardViolation', 'proofIncomplete'],
    new CapturedWeakSet()
  )
  if (typeof values[0] !== 'boolean' || typeof values[1] !== 'boolean') {
    throw new TypeError('invalidCandidateGateInput')
  }
  if (values[0] === true) {
    return 'FAIL'
  }
  return values[1] === true ? 'UNPROVEN' : 'PASS'
}

function deriveCandidateFinding(input) {
  if (arguments.length !== 1) {
    throw new TypeError('invalidCandidateFindingInput')
  }
  const values = readClosedRecord(input, [
    'candidateObserverGate',
    'replayResult',
    'stimulusCount',
    'requestSequence',
    'settlementOutcome',
    'settlementStaticProfileResult',
  ], new CapturedWeakSet())
  if (
    !isOneOf(values[0], ['FAIL', 'UNPROVEN', 'PASS']) ||
    !isOneOf(values[1], ['EQUIVALENT', 'DIVERGED', 'UNPROVEN']) ||
    !isOneOf(values[2], ['zero', 'one', 'multiple', 'unknown']) ||
    !isOneOf(values[3], [
      'OPTIONS-204-POST-200-loadingFinished',
      'other',
      'incomplete',
      'ambiguous',
    ]) ||
    !isOneOf(values[4], [
      'fulfilled',
      'static-redacted-rejection',
      'other-rejection',
      'unknown',
    ]) ||
    !isOneOf(values[5], ['match', 'mismatch', 'unproven', 'not-applicable'])
  ) {
    throw new TypeError('invalidCandidateFindingInput')
  }
  if (values[0] === 'FAIL') {
    return 'observer-invalid'
  }
  if (values[0] === 'UNPROVEN') {
    return 'inconclusive'
  }
  if (values[1] !== 'EQUIVALENT' || values[2] !== 'one') {
    return 'inconclusive'
  }
  if (values[3] !== 'OPTIONS-204-POST-200-loadingFinished') {
    return values[3] === 'other' ? 'network-signature-diverged' : 'inconclusive'
  }
  if (values[4] === 'static-redacted-rejection' && values[5] === 'match') {
    return 'static-rejection-reproduced-after-http200'
  }
  if (values[4] === 'fulfilled' && values[5] === 'not-applicable') {
    return 'original-failure-not-reproduced'
  }
  return 'inconclusive'
}

function createInitialStages() {
  const stages = new CapturedArray(STAGE_DEFINITIONS.length)
  for (let index = 0; index < STAGE_DEFINITIONS.length; index += 1) {
    const definition = STAGE_DEFINITIONS[index]
    defineArrayElement(stages, index, {
      stageId: definition[0],
      layer: definition[1],
      observationState: 'not-observed',
      receiptOrder: null,
      result: 'unproven',
      clockDomain: definition[2],
      relativeMilliseconds: null,
      timingState: 'unavailable',
    })
  }
  return stages
}

function createInitialOperationLedger() {
  const ledger = capturedObjectCreate(null)
  for (let index = 0; index < PROTOCOL_COMMANDS.length; index += 1) {
    ledger[PROTOCOL_COMMANDS[index]] = {
      intentCount: 0,
      ackCount: 0,
      sendUnknown: false,
      safelyGated: index === 0 ? false : true,
    }
  }
  return ledger
}

function createBrowserSyncTransportRuntimeDiagnosticRunMachine(input) {
  let inputValues
  try {
    if (arguments.length !== 1) {
      throw new TypeError('invalidRunMachineArity')
    }
    inputValues = readClosedRecord(
      input,
      ['activeExchange', 'activeObservationClosed', 'runBinding'],
      new CapturedWeakSet()
    )
  } catch {
    throw new TypeError('invalidRunMachineInput')
  }
  if (
    typeof inputValues[0] !== 'function' ||
    typeof inputValues[1] !== 'function' ||
    inputValues[2] === null ||
    typeof inputValues[2] !== 'object'
  ) {
    throw new TypeError('invalidRunMachineInput')
  }
  let ownerResolve
  const ownerRunPromise = new CapturedPromise(function captureOwnerResolve(resolve) {
    ownerResolve = resolve
  })
  const machine = {
    ownerRunPromise,
    ownerResolve,
    ownerTerminalCallback: null,
    runState: 'active',
    activeRunToken: 1,
    attemptStarted: false,
    phase: 'prestart',
    lease: LEASE_IDLE,
    activeExchange: inputValues[0],
    activeObservationClosed: inputValues[1],
    observationNotificationState: 'armed',
    observationNotificationViolation: false,
    nextExchangeRequestProfile: null,
    nextExchangeContext: null,
    activeExchangeRequestProfile: null,
    activeExchangeContext: null,
    activeExchangeToken: 0,
    activeExchangePromiseCandidate: null,
    portState: 'open',
    pendingInternalExchangeViolation: false,
    intentCount: 0,
    nextIntentId: 1,
    portCallCount: 0,
    protocolSendCount: 0,
    capabilityCallCount: 0,
    currentExchangeCount: 0,
    furtherExchangeCount: 'unbounded',
    runSettlementCount: 0,
    preCleanupObservationSnapshot: null,
    cleanupLedger: null,
    cleanupViolation: false,
    cleanupFinalizeReason: null,
    capStates: { setup: 'absent', capture: 'absent', cleanup: 'absent' },
    capArmIntentIds: { setup: null, capture: null, cleanup: null },
    capCancelAttempted: { setup: false, capture: false, cleanup: false },
    runBinding: inputValues[2],
    nextCommandId: 1,
    operationLedger: createInitialOperationLedger(),
    completedCommandIds: new CapturedMap(),
    openCommandIds: new CapturedMap(),
    outstandingCommand: null,
    setupStep: 'not-started',
    setupReady: false,
    mSetup: null,
    setupDeadline: null,
    mCleanup: null,
    cleanupDeadline: null,
    lastControllerClock: null,
    heldDequeuedObservation: null,
    heldDequeuePhase: null,
    dequeuedObservationCount: 0,
    closeClass: null,
    observationCloseReason: null,
    captureWindowState: 'not-started',
    stages: createInitialStages(),
    receiptOrders: { controller: 0, 'javascript-main-world': 0, 'browser-network': 0, cleanup: 0 },
    targetProfile: 'unknown',
    targetId: null,
    sessionId: null,
    cdpConnectionClosed: false,
    evaluateCommandId: null,
    evaluateIntentCount: 0,
    evaluateReplyCountClass: 'zero',
    evaluateReplyRoutingUnknown: false,
    mainWorldEvaluationCount: 'zero',
    acceptedMainWorldValue: null,
    derivedFactoryCallCount: 'zero',
    derivedTransportCallCount: 'zero',
    publicSettlement: null,
    preflightRequestId: null,
    postRequestId: null,
    endpointOptionsCount: 0,
    endpointPostsCount: 0,
    endpointOtherMethodsCount: 0,
    endpointAttributionAmbiguous: false,
    networkCountsUnknown: false,
    networkSequenceOther: false,
    postTerminalKind: null,
    firstEndpointRequestTimestamp: null,
    lastValidBrowserNetworkTimestamp: null,
    productEvidenceComplete: false,
    targetBindingContradiction: false,
    requestBudgetFinalized: false,
    stickyViolation: false,
    cleanupInitialViolation: false,
    cleanupStepIndex: 0,
    cleanupPurpose: null,
    cleanupPendingCheckId: null,
    cleanupChecks: null,
    cleanupExternalStarted: false,
    cleanupProtocolSendsFinished: false,
    cleanupDisableAttempted: false,
    cleanupDetachAttempted: false,
    cleanupSessionId: null,
    cleanupCompletionClockRequested: false,
  }
  capturedReflectApply(capturedWeakSetAdd, machineIdentities, [machine])
  prepareExchange(machine, 'prestart', 'capability-probe', {
    profile: EFFECT_PORT_PROFILE,
  }, { type: 'capability-probe' })
  return machine
}

function prepareExchange(machine, phase, intentKind, payload, context) {
  const frozenPayload = deepFreezeGenerated(payload)
  const profile = deepFreezeGenerated({ phase, intentKind, payload: frozenPayload })
  machine.phase = phase
  machine.nextExchangeRequestProfile = profile
  machine.nextExchangeContext = context
  return profile
}

function invokePreparedExchange(machine) {
  const profile = machine.nextExchangeRequestProfile
  requestBrowserSyncTransportRuntimeDiagnosticExchange(machine, profile)
}

function samePropertyDescriptor(left, right) {
  if (left === undefined || right === undefined) {
    return left === right
  }
  return (
    left.value === right.value &&
    left.get === right.get &&
    left.set === right.set &&
    left.writable === right.writable &&
    left.enumerable === right.enumerable &&
    left.configurable === right.configurable
  )
}

function validateExchangePromise(candidate) {
  const ownKeys = capturedReflectOwnKeys(candidate)
  if (ownKeys.length !== 0) {
    throw new TypeError('invalidExchangePromise')
  }
  if (capturedGetPrototypeOf(candidate) !== capturedPromisePrototype) {
    throw new TypeError('invalidExchangePromise')
  }
  const liveConstructor = capturedGetOwnPropertyDescriptor(
    capturedPromisePrototype,
    'constructor'
  )
  const liveSpecies = capturedGetOwnPropertyDescriptor(
    CapturedPromise,
    capturedPromiseSpecies
  )
  const liveThen = capturedGetOwnPropertyDescriptor(capturedPromisePrototype, 'then')
  if (
    !samePropertyDescriptor(liveConstructor, capturedPromiseConstructorDescriptor) ||
    !samePropertyDescriptor(liveSpecies, capturedPromiseSpeciesDescriptor) ||
    !samePropertyDescriptor(liveThen, capturedPromiseThenDescriptor)
  ) {
    throw new TypeError('invalidExchangePromise')
  }
}

function requestBrowserSyncTransportRuntimeDiagnosticExchange(machine, profile) {
  if (arguments.length !== 2) {
    return undefined
  }
  if (
    typeof machine !== 'object' ||
    machine === null ||
    capturedReflectApply(capturedWeakSetHas, machineIdentities, [machine]) !== true
  ) {
    return undefined
  }

  if (machine.observationNotificationState === 'invoking') {
    machine.observationNotificationViolation = true
    return undefined
  }

  if (machine.lease === LEASE_OBSERVABLE_PENDING) {
    if (machine.pendingInternalExchangeViolation === false) {
      machine.pendingInternalExchangeViolation = machine.preCleanupObservationSnapshot === null
        ? (machine.attemptStarted ? 'observation' : 'prestart')
        : 'cleanup'
    }
    return undefined
  }

  if (
    machine.lease !== LEASE_IDLE ||
    machine.portState !== 'open' ||
    machine.activeExchange === null ||
    profile !== machine.nextExchangeRequestProfile
  ) {
    return undefined
  }

  const phase = profile.phase
  const intentKind = profile.intentKind
  const payload = profile.payload
  if (
    !isOneOf(phase, ['prestart', 'observation', 'cleanup']) ||
    !isOneOf(intentKind, INTENT_KINDS)
  ) {
    handleInternalControlFailure(machine)
    return undefined
  }

  const intentId = machine.nextIntentId
  const intent = deepFreezeGenerated({ intentId, kind: intentKind, payload })
  const context = machine.nextExchangeContext
  machine.nextIntentId += 1
  machine.intentCount += 1
  machine.nextExchangeRequestProfile = null
  machine.nextExchangeContext = null
  machine.activeExchangeRequestProfile = profile
  machine.activeExchangeContext = context
  machine.activeExchangeToken = intentId
  machine.currentExchangeCount = 1
  machine.lease = LEASE_OBSERVABLE_PENDING
  if (intentKind === 'protocol-command-send') {
    const operation = machine.operationLedger[payload.command]
    operation.intentCount += 1
    operation.safelyGated = false
    if (payload.command === 'Runtime.evaluate') {
      machine.evaluateIntentCount += 1
    }
  }
  if (intentKind === 'cap-arm') {
    machine.capArmIntentIds[payload.capKind] = intentId
  }

  let candidate
  try {
    machine.portCallCount += 1
    machine.capabilityCallCount += 1
    candidate = capturedReflectApply(machine.activeExchange, undefined, [intent])
    validateExchangePromise(candidate)
  } catch {
    handleUnobservableExchange(machine, context)
    return undefined
  }

  function controlledFulfillment(value) {
    if (
      machine.activeRunToken !== 1 ||
      machine.lease !== LEASE_OBSERVABLE_PENDING ||
      machine.activeExchangeToken !== intentId
    ) {
      return undefined
    }
    if (machine.pendingInternalExchangeViolation !== false) {
      closePendingInternalExchangeJoin(machine)
      return undefined
    }
    releaseObservedExchange(machine)
    try {
      handleExchangeFulfillment(machine, context, value)
    } catch {
      try {
        handleMalformedFulfillment(machine, context)
      } catch {
        forceControlledHandlerFailure(machine)
      }
    }
    return undefined
  }

  function controlledRejection() {
    if (
      machine.activeRunToken !== 1 ||
      machine.lease !== LEASE_OBSERVABLE_PENDING ||
      machine.activeExchangeToken !== intentId
    ) {
      return undefined
    }
    if (machine.pendingInternalExchangeViolation !== false) {
      closePendingInternalExchangeJoin(machine)
      return undefined
    }
    releaseObservedExchange(machine)
    try {
      handleExchangeRejection(machine, context)
    } catch {
      forceControlledHandlerFailure(machine)
    }
    return undefined
  }

  machine.activeExchangePromiseCandidate = candidate
  try {
    capturedReflectApply(capturedPromiseThen, candidate, [
      controlledFulfillment,
      controlledRejection,
    ])
  } catch {
    handleUnobservableExchange(machine, context)
  }
  return undefined
}

function releaseObservedExchange(machine) {
  machine.lease = LEASE_IDLE
  machine.currentExchangeCount = 0
  if (machine.activeExchangePromiseCandidate !== null) {
    machine.activeExchangePromiseCandidate = null
  }
  machine.activeExchangeRequestProfile = null
  machine.activeExchangeContext = null
  machine.activeExchangeToken = 0
}

function markLiveCapsTerminalUnknown(machine) {
  const capKinds = ['setup', 'capture', 'cleanup']
  for (let index = 0; index < capKinds.length; index += 1) {
    const capKind = capKinds[index]
    if (isOneOf(machine.capStates[capKind], [
      'arm-pending',
      'armed',
      'pending-activation',
      'active',
      'activation-unknown',
      'cancel-pending',
    ])) {
      machine.capStates[capKind] = 'terminal-unknown'
    }
  }
}

function closePortAndLease(machine) {
  machine.lease = LEASE_CLOSED
  machine.portState = 'closed'
  if (machine.activeExchange !== null) {
    machine.activeExchange = null
  }
  if (machine.activeExchangePromiseCandidate !== null) {
    machine.activeExchangePromiseCandidate = null
  }
  machine.activeExchangeRequestProfile = null
  machine.activeExchangeContext = null
  machine.activeExchangeToken = 0
  machine.currentExchangeCount = 0
  machine.furtherExchangeCount = 'zero'
  machine.heldDequeuedObservation = null
  machine.heldDequeuePhase = null
  markLiveCapsTerminalUnknown(machine)
}

function forceControlledHandlerFailure(machine) {
  closePortAndLease(machine)
  if (!machine.attemptStarted) {
    settleMachineWithError(machine)
    return
  }
  if (machine.preCleanupObservationSnapshot === null) {
    machine.stickyViolation = true
    machine.closeClass = 'V'
    machine.observationCloseReason = 'confirmed-violation'
    machine.captureWindowState = machine.evaluateIntentCount === 0
      ? 'not-started'
      : 'truncated'
    freezeObservationSnapshot(machine)
    initializeCleanupLedger(machine)
  }
  machine.cleanupViolation = true
  finalizeCleanupPortlessly(machine)
}

function closePendingInternalExchangeJoin(machine) {
  const joinPhase = machine.pendingInternalExchangeViolation
  closePortAndLease(machine)
  if (joinPhase === 'prestart') {
    settleMachineWithError(machine)
    return
  }
  if (joinPhase === 'observation') {
    machine.stickyViolation = true
    machine.closeClass = 'V'
    machine.observationCloseReason = 'confirmed-violation'
    machine.captureWindowState = machine.evaluateIntentCount === 0
      ? 'not-started'
      : 'truncated'
    freezeObservationSnapshot(machine)
    initializeCleanupLedger(machine)
    finalizeCleanupPortlessly(machine)
    return
  }
  machine.cleanupViolation = true
  if (machine.cleanupLedger !== null) {
    machine.cleanupLedger.cleanupViolation = true
  }
  finalizeCleanupPortlessly(machine)
}

function handleUnobservableExchange(machine, context) {
  if (
    context !== null && context !== undefined &&
    context.type === 'protocol-command-send'
  ) {
    const operation = machine.operationLedger[context.command]
    operation.sendUnknown = true
    if (context.command === 'Runtime.evaluate') {
      applyEvaluateSendFailureProjection(machine)
    }
  }
  machine.lease = LEASE_SETTLEMENT_UNOBSERVABLE
  closePortAndLease(machine)
  if (context !== null && context !== undefined && context.capKind !== undefined) {
    const state = machine.capStates[context.capKind]
    if (isOneOf(state, ['arm-pending', 'cancel-pending', 'pending-activation', 'active', 'armed'])) {
      machine.capStates[context.capKind] = 'terminal-unknown'
    }
  }
  if (!machine.attemptStarted) {
    settleMachineWithError(machine)
    return
  }
  if (machine.preCleanupObservationSnapshot === null) {
    machine.stickyViolation = true
    machine.closeClass = 'V'
    machine.observationCloseReason = 'confirmed-violation'
    machine.captureWindowState = machine.evaluateIntentCount === 0
      ? 'not-started'
      : 'truncated'
    freezeObservationSnapshot(machine)
    initializeCleanupLedger(machine)
    finalizeCleanupPortlessly(machine)
    return
  }
  machine.cleanupViolation = true
  finalizeCleanupPortlessly(machine)
}

function handleInternalControlFailure(machine) {
  if (!machine.attemptStarted) {
    closePortAndLease(machine)
    settleMachineWithError(machine)
    return
  }
  if (machine.preCleanupObservationSnapshot === null) {
    machine.stickyViolation = true
    beginObservationClosure(machine, 'V', 'confirmed-violation', false)
    return
  }
  machine.cleanupViolation = true
  machine.cleanupFinalizeReason = 'cleanup-terminal-failure'
  finalizeCleanupPortlessly(machine)
}

function settleMachineWithError(machine) {
  if (machine.runSettlementCount !== 0) {
    return
  }
  const result = createFoundationErrorResult()
  closePortAndLease(machine)
  clearEphemeralMachineState(machine)
  machine.runSettlementCount = 1
  machine.runState = 'terminal'
  machine.activeRunToken = null
  machine.lease = LEASE_CLOSED
  machine.currentExchangeCount = 0
  const resolve = machine.ownerResolve
  machine.ownerResolve = null
  if (typeof machine.ownerTerminalCallback === 'function') {
    const callback = machine.ownerTerminalCallback
    machine.ownerTerminalCallback = null
    capturedReflectApply(callback, undefined, [])
  }
  capturedReflectApply(resolve, undefined, [result])
}

function settleMachineWithProjection(machine) {
  if (machine.runSettlementCount !== 0) {
    return
  }
  try {
    const projection = createFoundationProjection(machine)
    const result = createFoundationSuccessResult(projection)
    machine.runSettlementCount = 1
    machine.runState = 'terminal'
    machine.activeRunToken = null
    machine.lease = LEASE_CLOSED
    machine.currentExchangeCount = 0
    machine.portState = 'closed'
    clearEphemeralMachineState(machine)
    const resolve = machine.ownerResolve
    machine.ownerResolve = null
    if (typeof machine.ownerTerminalCallback === 'function') {
      const callback = machine.ownerTerminalCallback
      machine.ownerTerminalCallback = null
      capturedReflectApply(callback, undefined, [])
    }
    capturedReflectApply(resolve, undefined, [result])
  } catch {
    settleMachineWithError(machine)
  }
}

function clearEphemeralMachineState(machine) {
  if (machine.activeObservationClosed !== null) {
    machine.activeObservationClosed = null
  }
  if (
    machine.preCleanupObservationSnapshot === null &&
    machine.observationNotificationState === 'armed'
  ) {
    machine.observationNotificationState = 'discarded'
  }
  machine.heldDequeuedObservation = null
  machine.heldDequeuePhase = null
  machine.targetId = null
  machine.sessionId = null
  machine.preflightRequestId = null
  machine.postRequestId = null
  machine.evaluateCommandId = null
  machine.cleanupSessionId = null
  machine.outstandingCommand = null
  machine.nextExchangeRequestProfile = null
  machine.nextExchangeContext = null
  machine.activeExchangeRequestProfile = null
  machine.activeExchangeContext = null
  machine.activeExchangeToken = 0
  machine.capArmIntentIds.setup = null
  machine.capArmIntentIds.capture = null
  machine.capArmIntentIds.cleanup = null
  capturedReflectApply(capturedMapClear, machine.completedCommandIds, [])
  capturedReflectApply(capturedMapClear, machine.openCommandIds, [])
  machine.runBinding = null
}

function requestClockSample(machine, phase, reason, continuation) {
  let capKind = 'setup'
  if (
    reason === 'cleanup-origin' ||
    reason === 'cleanup-dequeue-before-reflection' ||
    reason === 'cleanup-completion-after-cap-cancel'
  ) {
    capKind = 'cleanup'
  } else if (reason === 'capture-dequeue-before-reflection') {
    capKind = 'capture'
  }
  prepareExchange(machine, phase, 'controller-clock-sample', { reason }, {
    type: 'clock-sample',
    reason,
    continuation,
    capKind,
  })
  invokePreparedExchange(machine)
}

function requestCapArm(machine, capKind, deadlineMilliseconds) {
  let payload
  if (capKind === 'capture') {
    payload = {
      capKind: 'capture',
      mode: 'pending-send-activation',
      windowMilliseconds: CAPTURE_WINDOW_MILLISECONDS,
    }
  } else {
    payload = {
      capKind,
      mode: 'absolute-controller-monotonic',
      deadlineMilliseconds,
    }
  }
  machine.capStates[capKind] = 'arm-pending'
  prepareExchange(machine, capKind === 'setup' ? 'prestart' : machine.phase, 'cap-arm', payload, {
    type: 'cap-arm',
    capKind,
  })
  invokePreparedExchange(machine)
}

function requestCapCancel(machine, capKind, purpose) {
  if (
    machine.capCancelAttempted[capKind] ||
    machine.capArmIntentIds[capKind] === null ||
    machine.portState !== 'open' ||
    machine.lease !== LEASE_IDLE
  ) {
    return false
  }
  machine.capCancelAttempted[capKind] = true
  machine.capStates[capKind] = 'cancel-pending'
  prepareExchange(machine, machine.phase, 'cap-cancel', {
    capKind,
    armIntentId: machine.capArmIntentIds[capKind],
  }, {
    type: 'cap-cancel',
    capKind,
    purpose,
    armIntentId: machine.capArmIntentIds[capKind],
  })
  invokePreparedExchange(machine)
  return true
}

function requestProtocolCommand(machine, command) {
  const commandId = machine.nextCommandId
  machine.nextCommandId += 1
  let sessionId = null
  let captureArmIntentId = null
  let params
  if (command === 'Target.getTargets') {
    params = {}
  } else if (command === 'Target.attachToTarget') {
    params = { targetId: machine.targetId, flatten: true }
  } else if (command === 'Network.enable') {
    sessionId = machine.sessionId
    params = {}
  } else if (command === 'Runtime.evaluate') {
    sessionId = machine.sessionId
    captureArmIntentId = machine.capArmIntentIds.capture
    params = {
      expression: EVALUATION_EXPRESSION,
      awaitPromise: true,
      returnByValue: true,
      generatePreview: false,
    }
    machine.evaluateCommandId = commandId
  } else if (command === 'Network.disable') {
    sessionId = machine.cleanupSessionId
    params = {}
  } else {
    params = { sessionId: machine.cleanupSessionId }
  }
  prepareExchange(machine, machine.phase, 'protocol-command-send', {
    commandId,
    command,
    sessionId,
    captureArmIntentId,
    params,
  }, {
    type: 'protocol-command-send',
    command,
    commandId,
    capKind: command === 'Runtime.evaluate'
      ? 'capture'
      : (machine.phase === 'cleanup' ? 'cleanup' : 'setup'),
  })
  invokePreparedExchange(machine)
}

function requestObservationDequeue(machine, phase) {
  prepareExchange(machine, machine.phase, 'observation-dequeue', { phase }, {
    type: 'observation-dequeue',
    dequeuePhase: phase,
    capKind: phase,
  })
  invokePreparedExchange(machine)
}

function requestCleanupStep(machine, checkId, action) {
  prepareExchange(machine, 'cleanup', 'cleanup-step', { checkId, action }, {
    type: 'cleanup-step',
    checkId,
    action,
    capKind: 'cleanup',
  })
  invokePreparedExchange(machine)
}

function readAck(value, keys) {
  return readClosedRecord(value, keys, new CapturedWeakSet())
}

function handleExchangeFulfillment(machine, context, value) {
  if (context === null || typeof context !== 'object') {
    throw new TypeError('invalidExchangeContext')
  }
  if (context.type === 'capability-probe') {
    const values = readAck(value, ['kind', 'profile', 'capabilitySet'])
    if (
      values[0] !== 'capability-probe-result' ||
      values[1] !== EFFECT_PORT_PROFILE ||
      values[2] !== EFFECT_CAPABILITY_SET
    ) {
      throw new TypeError('invalidCapabilityProbeAck')
    }
    requestClockSample(machine, 'prestart', 'setup-origin', 'setup-origin')
    return
  }
  if (context.type === 'clock-sample') {
    const values = readAck(value, [
      'kind',
      'reason',
      'monotonicMilliseconds',
    ])
    if (
      values[0] !== 'controller-clock-sample-result' ||
      values[1] !== context.reason
    ) {
      throw new TypeError('invalidClockAck')
    }
    handleControllerClockValue(machine, context, values[2])
    return
  }
  if (context.type === 'cap-arm') {
    const values = readAck(value, ['kind', 'capKind', 'armState'])
    const expectedState = context.capKind === 'capture' ? 'pending' : 'armed'
    if (
      values[0] !== 'cap-arm-result' ||
      values[1] !== context.capKind ||
      values[2] !== expectedState
    ) {
      throw new TypeError('invalidCapArmAck')
    }
    handleCapArmSuccess(machine, context.capKind)
    return
  }
  if (context.type === 'cap-cancel') {
    const values = readAck(value, [
      'kind',
      'capKind',
      'armIntentId',
      'cancelState',
    ])
    if (
      values[0] !== 'cap-cancel-result' ||
      values[1] !== context.capKind ||
      values[2] !== context.armIntentId ||
      values[3] !== 'cancelled'
    ) {
      throw new TypeError('invalidCapCancelAck')
    }
    machine.capStates[context.capKind] = 'cancelled'
    continueAfterCapCancel(machine, context, true)
    return
  }
  if (context.type === 'protocol-command-send') {
    const values = readAck(value, ['kind', 'commandId', 'sendState'])
    const expectedState = context.command === 'Runtime.evaluate'
      ? 'sent-and-capture-cap-started'
      : 'sent'
    if (
      values[0] !== 'protocol-command-send-result' ||
      values[1] !== context.commandId ||
      values[2] !== expectedState
    ) {
      throw new TypeError('invalidProtocolSendAck')
    }
    handleProtocolSendSuccess(machine, context)
    return
  }
  if (context.type === 'observation-dequeue') {
    machine.dequeuedObservationCount += 1
    if (machine.dequeuedObservationCount > MAX_DEQUEUED_OBSERVATIONS) {
      if (machine.preCleanupObservationSnapshot === null) {
        triggerObservationViolation(machine)
      } else {
        machine.cleanupViolation = true
        machine.cleanupFinalizeReason = 'cleanup-terminal-failure'
        recoverOrFinalizeCleanup(machine)
      }
      return
    }
    machine.heldDequeuedObservation = value
    machine.heldDequeuePhase = context.dequeuePhase
    const reason = context.dequeuePhase + '-dequeue-before-reflection'
    requestClockSample(machine, machine.phase, reason, 'dequeue-reflection')
    return
  }
  if (context.type === 'cleanup-step') {
    const values = readAck(value, ['kind', 'checkId', 'stepState'])
    if (
      values[0] !== 'cleanup-step-result' ||
      values[1] !== context.checkId ||
      values[2] !== 'accepted'
    ) {
      throw new TypeError('invalidCleanupStepAck')
    }
    machine.cleanupPurpose = 'await-cleanup-fact'
    machine.cleanupPendingCheckId = context.checkId
    requestObservationDequeue(machine, 'cleanup')
    return
  }
  throw new TypeError('invalidExchangeContext')
}

function validControllerClock(machine, value) {
  return typeof value === 'number' &&
    capturedNumberIsFinite(value) &&
    value >= 0 &&
    (machine.lastControllerClock === null || value >= machine.lastControllerClock)
}

function safeDeadline(origin, duration) {
  const deadline = origin + duration
  return capturedNumberIsFinite(deadline) &&
    deadline >= 0 &&
    deadline <= capturedNumberMaximumSafeInteger
    ? deadline
    : null
}

function handleControllerClockValue(machine, context, value) {
  if (!validControllerClock(machine, value)) {
    throw new TypeError('invalidControllerClock')
  }
  machine.lastControllerClock = value
  if (context.reason === 'setup-origin') {
    const deadline = safeDeadline(value, SETUP_WINDOW_MILLISECONDS)
    if (deadline === null) {
      throw new TypeError('invalidSetupDeadline')
    }
    machine.mSetup = value
    machine.setupDeadline = deadline
    requestCapArm(machine, 'setup', deadline)
    return
  }
  if (context.reason === 'cleanup-origin') {
    const deadline = safeDeadline(value, DURATION_CAP_MILLISECONDS)
    if (deadline === null) {
      terminalCleanupControlFailure(machine)
      return
    }
    machine.mCleanup = value
    machine.cleanupDeadline = deadline
    machine.stages[8].relativeMilliseconds = 0
    machine.stages[8].timingState = 'measured'
    requestCapArm(machine, 'cleanup', deadline)
    return
  }
  if (context.reason === 'cleanup-completion-after-cap-cancel') {
    const timing = roundedTiming(value - machine.mCleanup)
    if (timing === null) {
      machine.cleanupViolation = true
      finalizeCleanup(machine, 'cleanup-terminal-failure', 'mismatch')
      return
    }
    observeStage(machine, 9, 'match', timing)
    finalizeCleanup(machine, 'all-steps-terminal', 'match')
    return
  }

  const held = machine.heldDequeuedObservation
  const phase = machine.heldDequeuePhase
  machine.heldDequeuedObservation = null
  machine.heldDequeuePhase = null
  if (phase === 'setup') {
    if (value >= machine.setupDeadline) {
      machine.capStates.setup = 'fired'
      beginObservationClosure(machine, 'U', 'setup-cap', false)
      return
    }
    inspectDequeuedObservation(machine, held, 'setup')
    return
  }
  if (phase === 'cleanup') {
    if (value >= machine.cleanupDeadline) {
      machine.capStates.cleanup = 'fired'
      finalizeCleanup(machine, 'cleanup-cap', 'cap')
      return
    }
    inspectDequeuedObservation(machine, held, 'cleanup')
    return
  }
  inspectDequeuedObservation(machine, held, 'capture')
}

function handleCapArmSuccess(machine, capKind) {
  if (capKind === 'setup') {
    machine.capStates.setup = 'armed'
    observeStage(machine, 0, 'match', {
      relativeMilliseconds: 0,
      timingState: 'measured',
    })
    capturedObjectFreeze(machine.stages[0])
    machine.attemptStarted = true
    machine.phase = 'observation'
    machine.setupStep = 'get-targets-send'
    requestProtocolCommand(machine, 'Target.getTargets')
    return
  }
  if (capKind === 'capture') {
    machine.capStates.capture = 'pending-activation'
    requestProtocolCommand(machine, 'Runtime.evaluate')
    return
  }
  machine.capStates.cleanup = 'armed'
  continueCleanupOperations(machine)
}

function handleProtocolSendSuccess(machine, context) {
  const operation = machine.operationLedger[context.command]
  operation.ackCount += 1
  machine.protocolSendCount += 1
  if (operation.ackCount > 1 || operation.intentCount > 1) {
    if (machine.preCleanupObservationSnapshot === null) {
      triggerObservationViolation(machine)
    } else {
      machine.cleanupViolation = true
      terminalCleanupControlFailure(machine)
    }
    return
  }
  if (context.command === 'Runtime.evaluate') {
    if (machine.capStates.capture !== 'pending-activation') {
      triggerObservationViolation(machine)
      return
    }
    machine.capStates.capture = 'active'
    machine.captureWindowState = 'truncated'
    machine.outstandingCommand = {
      commandId: context.commandId,
      command: context.command,
    }
    requestObservationDequeue(machine, 'capture')
    return
  }
  if (machine.phase === 'cleanup') {
    capturedReflectApply(capturedMapSet, machine.openCommandIds, [
      context.commandId,
      context.command,
    ])
    if (context.command === 'Network.disable') {
      machine.cleanupDisableAttempted = true
    } else {
      machine.cleanupDetachAttempted = true
    }
    continueCleanupOperations(machine)
    return
  }
  machine.outstandingCommand = {
    commandId: context.commandId,
    command: context.command,
  }
  requestObservationDequeue(machine, 'setup')
}

function handleMalformedFulfillment(machine, context) {
  if (!machine.attemptStarted) {
    if (context !== null && context.type === 'cap-arm' && context.capKind === 'setup') {
      machine.capStates.setup = 'activation-unknown'
      if (requestCapCancel(machine, 'setup', 'prestart-arm-recovery')) {
        return
      }
    } else if (context !== null && context.type === 'cap-cancel') {
      machine.capStates.setup = 'terminal-unknown'
    }
    settleMachineWithError(machine)
    return
  }
  if (machine.preCleanupObservationSnapshot !== null) {
    handleCleanupMalformed(machine, context)
    return
  }
  if (context.type === 'cap-cancel') {
    machine.capStates[context.capKind] = 'terminal-unknown'
    machine.cleanupInitialViolation = true
    if (context.purpose === 'setup-ready-transition') {
      machine.cleanupInitialViolation = true
      machine.stickyViolation = true
      beginObservationClosure(machine, 'V', 'confirmed-violation', true)
      return
    }
    if (context.purpose === 'capture-terminal-quiescence') {
      machine.cleanupInitialViolation = true
      machine.stickyViolation = true
      beginObservationClosure(machine, 'V', 'confirmed-violation', true)
      return
    }
    beginObservationClosure(machine, 'V', 'confirmed-violation', true)
    return
  }
  if (context.type === 'cap-arm' && context.capKind === 'capture') {
    machine.capStates.capture = 'activation-unknown'
    prepareViolationBeforeSnapshotCancel(machine, 'capture')
    return
  }
  if (context.type === 'protocol-command-send') {
    machine.operationLedger[context.command].sendUnknown = true
    if (context.command === 'Runtime.evaluate') {
      applyEvaluateSendFailureProjection(machine)
      prepareViolationBeforeSnapshotCancel(machine, 'capture')
      return
    }
    prepareViolationBeforeSnapshotCancel(machine, 'setup')
    return
  }
  if (context.type === 'clock-sample' || context.type === 'observation-dequeue') {
    machine.heldDequeuedObservation = null
    machine.heldDequeuePhase = null
    prepareViolationBeforeSnapshotCancel(machine, context.capKind)
    return
  }
  triggerObservationViolation(machine)
}

function handleExchangeRejection(machine, context) {
  if (!machine.attemptStarted) {
    if (context.type === 'cap-arm' && context.capKind === 'setup') {
      machine.capStates.setup = 'activation-unknown'
      if (requestCapCancel(machine, 'setup', 'prestart-arm-recovery')) {
        return
      }
    } else if (context.type === 'cap-cancel') {
      machine.capStates.setup = 'terminal-unknown'
    }
    settleMachineWithError(machine)
    return
  }
  if (machine.preCleanupObservationSnapshot !== null) {
    handleCleanupRejection(machine, context)
    return
  }
  if (context.type === 'cap-cancel') {
    machine.capStates[context.capKind] = 'terminal-unknown'
    machine.cleanupInitialViolation = true
    machine.stickyViolation = true
    beginObservationClosure(machine, 'V', 'confirmed-violation', true)
    return
  }
  if (context.type === 'cap-arm' && context.capKind === 'capture') {
    machine.capStates.capture = 'activation-unknown'
    prepareViolationBeforeSnapshotCancel(machine, 'capture')
    return
  }
  if (context.type === 'protocol-command-send') {
    machine.operationLedger[context.command].sendUnknown = true
    if (context.command === 'Runtime.evaluate') {
      applyEvaluateSendFailureProjection(machine)
      prepareViolationBeforeSnapshotCancel(machine, 'capture')
    } else {
      prepareViolationBeforeSnapshotCancel(machine, 'setup')
    }
    return
  }
  if (context.type === 'clock-sample' || context.type === 'observation-dequeue') {
    machine.heldDequeuedObservation = null
    machine.heldDequeuePhase = null
    prepareViolationBeforeSnapshotCancel(machine, context.capKind)
    return
  }
  triggerObservationViolation(machine)
}

function applyEvaluateSendFailureProjection(machine) {
  machine.stickyViolation = true
  machine.closeClass = 'V'
  machine.capStates.capture = 'activation-unknown'
  machine.mainWorldEvaluationCount = 'unknown'
  machine.derivedFactoryCallCount = 'unknown'
  machine.derivedTransportCallCount = 'unknown'
  machine.evaluateReplyCountClass = 'unknown'
  machine.networkCountsUnknown = true
  machine.productEvidenceComplete = false
  machine.captureWindowState = 'truncated'
  machine.publicSettlement = null
}

function finalizeEvaluationKnowledgeForSnapshot(machine) {
  if (machine.evaluateIntentCount === 0) {
    return
  }
  if (machine.evaluateReplyRoutingUnknown) {
    markEvaluateReplyRoutingUnknown(machine)
    return
  }
  if (machine.acceptedMainWorldValue === null) {
    if (machine.mainWorldEvaluationCount !== 'multiple') {
      machine.mainWorldEvaluationCount = 'unknown'
    }
    machine.derivedFactoryCallCount = 'unknown'
    machine.derivedTransportCallCount = 'unknown'
    machine.publicSettlement = null
    machine.productEvidenceComplete = false
  }
}

function prepareViolationBeforeSnapshotCancel(machine, capKind) {
  machine.stickyViolation = true
  machine.closeClass = 'V'
  machine.observationCloseReason = 'confirmed-violation'
  machine.captureWindowState = machine.evaluateIntentCount === 0
    ? 'not-started'
    : 'truncated'
  const state = machine.capStates[capKind]
  if (isOneOf(state, ['armed', 'active', 'pending-activation', 'activation-unknown'])) {
    if (requestCapCancel(machine, capKind, 'rejection-quiescence')) {
      return
    }
  }
  beginObservationClosure(machine, 'V', 'confirmed-violation', true)
}

function continueAfterCapCancel(machine, context, success) {
  if (context.purpose === 'prestart-arm-recovery') {
    settleMachineWithError(machine)
    return
  }
  if (context.purpose === 'setup-ready-transition') {
    if (success) {
      requestCapArm(machine, 'capture', null)
    } else {
      beginObservationClosure(machine, 'V', 'confirmed-violation', true)
    }
    return
  }
  if (
    context.purpose === 'rejection-quiescence' ||
    context.purpose === 'capture-terminal-quiescence'
  ) {
    const closeClass = context.purpose === 'capture-terminal-quiescence' && success
      ? 'U'
      : 'V'
    const reason = closeClass === 'U'
      ? 'capture-terminal-unproven'
      : 'confirmed-violation'
    beginObservationClosure(machine, closeClass, reason, true)
    return
  }
  if (context.purpose === 'post-o0-old-cap') {
    continuePostSnapshotOldCapCancels(machine)
    return
  }
  if (context.purpose === 'cleanup-final') {
    if (success) {
      machine.cleanupCompletionClockRequested = true
      requestClockSample(
        machine,
        'cleanup',
        'cleanup-completion-after-cap-cancel',
        'cleanup-completion'
      )
    } else {
      terminalCleanupControlFailure(machine)
    }
    return
  }
  terminalCleanupControlFailure(machine)
}

function triggerObservationViolation(machine) {
  machine.stickyViolation = true
  beginObservationClosure(machine, 'V', 'confirmed-violation', false)
}

function beginObservationClosure(machine, closeClass, reason, capsAlreadyQuiesced) {
  if (machine.preCleanupObservationSnapshot !== null) {
    return
  }
  if (closeClass === 'V') {
    machine.stickyViolation = true
  }
  machine.closeClass = closeClass
  machine.observationCloseReason = reason
  if (reason === 'setup-cap' || reason === 'setup-terminal-unproven') {
    machine.captureWindowState = 'not-started'
    machine.evaluateReplyCountClass = 'zero'
    machine.mainWorldEvaluationCount = 'zero'
    machine.derivedFactoryCallCount = 'zero'
    machine.derivedTransportCallCount = 'zero'
    machine.networkCountsUnknown = true
  } else if (reason === 'capture-cap') {
    machine.captureWindowState = 'elapsed'
  } else if (machine.evaluateIntentCount === 0) {
    machine.captureWindowState = 'not-started'
  } else {
    machine.captureWindowState = 'truncated'
  }
  machine.productEvidenceComplete =
    machine.publicSettlement !== null &&
    machine.postTerminalKind !== null &&
    !machine.endpointAttributionAmbiguous
  machine.requestBudgetFinalized = true
  freezeObservationSnapshot(machine)
  machine.phase = 'cleanup'
  if (capsAlreadyQuiesced || machine.portState !== 'open') {
    initializeCleanupLedger(machine)
    if (machine.portState === 'open') {
      startCleanupController(machine)
    } else {
      finalizeCleanupPortlessly(machine)
    }
    return
  }
  continuePostSnapshotOldCapCancels(machine)
}

function continuePostSnapshotOldCapCancels(machine) {
  const kinds = ['setup', 'capture']
  for (let index = 0; index < kinds.length; index += 1) {
    const capKind = kinds[index]
    if (
      isOneOf(machine.capStates[capKind], [
        'armed',
        'active',
        'pending-activation',
        'activation-unknown',
      ]) &&
      !machine.capCancelAttempted[capKind]
    ) {
      if (requestCapCancel(machine, capKind, 'post-o0-old-cap')) {
        return
      }
    }
  }
  initializeCleanupLedger(machine)
  if (machine.portState === 'open') {
    startCleanupController(machine)
  } else {
    finalizeCleanupPortlessly(machine)
  }
}

function startCleanupController(machine) {
  requestClockSample(machine, 'cleanup', 'cleanup-origin', 'cleanup-origin')
}

function inspectOpenDataDescriptor(node, key, required) {
  if (typeof node !== 'object' || node === null) {
    return { valid: false, present: false, descriptor: undefined }
  }
  let descriptor
  try {
    descriptor = capturedGetOwnPropertyDescriptor(node, key)
  } catch {
    throw new TypeError('openDataReflectionFailed')
  }
  if (descriptor === undefined) {
    return {
      valid: required !== true,
      present: false,
      descriptor: undefined,
    }
  }
  if (
    descriptor.enumerable !== true ||
    capturedObjectHasOwn(descriptor, 'value') !== true ||
    capturedObjectHasOwn(descriptor, 'get') === true ||
    capturedObjectHasOwn(descriptor, 'set') === true
  ) {
    return { valid: false, present: true, descriptor }
  }
  return { valid: true, present: true, descriptor }
}

function readOpenDataDescriptor(node, key, required) {
  if (typeof node !== 'object' || node === null) {
    throw new TypeError('invalidOpenEnvelope')
  }
  const observation = inspectOpenDataDescriptor(node, key, required)
  if (!observation.valid) {
    throw new TypeError('invalidOpenDataProperty')
  }
  return observation
}

function readOpenDataProperty(node, key, required) {
  const observation = readOpenDataDescriptor(node, key, required)
  return {
    present: observation.present,
    value: observation.present ? observation.descriptor.value : undefined,
  }
}

function inspectDequeuedObservation(machine, value, phase) {
  const envelope = readAckEnvelope(value)
  if (envelope.kind === 'connection-closed') {
    handleConnectionClosed(machine, phase)
    return
  }
  if (envelope.kind === 'cap-fired') {
    handleCapFired(machine, phase, envelope)
    return
  }
  if (envelope.kind === 'malformed-cleanup-fact') {
    if (
      phase === 'cleanup' &&
      machine.cleanupPurpose === 'await-cleanup-fact' &&
      envelope.checkId === machine.cleanupPendingCheckId
    ) {
      machine.cleanupViolation = true
      setCleanupCheck(machine, envelope.checkId, 'failed')
      machine.cleanupPurpose = null
      machine.cleanupPendingCheckId = null
      machine.cleanupStepIndex += 1
      startNextCleanupStep(machine)
      return
    }
    if (phase === 'cleanup') {
      machine.cleanupViolation = true
      requestObservationDequeue(machine, 'cleanup')
      return
    }
    throw new TypeError('invalidCleanupFact')
  }
  if (envelope.kind === 'cleanup-fact') {
    if (phase !== 'cleanup') {
      throw new TypeError('cleanupFactOutsideCleanup')
    }
    handleCleanupFact(machine, envelope)
    return
  }
  if (phase === 'setup') {
    inspectSetupCdpMessage(machine, envelope.value)
    return
  }
  if (phase === 'capture') {
    inspectCaptureCdpMessage(machine, envelope.value)
    return
  }
  inspectCleanupCdpMessage(machine, envelope.value)
}

function readAckEnvelope(value) {
  if (typeof value !== 'object' || value === null || capturedArrayIsArray(value)) {
    throw new TypeError('invalidDequeueEnvelope')
  }
  if (capturedGetPrototypeOf(value) !== capturedObjectPrototype) {
    throw new TypeError('invalidDequeueEnvelope')
  }
  const ownKeys = capturedReflectOwnKeys(value)
  let expected
  if (ownKeys.length === 2 && ownKeys[0] === 'kind' && ownKeys[1] === 'value') {
    expected = ['kind', 'value']
  } else if (
    ownKeys.length === 3 && ownKeys[0] === 'kind' &&
    ownKeys[1] === 'capKind' && ownKeys[2] === 'armIntentId'
  ) {
    expected = ['kind', 'capKind', 'armIntentId']
  } else if (ownKeys.length === 1 && ownKeys[0] === 'kind') {
    expected = ['kind']
  } else if (
    ownKeys.length === 3 && ownKeys[0] === 'kind' &&
    ownKeys[1] === 'checkId' && ownKeys[2] === 'fact'
  ) {
    expected = ['kind', 'checkId', 'fact']
  } else {
    const kindObservation = inspectOpenDataDescriptor(value, 'kind', true)
    if (!kindObservation.valid) {
      throw new TypeError('invalidDequeueEnvelope')
    }
    if (kindObservation.descriptor.value === 'cleanup-fact') {
      const checkObservation = inspectOpenDataDescriptor(value, 'checkId', true)
      if (
        !checkObservation.valid ||
        typeof checkObservation.descriptor.value !== 'string'
      ) {
        throw new TypeError('invalidDequeueEnvelope')
      }
      return {
        kind: 'malformed-cleanup-fact',
        checkId: checkObservation.descriptor.value,
      }
    }
    throw new TypeError('invalidDequeueEnvelope')
  }
  if (expected[0] === 'kind' && expected[1] === 'checkId') {
    const kind = readOwnDataDescriptor(value, 'kind')
    const checkId = readOwnDataDescriptor(value, 'checkId')
    if (kind !== 'cleanup-fact' || typeof checkId !== 'string') {
      throw new TypeError('invalidDequeueEnvelope')
    }
    const factObservation = inspectOpenDataDescriptor(value, 'fact', true)
    if (!factObservation.valid || typeof factObservation.descriptor.value !== 'boolean') {
      return { kind: 'malformed-cleanup-fact', checkId }
    }
    return { kind, checkId, fact: factObservation.descriptor.value }
  }
  const values = new CapturedArray(expected.length)
  for (let index = 0; index < expected.length; index += 1) {
    defineArrayElement(values, index, readOwnDataDescriptor(value, expected[index]))
  }
  if (values[0] === 'cdp-message' && expected.length === 2) {
    return { kind: values[0], value: values[1] }
  }
  if (
    values[0] === 'cap-fired' &&
    expected.length === 3 &&
    isOneOf(values[1], ['setup', 'capture', 'cleanup']) &&
    capturedNumberIsSafeInteger(values[2]) && values[2] > 0
  ) {
    return { kind: values[0], capKind: values[1], armIntentId: values[2] }
  }
  if (values[0] === 'connection-closed' && expected.length === 1) {
    return { kind: values[0] }
  }
  throw new TypeError('invalidDequeueEnvelope')
}

function handleCapFired(machine, phase, envelope) {
  if (
    envelope.capKind !== phase ||
    envelope.armIntentId !== machine.capArmIntentIds[phase]
  ) {
    if (phase === 'cleanup') {
      machine.cleanupViolation = true
      requestObservationDequeue(machine, 'cleanup')
    } else {
      triggerObservationViolation(machine)
    }
    return
  }
  machine.capStates[phase] = 'fired'
  if (phase === 'capture') {
    beginObservationClosure(machine, 'C', 'capture-cap', false)
  } else if (phase === 'setup') {
    triggerObservationViolation(machine)
  } else {
    terminalCleanupControlFailure(machine)
  }
}

function handleConnectionClosed(machine, phase) {
  if (machine.cdpConnectionClosed) {
    if (phase === 'cleanup') {
      machine.cleanupViolation = true
      continueCleanupAfterConnectionClose(machine)
    } else {
      triggerObservationViolation(machine)
    }
    return
  }
  machine.cdpConnectionClosed = true
  if (phase === 'setup') {
    beginObservationClosure(machine, 'U', 'setup-terminal-unproven', false)
    return
  }
  if (phase === 'capture') {
    machine.closeClass = 'U'
    machine.observationCloseReason = 'capture-terminal-unproven'
    machine.captureWindowState = 'truncated'
    if (machine.capStates.capture === 'active') {
      requestCapCancel(machine, 'capture', 'capture-terminal-quiescence')
    } else {
      beginObservationClosure(
        machine,
        'U',
        'capture-terminal-unproven',
        true
      )
    }
    return
  }
  continueCleanupAfterConnectionClose(machine)
}

function inspectSetupCdpMessage(machine, message) {
  const idField = readOpenDataDescriptor(message, 'id', false)
  if (!idField.present) {
    requestObservationDequeue(machine, 'setup')
    return
  }
  const id = idField.descriptor.value
  if (!capturedNumberIsSafeInteger(id) || id < 1) {
    throw new TypeError('invalidCdpResponseId')
  }
  if (capturedReflectApply(capturedMapHas, machine.completedCommandIds, [id])) {
    const completedCommand = capturedReflectApply(
      capturedMapGet,
      machine.completedCommandIds,
      [id]
    )
    inspectDuplicateSetupResponse(machine, message, id, completedCommand)
    if (completedCommand === 'Target.getTargets') {
      machine.targetProfile = 'unknown'
    }
    machine.setupReady = false
    beginObservationClosure(machine, 'U', 'setup-terminal-unproven', false)
    return
  }
  const outstanding = machine.outstandingCommand
  if (outstanding === null || id !== outstanding.commandId) {
    beginObservationClosure(machine, 'U', 'setup-terminal-unproven', false)
    return
  }
  if (outstanding.command === 'Network.enable') {
    const session = readOpenDataProperty(message, 'sessionId', true).value
    if (!isEphemeralIdentifier(session)) {
      throw new TypeError('invalidSetupSession')
    }
    if (session !== machine.sessionId) {
      beginObservationClosure(machine, 'U', 'setup-terminal-unproven', false)
      return
    }
  }
  if (outstanding.command === 'Target.getTargets') {
    const outcome = parseGetTargetsResponse(machine, message, id, true)
    if (outcome !== 'ready') {
      machine.outstandingCommand = null
      capturedReflectApply(capturedMapSet, machine.completedCommandIds, [id, outstanding.command])
      beginObservationClosure(machine, 'U', 'setup-terminal-unproven', false)
      return
    }
    completeSetupCommand(machine, id, outstanding.command)
    requestProtocolCommand(machine, 'Target.attachToTarget')
    return
  }
  const errorField = readOpenDataDescriptor(message, 'error', false)
  if (errorField.present) {
    machine.outstandingCommand = null
    capturedReflectApply(capturedMapSet, machine.completedCommandIds, [id, outstanding.command])
    beginObservationClosure(machine, 'U', 'setup-terminal-unproven', false)
    return
  }
  if (outstanding.command === 'Target.attachToTarget') {
    const result = readOpenDataProperty(message, 'result', true).value
    const values = readClosedRecord(
      result,
      ['sessionId'],
      new CapturedWeakSet()
    )
    if (!isEphemeralIdentifier(values[0])) {
      throw new TypeError('invalidAttachedSession')
    }
    machine.sessionId = values[0]
    completeSetupCommand(machine, id, outstanding.command)
    requestProtocolCommand(machine, 'Network.enable')
    return
  }
  const result = readOpenDataProperty(message, 'result', true).value
  readClosedRecord(result, [], new CapturedWeakSet())
  completeSetupCommand(machine, id, outstanding.command)
  machine.setupReady = true
  machine.setupStep = 'ready'
  requestCapCancel(machine, 'setup', 'setup-ready-transition')
}

function completeSetupCommand(machine, id, command) {
  machine.outstandingCommand = null
  capturedReflectApply(capturedMapSet, machine.completedCommandIds, [id, command])
}

function isEphemeralIdentifier(value) {
  return typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= MAX_EPHEMERAL_IDENTIFIER_CODE_UNITS
}

function inspectDuplicateAttachedSession(machine, message) {
  const errorField = readOpenDataDescriptor(message, 'error', false)
  if (errorField.present) {
    return
  }
  const result = readOpenDataProperty(message, 'result', true).value
  const values = readClosedRecord(
    result,
    ['sessionId'],
    new CapturedWeakSet()
  )
  if (!isEphemeralIdentifier(values[0])) {
    throw new TypeError('invalidDuplicateAttachedSession')
  }
  if (machine.sessionId !== null && values[0] !== machine.sessionId) {
    machine.targetBindingContradiction = true
  }
}

function inspectDuplicateNetworkEnableResponse(machine, message) {
  const session = readOpenDataProperty(message, 'sessionId', true).value
  if (!isEphemeralIdentifier(session)) {
    throw new TypeError('invalidDuplicateNetworkEnableSession')
  }
  if (session !== machine.sessionId) {
    return
  }
  const errorField = readOpenDataDescriptor(message, 'error', false)
  if (errorField.present) {
    return
  }
  const result = readOpenDataProperty(message, 'result', true).value
  readClosedRecord(result, [], new CapturedWeakSet())
}

function inspectDuplicateSetupResponse(machine, message, id, command) {
  if (command === 'Target.getTargets') {
    parseGetTargetsResponse(machine, message, id, false)
    return
  }
  if (command === 'Target.attachToTarget') {
    inspectDuplicateAttachedSession(machine, message)
    return
  }
  if (command === 'Network.enable') {
    inspectDuplicateNetworkEnableResponse(machine, message)
    return
  }
  throw new TypeError('invalidDuplicateSetupCommand')
}

function readClosedTargetInfos(array) {
  if (capturedArrayIsArray(array) !== true) {
    throw new TypeError('invalidTargetInfos')
  }
  if (capturedGetPrototypeOf(array) !== capturedArrayPrototype) {
    throw new TypeError('invalidTargetInfos')
  }
  const ownKeys = capturedReflectOwnKeys(array)
  const lengthDescriptor = capturedGetOwnPropertyDescriptor(array, 'length')
  if (
    lengthDescriptor === undefined ||
    capturedObjectHasOwn(lengthDescriptor, 'value') !== true ||
    !capturedNumberIsSafeInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0 ||
    lengthDescriptor.enumerable !== false ||
    lengthDescriptor.writable !== true ||
    lengthDescriptor.configurable !== false
  ) {
    throw new TypeError('invalidTargetInfos')
  }
  const length = lengthDescriptor.value
  if (length > MAX_TARGET_INFOS) {
    return { tooMany: true, entries: null }
  }
  if (ownKeys.length !== length + 1) {
    throw new TypeError('invalidTargetInfos')
  }
  for (let index = 0; index < length; index += 1) {
    if (ownKeys[index] !== CapturedString(index)) {
      throw new TypeError('invalidTargetInfos')
    }
  }
  if (ownKeys[length] !== 'length') {
    throw new TypeError('invalidTargetInfos')
  }
  const entries = new CapturedArray(length)
  for (let index = 0; index < length; index += 1) {
    defineArrayElement(
      entries,
      index,
      readOwnDataDescriptor(array, CapturedString(index))
    )
  }
  return { tooMany: false, entries }
}

function parseGetTargetsResponse(machine, message, id, bindTarget) {
  const errorField = readOpenDataDescriptor(message, 'error', false)
  if (errorField.present) {
    return 'terminal-unproven'
  }
  const result = readOpenDataProperty(message, 'result', true).value
  const resultValues = readClosedRecord(
    result,
    ['targetInfos'],
    new CapturedWeakSet()
  )
  const parsedArray = readClosedTargetInfos(resultValues[0])
  if (parsedArray.tooMany) {
    return 'terminal-unproven'
  }
  let matchCount = 0
  let matchedEntry = null
  const entryIdentities = new CapturedWeakSet()
  for (let index = 0; index < parsedArray.entries.length; index += 1) {
    const entry = parsedArray.entries[index]
    if (typeof entry !== 'object' || entry === null) {
      throw new TypeError('invalidTargetInfo')
    }
    markClosedForeignNode(entryIdentities, entry)
    const targetIdDescriptor = readOpenDataDescriptor(
      entry,
      'targetId',
      true
    ).descriptor
    const typeDescriptor = readOpenDataDescriptor(entry, 'type', true).descriptor
    const urlDescriptor = readOpenDataDescriptor(entry, 'url', true).descriptor
    const attachedDescriptor = readOpenDataDescriptor(
      entry,
      'attached',
      true
    ).descriptor
    const type = typeDescriptor.value
    const url = urlDescriptor.value
    if (typeof type !== 'string' || !isCdpUrl(url)) {
      machine.targetProfile = 'unknown'
      throw new TypeError('invalidTargetInfoProfile')
    }
    if (type === 'page' && url === TOP_LEVEL_URL) {
      matchCount += 1
      matchedEntry = { targetIdDescriptor, attachedDescriptor }
    }
  }
  if (matchCount === 0) {
    if (bindTarget) {
      machine.targetProfile = 'other'
    }
    return 'terminal-unproven'
  }
  if (matchCount !== 1) {
    if (bindTarget) {
      machine.targetProfile = 'unknown'
    }
    return 'terminal-unproven'
  }
  const attached = matchedEntry.attachedDescriptor.value
  if (attached !== false) {
    if (bindTarget) {
      machine.targetProfile = attached === true ? 'other' : 'unknown'
    }
    return 'terminal-unproven'
  }
  const targetId = matchedEntry.targetIdDescriptor.value
  if (!isEphemeralIdentifier(targetId)) {
    throw new TypeError('invalidTargetId')
  }
  if (bindTarget) {
    machine.targetId = targetId
    machine.targetProfile = 'single-goldendawn-top-level'
  } else if (machine.targetId !== null && targetId !== machine.targetId) {
    machine.targetBindingContradiction = true
  }
  return 'ready'
}

function markEvaluateReplyRoutingUnknown(machine) {
  machine.evaluateReplyRoutingUnknown = true
  machine.evaluateReplyCountClass = 'unknown'
  machine.mainWorldEvaluationCount = 'unknown'
  machine.acceptedMainWorldValue = null
  machine.derivedFactoryCallCount = 'unknown'
  machine.derivedTransportCallCount = 'unknown'
  machine.publicSettlement = null
  machine.productEvidenceComplete = false
  demoteObservedStage(machine, 1)
  demoteObservedStage(machine, 7)
}

function inspectCaptureCdpMessage(machine, message) {
  let methodField
  try {
    methodField = readOpenDataProperty(message, 'method', false)
  } catch {
    markEvaluateReplyRoutingUnknown(machine)
    throw new TypeError('unreadableCaptureMethodRouting')
  }
  if (methodField.present) {
    inspectNetworkEvent(machine, message, methodField.value)
    if (machine.preCleanupObservationSnapshot === null) {
      requestObservationDequeue(machine, 'capture')
    }
    return
  }
  let id
  try {
    id = readOpenDataProperty(message, 'id', true).value
  } catch {
    markEvaluateReplyRoutingUnknown(machine)
    throw new TypeError('unreadableCaptureResponseId')
  }
  if (!capturedNumberIsSafeInteger(id) || id < 1) {
    markEvaluateReplyRoutingUnknown(machine)
    throw new TypeError('invalidCaptureResponseId')
  }
  if (capturedReflectApply(capturedMapHas, machine.completedCommandIds, [id])) {
    const command = capturedReflectApply(capturedMapGet, machine.completedCommandIds, [id])
    inspectDuplicateSetupResponse(machine, message, id, command)
    if (command === 'Target.getTargets') {
      machine.targetProfile = 'unknown'
    }
    requestObservationDequeue(machine, 'capture')
    return
  }
  if (id !== machine.evaluateCommandId) {
    if (machine.acceptedMainWorldValue === null) {
      markEvaluateReplyRoutingUnknown(machine)
    }
    requestObservationDequeue(machine, 'capture')
    return
  }
  inspectEvaluateResponse(machine, message)
  if (machine.preCleanupObservationSnapshot === null) {
    requestObservationDequeue(machine, 'capture')
  }
}

function inspectEvaluateResponse(machine, message) {
  let session
  try {
    session = readOpenDataProperty(message, 'sessionId', true).value
  } catch {
    markEvaluateReplyRoutingUnknown(machine)
    throw new TypeError('unreadableEvaluateSession')
  }
  if (!isEphemeralIdentifier(session)) {
    markEvaluateReplyRoutingUnknown(machine)
    throw new TypeError('invalidEvaluateSession')
  }
  if (session !== machine.sessionId) {
    if (machine.acceptedMainWorldValue === null) {
      markEvaluateReplyRoutingUnknown(machine)
    }
    return
  }
  if (machine.evaluateReplyCountClass === 'one') {
    machine.evaluateReplyCountClass = 'multiple'
    machine.mainWorldEvaluationCount = 'multiple'
    machine.acceptedMainWorldValue = null
    machine.derivedFactoryCallCount = 'unknown'
    machine.derivedTransportCallCount = 'unknown'
    machine.publicSettlement = null
    machine.productEvidenceComplete = false
    const ambiguousStages = [1, 7]
    for (let index = 0; index < ambiguousStages.length; index += 1) {
      demoteObservedStage(machine, ambiguousStages[index])
    }
    triggerObservationViolation(machine)
    return
  }
  machine.evaluateReplyCountClass = 'one'
  const errorField = readOpenDataDescriptor(message, 'error', false)
  if (errorField.present) {
    throw new TypeError('evaluateError')
  }
  const methodResult = readOpenDataProperty(message, 'result', true).value
  const exceptionDetails = readOpenDataDescriptor(
    methodResult,
    'exceptionDetails',
    false
  )
  if (exceptionDetails.present) {
    throw new TypeError('evaluateException')
  }
  const remoteObject = readOpenDataProperty(methodResult, 'result', true).value
  const type = readOpenDataProperty(remoteObject, 'type', true).value
  const value = readOpenDataProperty(remoteObject, 'value', true).value
  if (type !== 'object') {
    throw new TypeError('invalidRemoteObjectType')
  }
  const forbidden = [
    'objectId',
    'unserializableValue',
    'deepSerializedValue',
    'preview',
    'customPreview',
  ]
  for (let index = 0; index < forbidden.length; index += 1) {
    if (readOpenDataDescriptor(remoteObject, forbidden[index], false).present) {
      throw new TypeError('forbiddenRemoteObjectField')
    }
  }
  const accepted = readMainWorldValue(value)
  machine.evaluateReplyCountClass = 'one'
  machine.mainWorldEvaluationCount = 'one'
  machine.acceptedMainWorldValue = accepted
  machine.derivedFactoryCallCount = accepted.execution.factoryCallCount
  machine.derivedTransportCallCount = accepted.execution.transportCallCount
  const settlement = accepted.settlement
  let dispatchTiming = null
  if (settlement !== null && settlement.timingState !== 'unavailable') {
    dispatchTiming = { relativeMilliseconds: 0, timingState: 'measured' }
  }
  observeStage(
    machine,
    1,
    accepted.execution.transportCallCount === 'one' ? 'match' : 'mismatch',
    dispatchTiming
  )
  if (settlement !== null) {
    const timing = settlement.timingState === 'unavailable'
      ? null
      : {
        relativeMilliseconds: settlement.relativeMilliseconds,
        timingState: settlement.timingState,
      }
    const result = settlement.outcome === 'static-redacted-rejection' &&
      settlement.staticProfileResult === 'match'
      ? 'match'
      : 'mismatch'
    observeStage(machine, 7, result, timing)
    let deadlineRelation = 'unknown'
    if (settlement.timingState !== 'unavailable') {
      deadlineRelation = settlement.relativeMilliseconds >= 4500 &&
        settlement.relativeMilliseconds <= 5500
        ? 'deadline-compatible'
        : 'no-causal-classification'
    }
    machine.publicSettlement = {
      observationState: 'observed',
      outcome: settlement.outcome,
      staticProfileResult: settlement.staticProfileResult,
      deadlineRelation,
    }
  }
  machine.productEvidenceComplete =
    machine.publicSettlement !== null && machine.postTerminalKind !== null &&
    !machine.endpointAttributionAmbiguous
}

function readMainWorldValue(value) {
  const visited = new CapturedWeakSet()
  const root = readClosedRecord(
    value,
    ['preTransportContext', 'execution', 'settlement'],
    visited
  )
  const context = readClosedRecord(
    root[0],
    ['url', 'origin', 'topLevel', 'secureContext'],
    visited
  )
  const contextNames = ['url', 'origin', 'topLevel', 'secureContext']
  const contextCopy = {}
  let hasMismatch = false
  let hasUnproven = false
  for (let index = 0; index < context.length; index += 1) {
    const result = readClosedRecord(context[index], ['contextResult'], visited)[0]
    if (!isOneOf(result, ['match', 'mismatch', 'unproven'])) {
      throw new TypeError('invalidContextResult')
    }
    capturedDefineProperty(contextCopy, contextNames[index], {
      value: { contextResult: result },
      writable: true,
      enumerable: true,
      configurable: true,
    })
    hasMismatch = hasMismatch || result === 'mismatch'
    hasUnproven = hasUnproven || result === 'unproven'
  }
  const execution = readClosedRecord(
    root[1],
    ['factoryCallCount', 'transportCallCount', 'dispatchState'],
    visited
  )
  if (
    !isOneOf(execution[0], ['zero', 'one']) ||
    !isOneOf(execution[1], ['zero', 'one']) ||
    !isOneOf(execution[2], [
      'dispatched',
      'blocked-context-mismatch',
      'blocked-context-unproven',
      'failed-before-public-settlement',
    ])
  ) {
    throw new TypeError('invalidExecution')
  }
  let settlement = null
  if (root[2] !== null) {
    const values = readClosedRecord(root[2], [
      'outcome',
      'staticProfileResult',
      'relativeMilliseconds',
      'timingState',
    ], visited)
    if (
      !isOneOf(values[0], [
        'fulfilled',
        'static-redacted-rejection',
        'other-rejection',
      ]) ||
      !isOneOf(values[1], ['not-applicable', 'match', 'mismatch']) ||
      !isOneOf(values[3], ['measured', 'at-or-above-cap', 'unavailable']) ||
      !validProjectedTimingPair(values[2], values[3]) ||
      !(
        (values[0] === 'fulfilled' && values[1] === 'not-applicable') ||
        (values[0] === 'static-redacted-rejection' && values[1] === 'match') ||
        (values[0] === 'other-rejection' && values[1] === 'mismatch')
      )
    ) {
      throw new TypeError('invalidMainWorldSettlement')
    }
    settlement = {
      outcome: values[0],
      staticProfileResult: values[1],
      relativeMilliseconds: values[2],
      timingState: values[3],
    }
  }
  if (hasMismatch) {
    if (
      execution[2] !== 'blocked-context-mismatch' ||
      execution[0] !== 'zero' || execution[1] !== 'zero' || settlement !== null
    ) {
      throw new TypeError('invalidMainWorldCrossField')
    }
  } else if (hasUnproven) {
    if (
      execution[2] !== 'blocked-context-unproven' ||
      execution[0] !== 'zero' || execution[1] !== 'zero' || settlement !== null
    ) {
      throw new TypeError('invalidMainWorldCrossField')
    }
  } else if (execution[2] === 'dispatched') {
    if (execution[0] !== 'one' || execution[1] !== 'one' || settlement === null) {
      throw new TypeError('invalidMainWorldCrossField')
    }
  } else if (execution[2] === 'failed-before-public-settlement') {
    if (
      settlement !== null ||
      (execution[0] === 'zero' && execution[1] === 'one')
    ) {
      throw new TypeError('invalidMainWorldCrossField')
    }
  } else {
    throw new TypeError('invalidMainWorldCrossField')
  }
  return deepFreezeGenerated({
    preTransportContext: contextCopy,
    execution: {
      factoryCallCount: execution[0],
      transportCallCount: execution[1],
      dispatchState: execution[2],
    },
    settlement,
  })
}

function validProjectedTimingPair(relativeMilliseconds, timingState) {
  if (timingState === 'unavailable') {
    return relativeMilliseconds === null
  }
  if (!capturedNumberIsSafeInteger(relativeMilliseconds)) {
    return false
  }
  if (timingState === 'at-or-above-cap') {
    return relativeMilliseconds === DURATION_CAP_MILLISECONDS
  }
  return timingState === 'measured' &&
    relativeMilliseconds >= 0 &&
    relativeMilliseconds < DURATION_CAP_MILLISECONDS &&
    relativeMilliseconds % 10 === 0
}

function inspectNetworkEvent(machine, message, method) {
  const sessionId = readOpenDataProperty(message, 'sessionId', true).value
  if (!isEphemeralIdentifier(sessionId)) {
    throw new TypeError('invalidNetworkSession')
  }
  if (sessionId !== machine.sessionId) {
    return
  }
  if (!isOneOf(method, [
    'Network.requestWillBeSent',
    'Network.responseReceived',
    'Network.loadingFinished',
    'Network.loadingFailed',
  ])) {
    throw new TypeError('forbiddenNetworkEvent')
  }
  const params = readOpenDataProperty(message, 'params', true).value
  if (method === 'Network.requestWillBeSent') {
    inspectRequestWillBeSent(machine, params)
  } else if (method === 'Network.responseReceived') {
    inspectResponseReceived(machine, params)
  } else {
    inspectLoadingTerminal(machine, params, method)
  }
}

function validateNetworkTimestamp(machine, timestamp) {
  if (
    typeof timestamp !== 'number' ||
    !capturedNumberIsFinite(timestamp) ||
    timestamp < 0
  ) {
    return null
  }
  const absoluteMilliseconds = timestamp * 1000
  if (
    !capturedNumberIsFinite(absoluteMilliseconds) ||
    absoluteMilliseconds > capturedNumberMaximumSafeInteger
  ) {
    return null
  }
  const first = machine.firstEndpointRequestTimestamp === null
    ? timestamp
    : machine.firstEndpointRequestTimestamp
  const relativeMillisecondsRaw = (timestamp - first) * 1000
  if (
    !capturedNumberIsFinite(relativeMillisecondsRaw) ||
    relativeMillisecondsRaw < 0 ||
    relativeMillisecondsRaw > capturedNumberMaximumSafeInteger ||
    (
      machine.lastValidBrowserNetworkTimestamp !== null &&
      timestamp < machine.lastValidBrowserNetworkTimestamp
    )
  ) {
    return null
  }
  return {
    first,
    timestamp,
    timing: roundedTiming(relativeMillisecondsRaw),
  }
}

function commitNetworkTimestamp(machine, candidate) {
  if (machine.firstEndpointRequestTimestamp === null) {
    machine.firstEndpointRequestTimestamp = candidate.first
  }
  machine.lastValidBrowserNetworkTimestamp = candidate.timestamp
}

function inspectRequestWillBeSent(machine, params) {
  const requestId = readOpenDataProperty(params, 'requestId', true).value
  const request = readOpenDataProperty(params, 'request', true).value
  const url = readOpenDataProperty(request, 'url', true).value
  const method = readOpenDataProperty(request, 'method', true).value
  if (!isEphemeralIdentifier(requestId) || !isCdpUrl(url) || !isHttpMethod(method)) {
    throw new TypeError('invalidNetworkRequest')
  }
  if (url !== ENDPOINT_URL) {
    return
  }
  const timestamp = readOpenDataProperty(params, 'timestamp', true).value
  const candidate = validateNetworkTimestamp(machine, timestamp)
  if (candidate === null) {
    triggerObservationViolation(machine)
    return
  }
  if (machine.preflightRequestId === null) {
    commitNetworkTimestamp(machine, candidate)
    machine.preflightRequestId = requestId
    if (method === 'OPTIONS') {
      machine.endpointOptionsCount += 1
    } else if (method === 'POST') {
      machine.endpointPostsCount += 1
      machine.networkSequenceOther = true
    } else {
      machine.endpointOtherMethodsCount += 1
      machine.networkSequenceOther = true
    }
    observeStage(machine, 2, method === 'OPTIONS' ? 'match' : 'mismatch', candidate.timing)
    return
  }
  if (requestId === machine.preflightRequestId || requestId === machine.postRequestId) {
    commitNetworkTimestamp(machine, candidate)
    demoteObservedStage(
      machine,
      requestId === machine.preflightRequestId ? 2 : 4
    )
    machine.endpointAttributionAmbiguous = true
    machine.networkSequenceOther = true
    machine.productEvidenceComplete = false
    if (method === 'OPTIONS') {
      machine.endpointOptionsCount += 1
    } else if (method === 'POST') {
      machine.endpointPostsCount += 1
      if (machine.endpointPostsCount > 1) {
        triggerObservationViolation(machine)
      }
    } else {
      machine.endpointOtherMethodsCount += 1
    }
    return
  }
  if (machine.postRequestId === null) {
    commitNetworkTimestamp(machine, candidate)
    machine.postRequestId = requestId
    if (method === 'POST') {
      machine.endpointPostsCount += 1
      if (machine.endpointPostsCount > 1) {
        machine.networkSequenceOther = true
        triggerObservationViolation(machine)
        return
      }
    } else if (method === 'OPTIONS') {
      machine.endpointOptionsCount += 1
      machine.networkSequenceOther = true
    } else {
      machine.endpointOtherMethodsCount += 1
      machine.networkSequenceOther = true
    }
    observeStage(machine, 4, method === 'POST' ? 'match' : 'mismatch', candidate.timing)
    return
  }
  commitNetworkTimestamp(machine, candidate)
  machine.networkSequenceOther = true
  machine.productEvidenceComplete = false
  if (method === 'OPTIONS') {
    machine.endpointOptionsCount += 1
  } else if (method === 'POST') {
    machine.endpointPostsCount += 1
    if (machine.endpointPostsCount > 1) {
      triggerObservationViolation(machine)
    }
  } else {
    machine.endpointOtherMethodsCount += 1
  }
}

function inspectResponseReceived(machine, params) {
  const requestId = readOpenDataProperty(params, 'requestId', true).value
  const response = readOpenDataProperty(params, 'response', true).value
  const url = readOpenDataProperty(response, 'url', true).value
  if (!isEphemeralIdentifier(requestId) || !isCdpUrl(url)) {
    throw new TypeError('invalidNetworkResponse')
  }
  let stageIndex = -1
  if (requestId === machine.preflightRequestId) {
    stageIndex = 3
  } else if (requestId === machine.postRequestId) {
    stageIndex = 5
  } else {
    if (url !== ENDPOINT_URL) {
      return
    }
    machine.endpointAttributionAmbiguous = true
    machine.productEvidenceComplete = false
    return
  }
  const status = readOpenDataProperty(response, 'status', true).value
  const timestamp = readOpenDataProperty(params, 'timestamp', true).value
  if (
    !capturedNumberIsFinite(status) ||
    !capturedNumberIsInteger(status) ||
    status < 0
  ) {
    throw new TypeError('invalidNetworkStatus')
  }
  const candidate = validateNetworkTimestamp(machine, timestamp)
  if (candidate === null) {
    triggerObservationViolation(machine)
    return
  }
  commitNetworkTimestamp(machine, candidate)
  const expected = stageIndex === 3 ? 204 : 200
  const responseMatches = url === ENDPOINT_URL && status === expected
  if (!observeStage(machine, stageIndex, responseMatches ? 'match' : 'mismatch', candidate.timing)) {
    machine.endpointAttributionAmbiguous = true
  }
  if (!responseMatches) {
    machine.networkSequenceOther = true
  }
}

function inspectLoadingTerminal(machine, params, method) {
  const requestId = readOpenDataProperty(params, 'requestId', true).value
  if (!isEphemeralIdentifier(requestId)) {
    throw new TypeError('invalidTerminalRequestId')
  }
  if (requestId !== machine.postRequestId) {
    return
  }
  const timestamp = readOpenDataProperty(params, 'timestamp', true).value
  const candidate = validateNetworkTimestamp(machine, timestamp)
  if (candidate === null) {
    triggerObservationViolation(machine)
    return
  }
  commitNetworkTimestamp(machine, candidate)
  if (machine.postTerminalKind !== null) {
    machine.stages[6].stageId = 'post-loading-terminal'
    demoteObservedStage(machine, 6)
    machine.endpointAttributionAmbiguous = true
    machine.productEvidenceComplete = false
    return
  }
  const finished = method === 'Network.loadingFinished'
  machine.postTerminalKind = finished ? 'finished' : 'failed'
  machine.stages[6].stageId = finished
    ? 'post-loading-finished'
    : 'post-loading-failed'
  observeStage(machine, 6, finished ? 'match' : 'mismatch', candidate.timing)
  if (!finished) {
    machine.networkSequenceOther = true
  }
  machine.productEvidenceComplete =
    machine.publicSettlement !== null && !machine.endpointAttributionAmbiguous
}

function isCdpUrl(value) {
  return typeof value === 'string' && value.length >= 1 &&
    value.length <= MAX_CDP_URL_CODE_UNITS
}

function isHttpMethod(value) {
  return typeof value === 'string' && value.length >= 1 &&
    value.length <= MAX_HTTP_METHOD_CODE_UNITS &&
    testPattern(HTTP_METHOD_PATTERN, value)
}

function mapSize(map) {
  return capturedReflectApply(capturedMapSizeGetter, map, [])
}

function continueCleanupOperations(machine) {
  if (
    machine.cleanupLedger === null ||
    machine.cleanupLedger.cleanupFinalized ||
    machine.capStates.cleanup !== 'armed' ||
    machine.lease !== LEASE_IDLE ||
    machine.portState !== 'open'
  ) {
    return
  }
  const networkCheck = cleanupCheck(machine, 'networkDomainClosed')
  if (
    networkCheck.result === 'pending' &&
    machine.cleanupSessionId !== null &&
    !machine.cleanupDisableAttempted &&
    !machine.cdpConnectionClosed
  ) {
    machine.cleanupDisableAttempted = true
    requestProtocolCommand(machine, 'Network.disable')
    return
  }
  const targetCheck = cleanupCheck(machine, 'targetSessionClosed')
  if (
    targetCheck.result === 'pending' &&
    machine.cleanupSessionId !== null &&
    !machine.cleanupDetachAttempted &&
    !machine.cdpConnectionClosed
  ) {
    machine.cleanupDetachAttempted = true
    requestProtocolCommand(machine, 'Target.detachFromTarget')
    return
  }
  machine.cleanupProtocolSendsFinished = true
  if (mapSize(machine.openCommandIds) > 0) {
    machine.cleanupPurpose = 'await-cleanup-protocol-responses'
    requestObservationDequeue(machine, 'cleanup')
    return
  }
  startNextCleanupStep(machine)
}

function startNextCleanupStep(machine) {
  machine.cleanupPurpose = null
  machine.cleanupPendingCheckId = null
  if (machine.cleanupStepIndex >= CLEANUP_STEPS.length) {
    finishCleanupChecks(machine)
    return
  }
  const step = CLEANUP_STEPS[machine.cleanupStepIndex]
  machine.cleanupExternalStarted = true
  requestCleanupStep(machine, step[0], step[1])
}

function finishCleanupChecks(machine) {
  for (let index = 0; index < machine.cleanupChecks.length - 1; index += 1) {
    if (machine.cleanupChecks[index].result === 'pending') {
      machine.cleanupChecks[index].result = 'unproven'
    }
  }
  if (
    machine.capStates.cleanup === 'armed' &&
    requestCapCancel(machine, 'cleanup', 'cleanup-final')
  ) {
    return
  }
  terminalCleanupControlFailure(machine)
}

function handleCleanupMalformed(machine, context) {
  machine.cleanupViolation = true
  if (machine.cleanupLedger !== null) {
    machine.cleanupLedger.cleanupViolation = true
  }
  if (context.type === 'cap-cancel') {
    machine.capStates[context.capKind] = 'terminal-unknown'
    if (context.purpose === 'post-o0-old-cap') {
      continuePostSnapshotOldCapCancels(machine)
      return
    }
    terminalCleanupControlFailure(machine)
    return
  }
  if (context.type === 'cap-arm' && context.capKind === 'cleanup') {
    machine.capStates.cleanup = 'activation-unknown'
    if (requestCapCancel(machine, 'cleanup', 'cleanup-arm-recovery')) {
      return
    }
    terminalCleanupControlFailure(machine)
    return
  }
  if (context.type === 'protocol-command-send') {
    machine.operationLedger[context.command].sendUnknown = true
    const checkId = context.command === 'Network.disable'
      ? 'networkDomainClosed'
      : 'targetSessionClosed'
    setCleanupCheck(machine, checkId, 'failed')
    continueCleanupOperations(machine)
    return
  }
  if (context.type === 'cleanup-step') {
    setCleanupCheck(machine, context.checkId, 'failed')
    machine.cleanupStepIndex += 1
    startNextCleanupStep(machine)
    return
  }
  machine.heldDequeuedObservation = null
  machine.heldDequeuePhase = null
  terminalCleanupControlFailure(machine)
}

function handleCleanupRejection(machine, context) {
  if (context.type === 'cap-cancel') {
    machine.capStates[context.capKind] = 'terminal-unknown'
    machine.cleanupViolation = true
    if (machine.cleanupLedger !== null) {
      machine.cleanupLedger.cleanupViolation = true
    }
    if (context.purpose === 'post-o0-old-cap') {
      continuePostSnapshotOldCapCancels(machine)
      return
    }
    terminalCleanupControlFailure(machine)
    return
  }
  if (context.type === 'cap-arm' && context.capKind === 'cleanup') {
    machine.capStates.cleanup = 'activation-unknown'
    machine.cleanupViolation = true
    if (requestCapCancel(machine, 'cleanup', 'cleanup-arm-recovery')) {
      return
    }
    terminalCleanupControlFailure(machine)
    return
  }
  if (context.type === 'protocol-command-send') {
    machine.operationLedger[context.command].sendUnknown = true
    const checkId = context.command === 'Network.disable'
      ? 'networkDomainClosed'
      : 'targetSessionClosed'
    setCleanupCheck(machine, checkId, 'failed')
    continueCleanupOperations(machine)
    return
  }
  if (context.type === 'cleanup-step') {
    setCleanupCheck(machine, context.checkId, 'failed')
    machine.cleanupStepIndex += 1
    startNextCleanupStep(machine)
    return
  }
  if (context.type === 'clock-sample' || context.type === 'observation-dequeue') {
    machine.heldDequeuedObservation = null
    machine.heldDequeuePhase = null
    machine.cleanupViolation = true
    if (
      machine.capStates.cleanup === 'armed' &&
      requestCapCancel(machine, 'cleanup', 'cleanup-recovery')
    ) {
      return
    }
  }
  terminalCleanupControlFailure(machine)
}

function terminalCleanupControlFailure(machine) {
  machine.cleanupViolation = true
  machine.cleanupFinalizeReason = 'cleanup-terminal-failure'
  if (machine.cleanupLedger !== null) {
    machine.cleanupLedger.cleanupViolation = true
  }
  if (
    machine.portState === 'open' &&
    machine.lease === LEASE_IDLE &&
    isOneOf(machine.capStates.cleanup, [
      'armed',
      'active',
      'activation-unknown',
      'arm-pending',
    ]) &&
    !machine.capCancelAttempted.cleanup
  ) {
    if (requestCapCancel(machine, 'cleanup', 'cleanup-recovery')) {
      return
    }
  }
  finalizeCleanup(machine, 'cleanup-terminal-failure', 'mismatch')
}

function recoverOrFinalizeCleanup(machine) {
  if (
    machine.portState === 'open' &&
    machine.lease === LEASE_IDLE &&
    machine.capStates.cleanup === 'armed' &&
    !machine.capCancelAttempted.cleanup &&
    requestCapCancel(machine, 'cleanup', 'cleanup-recovery')
  ) {
    return
  }
  finalizeCleanup(machine, 'cleanup-terminal-failure', 'mismatch')
}

function isOrdinaryEmptyCleanupResult(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  let isArray
  let prototype
  let keys
  try {
    isArray = capturedArrayIsArray(value)
    prototype = capturedGetPrototypeOf(value)
    keys = capturedReflectOwnKeys(value)
  } catch {
    throw new TypeError('cleanupResultReflectionFailed')
  }
  return isArray === false &&
    prototype === capturedObjectPrototype &&
    keys.length === 0
}

function inspectCleanupCdpMessage(machine, message) {
  const idObservation = inspectOpenDataDescriptor(message, 'id', true)
  if (!idObservation.valid) {
    throw new TypeError('unreadableCleanupResponseId')
  }
  const id = idObservation.descriptor.value
  if (!capturedNumberIsSafeInteger(id) || id < 1) {
    throw new TypeError('invalidCleanupResponseId')
  }
  if (machine.cleanupPurpose !== 'await-cleanup-protocol-responses') {
    machine.cleanupViolation = true
    requestObservationDequeue(machine, 'cleanup')
    return
  }
  if (!capturedReflectApply(capturedMapHas, machine.openCommandIds, [id])) {
    machine.cleanupViolation = true
    requestObservationDequeue(machine, 'cleanup')
    return
  }
  const command = capturedReflectApply(capturedMapGet, machine.openCommandIds, [id])
  const checkId = command === 'Network.disable'
    ? 'networkDomainClosed'
    : 'targetSessionClosed'
  let ordinaryMalformed = false
  if (command === 'Network.disable') {
    const sessionObservation = inspectOpenDataDescriptor(message, 'sessionId', true)
    if (!sessionObservation.valid) {
      throw new TypeError('unreadableCleanupResponseSession')
    }
    const responseSession = sessionObservation.descriptor.value
    if (!isEphemeralIdentifier(responseSession)) {
      throw new TypeError('invalidCleanupResponseSession')
    }
    if (responseSession !== machine.cleanupSessionId) {
      machine.cleanupViolation = true
      requestObservationDequeue(machine, 'cleanup')
      return
    }
  } else {
    const sessionObservation = inspectOpenDataDescriptor(message, 'sessionId', false)
    if (!sessionObservation.valid) {
      throw new TypeError('unreadableCleanupResponseSession')
    }
    if (sessionObservation.present) {
      if (!isEphemeralIdentifier(sessionObservation.descriptor.value)) {
        throw new TypeError('invalidCleanupResponseSession')
      }
      machine.cleanupViolation = true
      requestObservationDequeue(machine, 'cleanup')
      return
    }
  }
  const errorObservation = inspectOpenDataDescriptor(message, 'error', false)
  if (!errorObservation.valid) {
    ordinaryMalformed = true
  }
  if (ordinaryMalformed) {
    machine.cleanupViolation = true
    setCleanupCheck(machine, checkId, 'failed')
  } else if (errorObservation.present) {
    setCleanupCheck(machine, checkId, 'failed')
  } else {
    const resultObservation = inspectOpenDataDescriptor(message, 'result', true)
    if (
      !resultObservation.valid ||
      !isOrdinaryEmptyCleanupResult(resultObservation.descriptor.value)
    ) {
      machine.cleanupViolation = true
      setCleanupCheck(machine, checkId, 'failed')
    } else {
      setCleanupCheck(machine, checkId, 'confirmed')
    }
  }
  capturedReflectApply(capturedMapDelete, machine.openCommandIds, [id])
  capturedReflectApply(capturedMapSet, machine.completedCommandIds, [id, command])
  if (mapSize(machine.openCommandIds) > 0) {
    requestObservationDequeue(machine, 'cleanup')
  } else {
    startNextCleanupStep(machine)
  }
}

function handleCleanupFact(machine, envelope) {
  if (
    machine.cleanupPurpose !== 'await-cleanup-fact' ||
    machine.cleanupPendingCheckId === null
  ) {
    machine.cleanupViolation = true
    if (machine.cleanupPurpose === 'await-cleanup-protocol-responses') {
      requestObservationDequeue(machine, 'cleanup')
    } else {
      requestObservationDequeue(machine, 'cleanup')
    }
    return
  }
  if (envelope.checkId !== machine.cleanupPendingCheckId) {
    machine.cleanupViolation = true
    requestObservationDequeue(machine, 'cleanup')
    return
  }
  setCleanupCheck(
    machine,
    envelope.checkId,
    envelope.fact === false ? 'failed' : 'unproven'
  )
  machine.cleanupPurpose = null
  machine.cleanupPendingCheckId = null
  machine.cleanupStepIndex += 1
  startNextCleanupStep(machine)
}

function continueCleanupAfterConnectionClose(machine) {
  if (machine.cleanupPurpose === 'await-cleanup-protocol-responses') {
    const closeChecks = ['networkDomainClosed', 'targetSessionClosed']
    for (let index = 0; index < closeChecks.length; index += 1) {
      const check = cleanupCheck(machine, closeChecks[index])
      if (check.result === 'pending') {
        check.result = 'unproven'
      }
    }
    capturedReflectApply(capturedMapClear, machine.openCommandIds, [])
    startNextCleanupStep(machine)
    return
  }
  if (machine.cleanupPurpose === 'await-cleanup-fact') {
    requestObservationDequeue(machine, 'cleanup')
    return
  }
  continueCleanupOperations(machine)
}

function comparisonResult(observationState, replayValue, historicalValue) {
  if (observationState !== 'observed') {
    return 'unproven'
  }
  return replayValue === historicalValue ? 'match' : 'mismatch'
}

function invariantResult(requiredOperands, predicate) {
  for (let index = 0; index < requiredOperands.length; index += 1) {
    if (requiredOperands[index].observationState !== 'observed') {
      return 'unproven'
    }
  }
  return predicate() ? 'match' : 'mismatch'
}

function createReplayProjection(runBinding) {
  const operands = runBinding.replayOperands
  const comparisons = new CapturedArray(REPLAY_DEFINITIONS.length)
  for (let index = 0; index < REPLAY_DEFINITIONS.length; index += 1) {
    const definition = REPLAY_DEFINITIONS[index]
    const operand = operands[index]
    defineArrayElement(comparisons, index, {
      fieldId: definition[0],
      comparisonBasis: definition[1],
      observationState: operand.observationState,
      historicalValue: definition[2],
      replayValue: operand.replayValue,
      result: comparisonResult(
        operand.observationState,
        operand.replayValue,
        definition[2]
      ),
    })
  }

  const i1 = invariantResult([operands[36], operands[37]], function checkI1() {
    return operands[36].replayValue === operands[37].replayValue + '/'
  })
  const i2 = invariantResult(
    [operands[44], operands[45], operands[46], operands[47], operands[48]],
    function checkI2() {
      return operands[44].replayValue ===
        operands[45].replayValue + '://' + operands[46].replayValue + ':' +
        CapturedString(operands[47].replayValue) + operands[48].replayValue
    }
  )
  const i3 = invariantResult(
    [operands[45], operands[46], operands[47], operands[48], operands[50], operands[51], operands[52], operands[55]],
    function checkI3() {
      const port = CapturedString(operands[51].replayValue)
      return operands[46].replayValue === '127.0.0.1' &&
        operands[50].replayValue === '127.0.0.1' &&
        operands[47].replayValue === operands[51].replayValue &&
        operands[52].replayValue === '"' + port + '"' &&
        operands[55].replayValue === operands[45].replayValue + '://' +
          operands[50].replayValue + ':' + port + operands[48].replayValue
    }
  )
  const i4 = invariantResult(
    [operands[37], operands[53], operands[54]],
    function checkI4() {
      return operands[54].replayValue === 'matches-frontend-origin' &&
        operands[53].replayValue === operands[37].replayValue
    }
  )
  const i5 = invariantResult([operands[44], operands[55]], function checkI5() {
    return operands[44].replayValue === operands[55].replayValue
  })
  let i6 = 'unproven'
  if (
    operands[58].observationState === 'observed' &&
    runBinding.viteRuntimeVersionObservation !== null
  ) {
    i6 = operands[58].replayValue === runBinding.viteRuntimeVersionObservation
      ? 'match'
      : 'mismatch'
  }
  let profileLifecycle = 'unknown'
  let newInstanceConfirmed = false
  let historicalInstanceReused = false
  const profileObservation = runBinding.profileInstanceObservation
  if (
    profileObservation.newInstanceObserved === true &&
    profileObservation.historicalInstanceReuseObserved === false
  ) {
    profileLifecycle = 'fresh-disposable-new-instance-confirmed'
    newInstanceConfirmed = true
  } else if (
    profileObservation.newInstanceObserved === false &&
    profileObservation.historicalInstanceReuseObserved === true
  ) {
    profileLifecycle = 'reused'
    historicalInstanceReused = true
  }
  let i7 = 'unproven'
  if (operands[24].observationState === 'observed') {
    if (
      operands[24].replayValue === 'fresh-disposable' &&
      newInstanceConfirmed === true
    ) {
      i7 = 'match'
    } else if (profileLifecycle !== 'unknown') {
      i7 = 'mismatch'
    }
  }
  const invariants = [i1, i2, i3, i4, i5, i6, i7]

  const deviation = runBinding.unexplainedCausalDeviationObservation
  let noUnexplainedCausalDeviation = 'unproven'
  if (deviation.reviewCompleted === true && deviation.deviationObserved === false) {
    noUnexplainedCausalDeviation = 'confirmed'
  } else if (deviation.reviewCompleted === true && deviation.deviationObserved === true) {
    noUnexplainedCausalDeviation = 'contradicted'
  }

  let hasMismatch = noUnexplainedCausalDeviation === 'contradicted'
  let hasUnproven = noUnexplainedCausalDeviation === 'unproven'
  for (let index = 0; index < comparisons.length; index += 1) {
    hasMismatch = hasMismatch || comparisons[index].result === 'mismatch'
    hasUnproven = hasUnproven || comparisons[index].result === 'unproven'
  }
  for (let index = 0; index < invariants.length; index += 1) {
    hasMismatch = hasMismatch || invariants[index] === 'mismatch'
    hasUnproven = hasUnproven || invariants[index] === 'unproven'
  }
  const replayResult = hasMismatch
    ? 'DIVERGED'
    : (hasUnproven ? 'UNPROVEN' : 'EQUIVALENT')

  function replayValue(index) {
    return operands[index].replayValue
  }

  return deepFreezeGenerated({
    replayContextId: runBinding.replayContextId,
    repositoryCommit: runBinding.repositoryCommit,
    repositoryState: replayValue(8),
    profileInstanceBinding: {
      lifecycle: profileLifecycle,
      newInstanceConfirmed,
      historicalInstanceReused,
    },
    causalContext: {
      hostRuntime: { executionClass: replayValue(9) },
      operatingSystem: {
        family: replayValue(10),
        edition: replayValue(11),
        architecture: replayValue(12),
        version: replayValue(13),
        build: replayValue(14),
        patch: replayValue(15),
      },
      node: { version: replayValue(16) },
      browser: {
        product: replayValue(17),
        channel: replayValue(18),
        version: replayValue(19),
        engine: replayValue(20),
        engineBuild: replayValue(21),
        executionMode: replayValue(22),
        privateMode: replayValue(23),
      },
      profile: {
        lifecycle: replayValue(24),
        extensions: replayValue(25),
        startParameters: replayValue(26),
        featureFlags: replayValue(27),
        enterprisePolicies: replayValue(28),
      },
      networkEnvironment: { proxy: replayValue(29), vpn: replayValue(30) },
      initialState: {
        serviceWorker: replayValue(31),
        permission: replayValue(32),
        preflightCache: replayValue(33),
        siteCache: replayValue(34),
      },
      bindingComparisonProfile: replayValue(35),
      frontend: {
        topLevelUrl: replayValue(36),
        serializedOrigin: replayValue(37),
        contextKind: replayValue(38),
        isSecureContext: replayValue(39),
      },
      transportRequest: {
        factoryProfile: replayValue(40),
        compositionProfile: replayValue(41),
        requestProfile: replayValue(42),
        requestEqualityMethod: replayValue(43),
        initialUrl: replayValue(44),
        initialScheme: replayValue(45),
        initialHost: replayValue(46),
        initialPort: replayValue(47),
        initialPath: replayValue(48),
        requestInitProfile: replayValue(49),
      },
      gateway: {
        listenerHost: replayValue(50),
        listenerPort: replayValue(51),
        portEnvironmentValue: replayValue(52),
        allowedOrigin: {
          value: replayValue(53),
          relationToFrontend: replayValue(54),
        },
        endpoint: replayValue(55),
        responderProfile: replayValue(56),
        responseProfile: replayValue(57),
      },
      toolchain: {
        vite: {
          lockfileVersion: replayValue(58),
          runtimeVersion: runBinding.viteRuntimeVersionObservation,
        },
      },
    },
    equivalence: {
      relationId: 'adr-0032-causal-replay-v2',
      comparisons,
      noUnexplainedCausalDeviation,
      result: replayResult,
    },
  })
}

function countClass(count) {
  if (count === 0) {
    return 'zero'
  }
  return count === 1 ? 'one' : 'multiple'
}

function projectOperation(machine, command) {
  const state = machine.operationLedger[command]
  let observedCountClass
  let result
  if (state.ackCount >= 2) {
    observedCountClass = 'multiple'
    result = 'mismatch'
  } else if (state.ackCount === 1) {
    observedCountClass = 'one'
    result = 'match'
  } else if (state.intentCount === 0) {
    observedCountClass = 'zero'
    result = state.safelyGated ? 'match' : 'unproven'
  } else {
    observedCountClass = 'unknown'
    result = 'unproven'
  }
  return {
    command,
    allowedMaximum: 1,
    observedCountClass,
    result,
  }
}

function createProtocolOperations(machine, start, end) {
  const operations = new CapturedArray(end - start)
  for (let index = start; index < end; index += 1) {
    defineArrayElement(
      operations,
      index - start,
      projectOperation(machine, PROTOCOL_COMMANDS[index])
    )
  }
  return operations
}

function createIntegrityChecks(machine) {
  const checks = new CapturedArray(INTEGRITY_CHECK_IDS.length)
  for (let index = 0; index < INTEGRITY_CHECK_IDS.length; index += 1) {
    const checkId = INTEGRITY_CHECK_IDS[index]
    let result = 'unproven'
    if (checkId === 'protocolAllowlistOnly') {
      result = 'confirmed'
    } else if (
      checkId === 'singleTargetAndSessionConfirmed' &&
      machine.targetBindingContradiction === true
    ) {
      result = 'violated'
    } else if (
      checkId === 'singleMainWorldEvaluationConfirmed' &&
      machine.evaluateReplyCountClass === 'multiple'
    ) {
      result = 'violated'
    }
    defineArrayElement(checks, index, { checkId, result })
  }
  return checks
}

function deriveInterferenceObservation(integrityChecks) {
  let allConfirmed = true
  for (let index = 0; index < integrityChecks.length; index += 1) {
    if (integrityChecks[index].result === 'violated') {
      return 'contract-visible-detected'
    }
    allConfirmed = allConfirmed && integrityChecks[index].result === 'confirmed'
  }
  return allConfirmed ? 'none-contract-visible-detected' : 'unknown'
}

function copyStage(stage) {
  return {
    stageId: stage.stageId,
    layer: stage.layer,
    observationState: stage.observationState,
    receiptOrder: stage.receiptOrder,
    result: stage.result,
    clockDomain: stage.clockDomain,
    relativeMilliseconds: stage.relativeMilliseconds,
    timingState: stage.timingState,
  }
}

function copyStages(machine, start, end) {
  const stages = new CapturedArray(end - start)
  for (let index = start; index < end; index += 1) {
    defineArrayElement(stages, index - start, copyStage(machine.stages[index]))
  }
  return stages
}

function nextReceiptOrder(machine, layer) {
  machine.receiptOrders[layer] += 1
  return machine.receiptOrders[layer]
}

function demoteObservedStage(machine, index) {
  const stage = machine.stages[index]
  if (stage.observationState !== 'observed') {
    return false
  }
  const layer = stage.layer
  const removedReceiptOrder = stage.receiptOrder
  for (let stageIndex = 0; stageIndex < machine.stages.length; stageIndex += 1) {
    const laterStage = machine.stages[stageIndex]
    if (
      stageIndex !== index &&
      laterStage.layer === layer &&
      laterStage.observationState === 'observed' &&
      laterStage.receiptOrder > removedReceiptOrder
    ) {
      laterStage.receiptOrder -= 1
    }
  }
  machine.receiptOrders[layer] -= 1
  stage.observationState = 'ambiguous'
  stage.receiptOrder = null
  stage.result = 'unproven'
  stage.relativeMilliseconds = null
  stage.timingState = 'unavailable'
  return true
}

function observeStage(machine, index, result, timing) {
  const stage = machine.stages[index]
  if (stage.observationState === 'observed') {
    demoteObservedStage(machine, index)
    return false
  }
  if (stage.observationState === 'ambiguous') {
    return false
  }
  stage.observationState = 'observed'
  stage.receiptOrder = nextReceiptOrder(machine, stage.layer)
  stage.result = result
  stage.relativeMilliseconds = timing === null ? null : timing.relativeMilliseconds
  stage.timingState = timing === null ? 'unavailable' : timing.timingState
  return true
}

function roundedTiming(rawMilliseconds) {
  if (
    typeof rawMilliseconds !== 'number' ||
    !capturedNumberIsFinite(rawMilliseconds) ||
    rawMilliseconds < 0
  ) {
    return null
  }
  if (rawMilliseconds >= DURATION_CAP_MILLISECONDS) {
    return { relativeMilliseconds: DURATION_CAP_MILLISECONDS, timingState: 'at-or-above-cap' }
  }
  return {
    relativeMilliseconds: 10 * capturedMathFloor(rawMilliseconds / 10),
    timingState: 'measured',
  }
}

function createRequestBudget(machine) {
  const networkOrderMismatch =
    (
      machine.stages[2].observationState === 'observed' &&
      machine.stages[2].receiptOrder !== 1
    ) ||
    (
      machine.stages[3].observationState === 'observed' &&
      machine.stages[3].receiptOrder !== 2
    ) ||
    (
      machine.stages[4].observationState === 'observed' &&
      machine.stages[4].receiptOrder !== 3
    ) ||
    (
      machine.stages[5].observationState === 'observed' &&
      machine.stages[5].receiptOrder !== 4
    ) ||
    (
      machine.stages[6].observationState === 'observed' &&
      machine.stages[6].receiptOrder !== 5
    )
  let sequence = 'incomplete'
  if (machine.endpointAttributionAmbiguous) {
    sequence = 'ambiguous'
  } else if (machine.networkSequenceOther || networkOrderMismatch) {
    sequence = 'other'
  } else if (
    machine.endpointOptionsCount === 1 &&
    machine.endpointPostsCount === 1 &&
    machine.endpointOtherMethodsCount === 0 &&
    machine.stages[2].observationState === 'observed' &&
    machine.stages[2].result === 'match' &&
    machine.stages[3].observationState === 'observed' &&
    machine.stages[3].result === 'match' &&
    machine.stages[4].observationState === 'observed' &&
    machine.stages[4].result === 'match' &&
    machine.stages[5].observationState === 'observed' &&
    machine.stages[5].result === 'match' &&
    machine.stages[6].stageId === 'post-loading-finished' &&
    machine.stages[6].observationState === 'observed'
  ) {
    sequence = 'OPTIONS-204-POST-200-loadingFinished'
  }
  return {
    defaultTransportCalls: machine.derivedTransportCallCount,
    retries: 'zero',
    directDiagnosticFetches: 'zero',
    negativeOriginRuns: 'zero',
    redirectRuns: 'zero',
    observerProductEndpointRequests: 'zero',
    endpointOptions: machine.networkCountsUnknown
      ? 'unknown'
      : countClass(machine.endpointOptionsCount),
    endpointPosts: machine.networkCountsUnknown
      ? 'unknown'
      : countClass(machine.endpointPostsCount),
    endpointOtherMethods: machine.networkCountsUnknown
      ? 'unknown'
      : countClass(machine.endpointOtherMethodsCount),
    sequence,
  }
}

function createObserverObservation(machine, operationEnd) {
  const integrityChecks = createIntegrityChecks(machine)
  return {
    deltaProfile: 'adr-0030-passive-external-observer-v1',
    controllerExclusivity: 'unknown',
    connectionProfile: 'unknown',
    targetProfile: machine.targetProfile,
    foundationSha256: null,
    evaluationSha256: machine.operationLedger['Runtime.evaluate'].ackCount === 1
      ? EVALUATION_SHA256
      : null,
    controllerEvaluateIntentCount: machine.evaluateIntentCount === 0 ? 'zero' : 'one',
    protocolOperations: createProtocolOperations(machine, 0, operationEnd),
    mainWorldEvaluationCount: machine.mainWorldEvaluationCount,
    transportFactoryCallCount: machine.derivedFactoryCallCount,
    primitiveProjectionProfile:
      'immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle',
    integrityChecks,
    interferenceObservation: deriveInterferenceObservation(integrityChecks),
  }
}

function createTimingObservation() {
  return {
    roundingMilliseconds: 10,
    durationCapMilliseconds: DURATION_CAP_MILLISECONDS,
    setupWindowMilliseconds: SETUP_WINDOW_MILLISECONDS,
    captureWindowMilliseconds: CAPTURE_WINDOW_MILLISECONDS,
    clockDomains: [
      {
        clockDomain: 'controller-monotonic',
        source: 'controller-monotonic-fixed-v1',
        comparisonScope: 'setup-observation-and-cleanup-only',
      },
      {
        clockDomain: 'javascript-main-world',
        source: 'window.performance.now',
        comparisonScope: 'transport-dispatch-and-public-settlement-only',
      },
      {
        clockDomain: 'browser-network',
        source: 'cdp-network-monotonic-time',
        comparisonScope: 'endpoint-network-events-only',
      },
    ],
    calibration: 'none',
    crossDomainComparison: 'forbidden',
  }
}

function freezeObservationSnapshot(machine) {
  if (machine.preCleanupObservationSnapshot !== null) {
    return
  }
  finalizeEvaluationKnowledgeForSnapshot(machine)
  machine.requestBudgetFinalized = true
  const replay = createReplayProjection(machine.runBinding)
  const observerObservation = createObserverObservation(machine, 4)
  const snapshot = {
    historicalEvidence: {
      recordPath: 'docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json',
      recordSha256: 'ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33',
      measurementRunId: 'chrome-stable-win-01',
      baseContextId: 'chrome-stable-win-t0-01',
      overallGate: 'FAIL',
    },
    replay,
    observerObservation,
    requestBudget: createRequestBudget(machine),
    publicSettlement: machine.publicSettlement === null
      ? null
      : {
        observationState: machine.publicSettlement.observationState,
        outcome: machine.publicSettlement.outcome,
        staticProfileResult: machine.publicSettlement.staticProfileResult,
        deadlineRelation: machine.publicSettlement.deadlineRelation,
        internalStage: 'unknown',
        internalOwner: 'unknown',
      },
    stagesOneThroughEight: copyStages(machine, 0, 8),
    timingObservation: createTimingObservation(),
    observationCompletion: {
      productEvidenceComplete: machine.productEvidenceComplete,
      observationCloseReason: machine.observationCloseReason,
      observationClosed: true,
      captureWindowState: machine.captureWindowState,
      evaluateReplyCountClass: machine.evaluateReplyCountClass,
      requestBudgetFinalized: true,
    },
    stickyViolation: machine.stickyViolation,
  }
  machine.preCleanupObservationSnapshot = deepFreezeGenerated(snapshot)

  // ADR 0037: consume the separate role after O0, before any cleanup transition.
  let observationClosed = machine.activeObservationClosed
  machine.activeObservationClosed = null
  if (
    machine.observationNotificationState !== 'armed' ||
    typeof observationClosed !== 'function'
  ) {
    machine.observationNotificationViolation = true
  } else {
    machine.observationNotificationState = 'invoking'
    try {
      if (capturedReflectApply(observationClosed, undefined, []) !== undefined) {
        machine.observationNotificationViolation = true
      }
    } catch {
      machine.observationNotificationViolation = true
    }
  }
  observationClosed = null
  machine.observationNotificationState = 'consumed'
  if (machine.observationNotificationViolation) {
    machine.cleanupInitialViolation = true
  }
}

function createCleanupCheckMap() {
  const checks = new CapturedArray(CLEANUP_CHECK_IDS.length)
  for (let index = 0; index < CLEANUP_CHECK_IDS.length; index += 1) {
    defineArrayElement(checks, index, {
      checkId: CLEANUP_CHECK_IDS[index],
      result: 'pending',
    })
  }
  return checks
}

function cleanupCheck(machine, checkId) {
  const checks = machine.cleanupChecks
  for (let index = 0; index < checks.length; index += 1) {
    if (checks[index].checkId === checkId) {
      return checks[index]
    }
  }
  return null
}

function setCleanupCheck(machine, checkId, result) {
  const check = cleanupCheck(machine, checkId)
  if (check !== null && check.result === 'pending') {
    check.result = result
  }
}

function initializeCleanupLedger(machine) {
  if (machine.cleanupLedger !== null) {
    return
  }
  machine.phase = 'cleanup'
  machine.cleanupChecks = createCleanupCheckMap()
  machine.cleanupSessionId = machine.sessionId
  setCleanupCheck(machine, 'cleanupStarted', 'confirmed')
  setCleanupCheck(machine, 'controllerObservationClosed', 'confirmed')
  setCleanupCheck(machine, 'objectGroupsAbsentOrReleased', 'confirmed')
  setCleanupCheck(machine, 'rawEventsDiscarded', 'confirmed')
  setCleanupCheck(machine, 'ephemeralIdentifiersDiscarded', 'confirmed')

  const enableState = machine.operationLedger['Network.enable']
  if (enableState.intentCount === 0) {
    setCleanupCheck(machine, 'networkDomainClosed', 'confirmed')
    machine.operationLedger['Network.disable'].safelyGated = true
  } else {
    machine.operationLedger['Network.disable'].safelyGated = false
    if (machine.sessionId === null) {
      setCleanupCheck(machine, 'networkDomainClosed', 'unproven')
    }
  }
  const attachState = machine.operationLedger['Target.attachToTarget']
  if (attachState.intentCount === 0) {
    setCleanupCheck(machine, 'targetSessionClosed', 'confirmed')
    machine.operationLedger['Target.detachFromTarget'].safelyGated = true
  } else {
    machine.operationLedger['Target.detachFromTarget'].safelyGated = false
    if (machine.sessionId === null) {
      setCleanupCheck(machine, 'targetSessionClosed', 'unproven')
    }
  }

  observeStage(machine, 8, 'match', null)
  machine.cleanupLedger = {
    cleanupProtocolOperations: null,
    cleanupStages: null,
    checks: machine.cleanupChecks,
    cleanupViolation: machine.cleanupViolation || machine.cleanupInitialViolation,
    result: 'pending',
    cleanupFinalizeReason: null,
    cleanupFinalized: false,
  }
}

function terminalizePendingCleanupChecks(machine, completionResult) {
  for (let index = 0; index < machine.cleanupChecks.length - 1; index += 1) {
    if (machine.cleanupChecks[index].result === 'pending') {
      machine.cleanupChecks[index].result = 'unproven'
    }
  }
  const completion = machine.cleanupChecks[machine.cleanupChecks.length - 1]
  completion.result = completionResult
}

function deriveCleanupResult(machine) {
  if (machine.cleanupViolation || machine.cleanupInitialViolation) {
    return 'FAIL'
  }
  let unproven = false
  for (let index = 0; index < machine.cleanupChecks.length; index += 1) {
    const result = machine.cleanupChecks[index].result
    if (result === 'failed') {
      return 'FAIL'
    }
    unproven = unproven || result === 'unproven'
  }
  return unproven ? 'UNPROVEN' : 'PASS'
}

function finalizeCleanup(machine, reason, stageTenProfile) {
  if (machine.cleanupLedger === null || machine.cleanupLedger.cleanupFinalized) {
    return
  }
  machine.cleanupFinalizeReason = reason
  if (stageTenProfile === 'cap') {
    terminalizePendingCleanupChecks(machine, 'unproven')
    machine.stages[9].observationState = 'not-observed'
    machine.stages[9].receiptOrder = null
    machine.stages[9].result = 'unproven'
    machine.stages[9].relativeMilliseconds = null
    machine.stages[9].timingState = 'unavailable'
  } else if (stageTenProfile === 'match') {
    terminalizePendingCleanupChecks(machine, 'confirmed')
  } else {
    terminalizePendingCleanupChecks(machine, 'failed')
    observeStage(machine, 9, 'mismatch', null)
  }
  machine.cleanupLedger.cleanupProtocolOperations = createProtocolOperations(machine, 4, 6)
  machine.cleanupLedger.cleanupStages = copyStages(machine, 8, 10)
  machine.cleanupLedger.cleanupViolation =
    machine.cleanupViolation || machine.cleanupInitialViolation
  machine.cleanupLedger.result = deriveCleanupResult(machine)
  machine.cleanupLedger.cleanupFinalizeReason = reason
  machine.cleanupLedger.cleanupFinalized = true
  deepFreezeGenerated(machine.cleanupLedger)
  closePortAndLease(machine)
  settleMachineWithProjection(machine)
}

function finalizeCleanupPortlessly(machine) {
  if (machine.preCleanupObservationSnapshot === null) {
    return
  }
  if (machine.cleanupLedger === null) {
    initializeCleanupLedger(machine)
  }
  machine.cleanupViolation = true
  machine.cleanupLedger.cleanupViolation = true
  finalizeCleanup(machine, 'cleanup-terminal-failure', 'mismatch')
}

function cloneGeneratedTree(value) {
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (capturedArrayIsArray(value)) {
    const lengthDescriptor = capturedGetOwnPropertyDescriptor(value, 'length')
    const clone = new CapturedArray(lengthDescriptor.value)
    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      const descriptor = capturedGetOwnPropertyDescriptor(
        value,
        CapturedString(index)
      )
      defineArrayElement(clone, index, cloneGeneratedTree(descriptor.value))
    }
    return clone
  }
  const prototype = capturedGetPrototypeOf(value)
  const clone = capturedObjectCreate(prototype)
  const keys = capturedReflectOwnKeys(value)
  for (let index = 0; index < keys.length; index += 1) {
    const descriptor = capturedGetOwnPropertyDescriptor(value, keys[index])
    capturedDefineProperty(clone, keys[index], {
      value: cloneGeneratedTree(descriptor.value),
      writable: true,
      enumerable: true,
      configurable: true,
    })
  }
  return clone
}

function collectGeneratedIdentities(value, identities) {
  if (value === null || typeof value !== 'object') {
    return
  }
  if (capturedReflectApply(capturedWeakSetHas, identities, [value])) {
    return
  }
  capturedReflectApply(capturedWeakSetAdd, identities, [value])
  if (capturedArrayIsArray(value)) {
    const length = capturedGetOwnPropertyDescriptor(value, 'length').value
    for (let index = 0; index < length; index += 1) {
      const descriptor = capturedGetOwnPropertyDescriptor(value, CapturedString(index))
      collectGeneratedIdentities(descriptor.value, identities)
    }
    return
  }
  const keys = capturedReflectOwnKeys(value)
  for (let index = 0; index < keys.length; index += 1) {
    const descriptor = capturedGetOwnPropertyDescriptor(value, keys[index])
    collectGeneratedIdentities(descriptor.value, identities)
  }
}

function assertClosedFrozenProjectionTree(value, forbidden, observed) {
  if (value === null) {
    return
  }
  const valueType = typeof value
  if (valueType !== 'object') {
    if (
      valueType === 'string' ||
      valueType === 'boolean' ||
      (valueType === 'number' && capturedNumberIsFinite(value))
    ) {
      return
    }
    throw new TypeError('invalidProjectionLeaf')
  }
  if (
    capturedReflectApply(capturedWeakSetHas, forbidden, [value]) ||
    capturedReflectApply(capturedWeakSetHas, observed, [value])
  ) {
    throw new TypeError('nonFreshProjectionNode')
  }
  capturedReflectApply(capturedWeakSetAdd, observed, [value])
  if (!capturedObjectIsFrozen(value)) {
    throw new TypeError('unfrozenProjectionNode')
  }
  const keys = capturedReflectOwnKeys(value)
  if (capturedArrayIsArray(value)) {
    if (capturedGetPrototypeOf(value) !== capturedArrayPrototype) {
      throw new TypeError('invalidProjectionArrayPrototype')
    }
    const lengthDescriptor = capturedGetOwnPropertyDescriptor(value, 'length')
    if (
      lengthDescriptor === undefined ||
      !capturedNumberIsSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0 ||
      lengthDescriptor.enumerable !== false ||
      lengthDescriptor.writable !== false ||
      lengthDescriptor.configurable !== false ||
      keys.length !== lengthDescriptor.value + 1 ||
      keys[lengthDescriptor.value] !== 'length'
    ) {
      throw new TypeError('invalidProjectionArray')
    }
    for (let index = 0; index < lengthDescriptor.value; index += 1) {
      const key = CapturedString(index)
      if (keys[index] !== key) {
        throw new TypeError('invalidProjectionArrayKey')
      }
      const descriptor = capturedGetOwnPropertyDescriptor(value, key)
      if (
        descriptor === undefined ||
        capturedObjectHasOwn(descriptor, 'value') !== true ||
        capturedObjectHasOwn(descriptor, 'get') === true ||
        capturedObjectHasOwn(descriptor, 'set') === true ||
        descriptor.enumerable !== true ||
        descriptor.writable !== false ||
        descriptor.configurable !== false
      ) {
        throw new TypeError('invalidProjectionArrayDescriptor')
      }
      assertClosedFrozenProjectionTree(descriptor.value, forbidden, observed)
    }
    return
  }
  if (capturedGetPrototypeOf(value) !== capturedObjectPrototype) {
    throw new TypeError('invalidProjectionRecordPrototype')
  }
  for (let index = 0; index < keys.length; index += 1) {
    if (typeof keys[index] !== 'string') {
      throw new TypeError('invalidProjectionRecordKey')
    }
    const descriptor = capturedGetOwnPropertyDescriptor(value, keys[index])
    if (
      descriptor === undefined ||
      capturedObjectHasOwn(descriptor, 'value') !== true ||
      capturedObjectHasOwn(descriptor, 'get') === true ||
      capturedObjectHasOwn(descriptor, 'set') === true ||
      descriptor.enumerable !== true ||
      descriptor.writable !== false ||
      descriptor.configurable !== false
    ) {
      throw new TypeError('invalidProjectionRecordDescriptor')
    }
    assertClosedFrozenProjectionTree(descriptor.value, forbidden, observed)
  }
}

function generatedDataValue(record, key) {
  return capturedGetOwnPropertyDescriptor(record, key).value
}

function assertGeneratedRecordKeys(record, expected) {
  if (!exactKeys(capturedReflectOwnKeys(record), expected)) {
    throw new TypeError('invalidProjectionRecordShape')
  }
}

function assertGeneratedArrayLength(array, expectedLength) {
  if (capturedGetOwnPropertyDescriptor(array, 'length').value !== expectedLength) {
    throw new TypeError('invalidProjectionArrayLength')
  }
}

function assertFoundationProjectionSchema(
  projection,
  expectedProjectionIntegrity,
  expectedProjectionValues
) {
  const historical = generatedDataValue(projection, 'historicalEvidence')
  assertGeneratedRecordKeys(historical, [
    'recordPath',
    'recordSha256',
    'measurementRunId',
    'baseContextId',
    'overallGate',
  ])

  const replay = generatedDataValue(projection, 'replay')
  assertGeneratedRecordKeys(replay, [
    'replayContextId',
    'repositoryCommit',
    'repositoryState',
    'profileInstanceBinding',
    'causalContext',
    'equivalence',
  ])
  assertGeneratedRecordKeys(generatedDataValue(replay, 'profileInstanceBinding'), [
    'lifecycle',
    'newInstanceConfirmed',
    'historicalInstanceReused',
  ])
  const causal = generatedDataValue(replay, 'causalContext')
  assertGeneratedRecordKeys(causal, [
    'hostRuntime',
    'operatingSystem',
    'node',
    'browser',
    'profile',
    'networkEnvironment',
    'initialState',
    'bindingComparisonProfile',
    'frontend',
    'transportRequest',
    'gateway',
    'toolchain',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'hostRuntime'), [
    'executionClass',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'operatingSystem'), [
    'family', 'edition', 'architecture', 'version', 'build', 'patch',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'node'), ['version'])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'browser'), [
    'product', 'channel', 'version', 'engine', 'engineBuild',
    'executionMode', 'privateMode',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'profile'), [
    'lifecycle', 'extensions', 'startParameters', 'featureFlags',
    'enterprisePolicies',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'networkEnvironment'), [
    'proxy', 'vpn',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'initialState'), [
    'serviceWorker', 'permission', 'preflightCache', 'siteCache',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'frontend'), [
    'topLevelUrl', 'serializedOrigin', 'contextKind', 'isSecureContext',
  ])
  assertGeneratedRecordKeys(generatedDataValue(causal, 'transportRequest'), [
    'factoryProfile',
    'compositionProfile',
    'requestProfile',
    'requestEqualityMethod',
    'initialUrl',
    'initialScheme',
    'initialHost',
    'initialPort',
    'initialPath',
    'requestInitProfile',
  ])
  const gateway = generatedDataValue(causal, 'gateway')
  assertGeneratedRecordKeys(gateway, [
    'listenerHost',
    'listenerPort',
    'portEnvironmentValue',
    'allowedOrigin',
    'endpoint',
    'responderProfile',
    'responseProfile',
  ])
  assertGeneratedRecordKeys(generatedDataValue(gateway, 'allowedOrigin'), [
    'value', 'relationToFrontend',
  ])
  const toolchain = generatedDataValue(causal, 'toolchain')
  assertGeneratedRecordKeys(toolchain, ['vite'])
  assertGeneratedRecordKeys(generatedDataValue(toolchain, 'vite'), [
    'lockfileVersion', 'runtimeVersion',
  ])
  const equivalence = generatedDataValue(replay, 'equivalence')
  assertGeneratedRecordKeys(equivalence, [
    'relationId', 'comparisons', 'noUnexplainedCausalDeviation', 'result',
  ])
  const comparisons = generatedDataValue(equivalence, 'comparisons')
  assertGeneratedArrayLength(comparisons, REPLAY_DEFINITIONS.length)
  for (let index = 0; index < REPLAY_DEFINITIONS.length; index += 1) {
    const comparison = generatedDataValue(comparisons, CapturedString(index))
    assertGeneratedRecordKeys(comparison, [
      'fieldId',
      'comparisonBasis',
      'observationState',
      'historicalValue',
      'replayValue',
      'result',
    ])
    if (generatedDataValue(comparison, 'fieldId') !== REPLAY_DEFINITIONS[index][0]) {
      throw new TypeError('invalidProjectionComparisonOrder')
    }
  }

  const observer = generatedDataValue(projection, 'observer')
  assertGeneratedRecordKeys(observer, [
    'deltaProfile',
    'controllerExclusivity',
    'connectionProfile',
    'targetProfile',
    'foundationSha256',
    'evaluationSha256',
    'controllerEvaluateIntentCount',
    'protocolOperations',
    'mainWorldEvaluationCount',
    'transportFactoryCallCount',
    'primitiveProjectionProfile',
    'integrityChecks',
    'interferenceObservation',
  ])
  const operations = generatedDataValue(observer, 'protocolOperations')
  assertGeneratedArrayLength(operations, PROTOCOL_COMMANDS.length)
  for (let index = 0; index < PROTOCOL_COMMANDS.length; index += 1) {
    const operation = generatedDataValue(operations, CapturedString(index))
    assertGeneratedRecordKeys(operation, [
      'command', 'allowedMaximum', 'observedCountClass', 'result',
    ])
    if (generatedDataValue(operation, 'command') !== PROTOCOL_COMMANDS[index]) {
      throw new TypeError('invalidProjectionOperationOrder')
    }
  }
  const integrityChecks = generatedDataValue(observer, 'integrityChecks')
  assertGeneratedArrayLength(integrityChecks, INTEGRITY_CHECK_IDS.length)
  for (let index = 0; index < INTEGRITY_CHECK_IDS.length; index += 1) {
    const check = generatedDataValue(integrityChecks, CapturedString(index))
    assertGeneratedRecordKeys(check, ['checkId', 'result'])
    if (generatedDataValue(check, 'checkId') !== INTEGRITY_CHECK_IDS[index]) {
      throw new TypeError('invalidProjectionIntegrityOrder')
    }
  }

  assertGeneratedRecordKeys(generatedDataValue(projection, 'requestBudget'), [
    'defaultTransportCalls',
    'retries',
    'directDiagnosticFetches',
    'negativeOriginRuns',
    'redirectRuns',
    'observerProductEndpointRequests',
    'endpointOptions',
    'endpointPosts',
    'endpointOtherMethods',
    'sequence',
  ])
  const publicSettlement = generatedDataValue(projection, 'publicSettlement')
  if (publicSettlement !== null) {
    assertGeneratedRecordKeys(publicSettlement, [
      'observationState',
      'outcome',
      'staticProfileResult',
      'deadlineRelation',
      'internalStage',
      'internalOwner',
    ])
  }
  const stages = generatedDataValue(projection, 'stages')
  assertGeneratedArrayLength(stages, STAGE_DEFINITIONS.length)
  for (let index = 0; index < STAGE_DEFINITIONS.length; index += 1) {
    assertGeneratedRecordKeys(generatedDataValue(stages, CapturedString(index)), [
      'stageId',
      'layer',
      'observationState',
      'receiptOrder',
      'result',
      'clockDomain',
      'relativeMilliseconds',
      'timingState',
    ])
  }

  const timing = generatedDataValue(projection, 'timing')
  assertGeneratedRecordKeys(timing, [
    'roundingMilliseconds',
    'durationCapMilliseconds',
    'setupWindowMilliseconds',
    'captureWindowMilliseconds',
    'clockDomains',
    'calibration',
    'crossDomainComparison',
    'completion',
  ])
  const clockDomains = generatedDataValue(timing, 'clockDomains')
  assertGeneratedArrayLength(clockDomains, 3)
  for (let index = 0; index < 3; index += 1) {
    assertGeneratedRecordKeys(generatedDataValue(clockDomains, CapturedString(index)), [
      'clockDomain', 'source', 'comparisonScope',
    ])
  }
  assertGeneratedRecordKeys(generatedDataValue(timing, 'completion'), [
    'productEvidenceComplete',
    'observationCloseReason',
    'observationClosed',
    'captureWindowState',
    'evaluateReplyCountClass',
    'requestBudgetFinalized',
    'cleanupFinalizeReason',
    'cleanupFinalized',
  ])

  const cleanup = generatedDataValue(projection, 'cleanup')
  assertGeneratedRecordKeys(cleanup, [
    'observationClosedBeforeCleanup',
    'checks',
    'result',
    'projectionMaterializedAfterCleanup',
  ])
  const cleanupChecks = generatedDataValue(cleanup, 'checks')
  assertGeneratedArrayLength(cleanupChecks, CLEANUP_CHECK_IDS.length)
  for (let index = 0; index < CLEANUP_CHECK_IDS.length; index += 1) {
    const check = generatedDataValue(cleanupChecks, CapturedString(index))
    assertGeneratedRecordKeys(check, ['checkId', 'result'])
    if (generatedDataValue(check, 'checkId') !== CLEANUP_CHECK_IDS[index]) {
      throw new TypeError('invalidProjectionCleanupOrder')
    }
  }
  assertGeneratedRecordKeys(generatedDataValue(projection, 'adr0029OverallGate'), [
    'before', 'after', 'unchanged',
  ])
  assertFoundationProjectionValues(
    projection,
    expectedProjectionIntegrity,
    expectedProjectionValues
  )
}

function requireProjectionValue(condition, errorName) {
  if (!condition) {
    throw new TypeError(errorName)
  }
}

function assertFrozenResultDataDescriptor(record, key) {
  const descriptor = capturedGetOwnPropertyDescriptor(record, key)
  requireProjectionValue(
    descriptor !== undefined &&
      capturedObjectHasOwn(descriptor, 'value') === true &&
      capturedObjectHasOwn(descriptor, 'get') === false &&
      capturedObjectHasOwn(descriptor, 'set') === false &&
      descriptor.enumerable === true &&
      descriptor.writable === false &&
      descriptor.configurable === false,
    'invalidFoundationResultDescriptor'
  )
  return descriptor.value
}

function assertFoundationResultSchema(result) {
  requireProjectionValue(
    result !== null &&
      typeof result === 'object' &&
      capturedGetPrototypeOf(result) === null &&
      capturedObjectIsFrozen(result) &&
      exactKeys(capturedReflectOwnKeys(result), [
        'ok',
        'resultType',
        'evidenceStatus',
        'runtimeAuthorized',
        'persistenceAuthorized',
        'recordProjection',
        'error',
      ]),
    'invalidFoundationResultShape'
  )
  const ok = assertFrozenResultDataDescriptor(result, 'ok')
  const resultType = assertFrozenResultDataDescriptor(result, 'resultType')
  const evidenceStatus = assertFrozenResultDataDescriptor(result, 'evidenceStatus')
  const runtimeAuthorized = assertFrozenResultDataDescriptor(
    result,
    'runtimeAuthorized'
  )
  const persistenceAuthorized = assertFrozenResultDataDescriptor(
    result,
    'persistenceAuthorized'
  )
  const recordProjection = assertFrozenResultDataDescriptor(
    result,
    'recordProjection'
  )
  const error = assertFrozenResultDataDescriptor(result, 'error')
  requireProjectionValue(
    resultType === FOUNDATION_RESULT_TYPE &&
      evidenceStatus === 'NOT_EVIDENCE' &&
      runtimeAuthorized === false &&
      persistenceAuthorized === false,
    'invalidFoundationResultFixedValue'
  )
  if (ok === true) {
    requireProjectionValue(
      recordProjection !== null &&
        typeof recordProjection === 'object' &&
        error === null,
      'invalidFoundationSuccessResult'
    )
    return
  }
  requireProjectionValue(
    ok === false &&
      recordProjection === null &&
      error !== null &&
      typeof error === 'object' &&
      capturedGetPrototypeOf(error) === capturedObjectPrototype &&
      capturedObjectIsFrozen(error) &&
      exactKeys(capturedReflectOwnKeys(error), ['code', 'message']) &&
      assertFrozenResultDataDescriptor(error, 'code') === FOUNDATION_ERROR_CODE &&
      assertFrozenResultDataDescriptor(error, 'message') === FOUNDATION_ERROR_MESSAGE,
    'invalidFoundationErrorResult'
  )
}

function projectedComparisonValue(comparisons, index, key) {
  return generatedDataValue(
    generatedDataValue(comparisons, CapturedString(index)),
    key
  )
}

function assertCausalReplayLeaf(record, key, comparisons, index) {
  requireProjectionValue(
    generatedDataValue(record, key) ===
      projectedComparisonValue(comparisons, index, 'replayValue'),
    'invalidProjectionCausalReplayBinding'
  )
}

function projectedInvariantResult(comparisons, requiredIndexes, predicate) {
  for (let index = 0; index < requiredIndexes.length; index += 1) {
    if (
      projectedComparisonValue(
        comparisons,
        requiredIndexes[index],
        'observationState'
      ) !== 'observed'
    ) {
      return 'unproven'
    }
  }
  return predicate() ? 'match' : 'mismatch'
}

function assertReplayProjectionValues(projection, historical) {
  const replay = generatedDataValue(projection, 'replay')
  requireProjectionValue(
    typeof generatedDataValue(replay, 'replayContextId') === 'string' &&
      testPattern(
        IDENTIFIER_PATTERN,
        generatedDataValue(replay, 'replayContextId')
      ) &&
      generatedDataValue(replay, 'replayContextId') !==
        generatedDataValue(historical, 'baseContextId') &&
      typeof generatedDataValue(replay, 'repositoryCommit') === 'string' &&
      testPattern(
        LOWER_HEX_40_PATTERN,
        generatedDataValue(replay, 'repositoryCommit')
      ),
    'invalidProjectionReplayIdentity'
  )

  const profileBinding = generatedDataValue(replay, 'profileInstanceBinding')
  const lifecycle = generatedDataValue(profileBinding, 'lifecycle')
  const newInstanceConfirmed = generatedDataValue(
    profileBinding,
    'newInstanceConfirmed'
  )
  const historicalInstanceReused = generatedDataValue(
    profileBinding,
    'historicalInstanceReused'
  )
  requireProjectionValue(
    (
      lifecycle === 'fresh-disposable-new-instance-confirmed' &&
      newInstanceConfirmed === true &&
      historicalInstanceReused === false
    ) || (
      lifecycle === 'reused' &&
      newInstanceConfirmed === false &&
      historicalInstanceReused === true
    ) || (
      lifecycle === 'unknown' &&
      newInstanceConfirmed === false &&
      historicalInstanceReused === false
    ),
    'invalidProjectionProfileInstanceBinding'
  )

  const equivalence = generatedDataValue(replay, 'equivalence')
  const comparisons = generatedDataValue(equivalence, 'comparisons')
  for (let index = 0; index < REPLAY_DEFINITIONS.length; index += 1) {
    const definition = REPLAY_DEFINITIONS[index]
    const fieldId = projectedComparisonValue(comparisons, index, 'fieldId')
    const comparisonBasis = projectedComparisonValue(
      comparisons,
      index,
      'comparisonBasis'
    )
    const observationState = projectedComparisonValue(
      comparisons,
      index,
      'observationState'
    )
    const historicalValue = projectedComparisonValue(
      comparisons,
      index,
      'historicalValue'
    )
    const replayValue = projectedComparisonValue(
      comparisons,
      index,
      'replayValue'
    )
    const result = projectedComparisonValue(comparisons, index, 'result')
    requireProjectionValue(
      fieldId === definition[0] &&
        comparisonBasis === definition[1] &&
        historicalValue === definition[2] &&
        isOneOf(observationState, [
          'observed',
          'not-observed',
          'ambiguous',
        ]) &&
        (
          observationState === 'observed'
            ? replayValue !== null && isReplayScalar(replayValue, definition[3])
            : replayValue === null
        ) &&
        result === comparisonResult(
          observationState,
          replayValue,
          historicalValue
        ),
      'invalidProjectionReplayComparison'
    )
  }
  requireProjectionValue(
    generatedDataValue(replay, 'repositoryState') ===
      projectedComparisonValue(comparisons, 8, 'replayValue'),
    'invalidProjectionRepositoryStateBinding'
  )

  const causal = generatedDataValue(replay, 'causalContext')
  const hostRuntime = generatedDataValue(causal, 'hostRuntime')
  assertCausalReplayLeaf(hostRuntime, 'executionClass', comparisons, 9)
  const operatingSystem = generatedDataValue(causal, 'operatingSystem')
  assertCausalReplayLeaf(operatingSystem, 'family', comparisons, 10)
  assertCausalReplayLeaf(operatingSystem, 'edition', comparisons, 11)
  assertCausalReplayLeaf(operatingSystem, 'architecture', comparisons, 12)
  assertCausalReplayLeaf(operatingSystem, 'version', comparisons, 13)
  assertCausalReplayLeaf(operatingSystem, 'build', comparisons, 14)
  assertCausalReplayLeaf(operatingSystem, 'patch', comparisons, 15)
  assertCausalReplayLeaf(generatedDataValue(causal, 'node'), 'version', comparisons, 16)
  const browser = generatedDataValue(causal, 'browser')
  assertCausalReplayLeaf(browser, 'product', comparisons, 17)
  assertCausalReplayLeaf(browser, 'channel', comparisons, 18)
  assertCausalReplayLeaf(browser, 'version', comparisons, 19)
  assertCausalReplayLeaf(browser, 'engine', comparisons, 20)
  assertCausalReplayLeaf(browser, 'engineBuild', comparisons, 21)
  assertCausalReplayLeaf(browser, 'executionMode', comparisons, 22)
  assertCausalReplayLeaf(browser, 'privateMode', comparisons, 23)
  const profile = generatedDataValue(causal, 'profile')
  assertCausalReplayLeaf(profile, 'lifecycle', comparisons, 24)
  assertCausalReplayLeaf(profile, 'extensions', comparisons, 25)
  assertCausalReplayLeaf(profile, 'startParameters', comparisons, 26)
  assertCausalReplayLeaf(profile, 'featureFlags', comparisons, 27)
  assertCausalReplayLeaf(profile, 'enterprisePolicies', comparisons, 28)
  const networkEnvironment = generatedDataValue(causal, 'networkEnvironment')
  assertCausalReplayLeaf(networkEnvironment, 'proxy', comparisons, 29)
  assertCausalReplayLeaf(networkEnvironment, 'vpn', comparisons, 30)
  const initialState = generatedDataValue(causal, 'initialState')
  assertCausalReplayLeaf(initialState, 'serviceWorker', comparisons, 31)
  assertCausalReplayLeaf(initialState, 'permission', comparisons, 32)
  assertCausalReplayLeaf(initialState, 'preflightCache', comparisons, 33)
  assertCausalReplayLeaf(initialState, 'siteCache', comparisons, 34)
  assertCausalReplayLeaf(causal, 'bindingComparisonProfile', comparisons, 35)
  const frontend = generatedDataValue(causal, 'frontend')
  assertCausalReplayLeaf(frontend, 'topLevelUrl', comparisons, 36)
  assertCausalReplayLeaf(frontend, 'serializedOrigin', comparisons, 37)
  assertCausalReplayLeaf(frontend, 'contextKind', comparisons, 38)
  assertCausalReplayLeaf(frontend, 'isSecureContext', comparisons, 39)
  const transportRequest = generatedDataValue(causal, 'transportRequest')
  assertCausalReplayLeaf(transportRequest, 'factoryProfile', comparisons, 40)
  assertCausalReplayLeaf(transportRequest, 'compositionProfile', comparisons, 41)
  assertCausalReplayLeaf(transportRequest, 'requestProfile', comparisons, 42)
  assertCausalReplayLeaf(transportRequest, 'requestEqualityMethod', comparisons, 43)
  assertCausalReplayLeaf(transportRequest, 'initialUrl', comparisons, 44)
  assertCausalReplayLeaf(transportRequest, 'initialScheme', comparisons, 45)
  assertCausalReplayLeaf(transportRequest, 'initialHost', comparisons, 46)
  assertCausalReplayLeaf(transportRequest, 'initialPort', comparisons, 47)
  assertCausalReplayLeaf(transportRequest, 'initialPath', comparisons, 48)
  assertCausalReplayLeaf(transportRequest, 'requestInitProfile', comparisons, 49)
  const gateway = generatedDataValue(causal, 'gateway')
  assertCausalReplayLeaf(gateway, 'listenerHost', comparisons, 50)
  assertCausalReplayLeaf(gateway, 'listenerPort', comparisons, 51)
  assertCausalReplayLeaf(gateway, 'portEnvironmentValue', comparisons, 52)
  const allowedOrigin = generatedDataValue(gateway, 'allowedOrigin')
  assertCausalReplayLeaf(allowedOrigin, 'value', comparisons, 53)
  assertCausalReplayLeaf(allowedOrigin, 'relationToFrontend', comparisons, 54)
  assertCausalReplayLeaf(gateway, 'endpoint', comparisons, 55)
  assertCausalReplayLeaf(gateway, 'responderProfile', comparisons, 56)
  assertCausalReplayLeaf(gateway, 'responseProfile', comparisons, 57)
  const vite = generatedDataValue(
    generatedDataValue(causal, 'toolchain'),
    'vite'
  )
  assertCausalReplayLeaf(vite, 'lockfileVersion', comparisons, 58)
  const viteRuntimeVersion = generatedDataValue(vite, 'runtimeVersion')
  requireProjectionValue(
    viteRuntimeVersion === null || isCoreSemver(viteRuntimeVersion),
    'invalidProjectionViteRuntimeVersion'
  )

  function replayValue(index) {
    return projectedComparisonValue(comparisons, index, 'replayValue')
  }
  const i1 = projectedInvariantResult(comparisons, [36, 37], function checkI1() {
    return replayValue(36) === replayValue(37) + '/'
  })
  const i2 = projectedInvariantResult(
    comparisons,
    [44, 45, 46, 47, 48],
    function checkI2() {
      return replayValue(44) === replayValue(45) + '://' + replayValue(46) +
        ':' + CapturedString(replayValue(47)) + replayValue(48)
    }
  )
  const i3 = projectedInvariantResult(
    comparisons,
    [45, 46, 47, 48, 50, 51, 52, 55],
    function checkI3() {
      const port = CapturedString(replayValue(51))
      return replayValue(46) === '127.0.0.1' &&
        replayValue(50) === '127.0.0.1' &&
        replayValue(47) === replayValue(51) &&
        replayValue(52) === '"' + port + '"' &&
        replayValue(55) === replayValue(45) + '://' + replayValue(50) + ':' +
          port + replayValue(48)
    }
  )
  const i4 = projectedInvariantResult(
    comparisons,
    [37, 53, 54],
    function checkI4() {
      return replayValue(54) === 'matches-frontend-origin' &&
        replayValue(53) === replayValue(37)
    }
  )
  const i5 = projectedInvariantResult(comparisons, [44, 55], function checkI5() {
    return replayValue(44) === replayValue(55)
  })
  let i6 = 'unproven'
  if (
    projectedComparisonValue(comparisons, 58, 'observationState') ===
      'observed' &&
    viteRuntimeVersion !== null
  ) {
    i6 = replayValue(58) === viteRuntimeVersion ? 'match' : 'mismatch'
  }
  let i7 = 'unproven'
  if (
    projectedComparisonValue(comparisons, 24, 'observationState') ===
      'observed'
  ) {
    if (
      replayValue(24) === 'fresh-disposable' &&
      newInstanceConfirmed === true
    ) {
      i7 = 'match'
    } else if (lifecycle !== 'unknown') {
      i7 = 'mismatch'
    }
  }
  const noDeviation = generatedDataValue(
    equivalence,
    'noUnexplainedCausalDeviation'
  )
  requireProjectionValue(
    generatedDataValue(equivalence, 'relationId') ===
      'adr-0032-causal-replay-v2' &&
      isOneOf(noDeviation, ['confirmed', 'contradicted', 'unproven']),
    'invalidProjectionReplayEquivalenceProfile'
  )
  let hasMismatch = noDeviation === 'contradicted'
  let hasUnproven = noDeviation === 'unproven'
  for (let index = 0; index < REPLAY_DEFINITIONS.length; index += 1) {
    const result = projectedComparisonValue(comparisons, index, 'result')
    hasMismatch = hasMismatch || result === 'mismatch'
    hasUnproven = hasUnproven || result === 'unproven'
  }
  const invariants = [i1, i2, i3, i4, i5, i6, i7]
  for (let index = 0; index < invariants.length; index += 1) {
    hasMismatch = hasMismatch || invariants[index] === 'mismatch'
    hasUnproven = hasUnproven || invariants[index] === 'unproven'
  }
  requireProjectionValue(
    generatedDataValue(equivalence, 'result') === (
      hasMismatch ? 'DIVERGED' : (hasUnproven ? 'UNPROVEN' : 'EQUIVALENT')
    ),
    'invalidProjectionReplayResult'
  )
}

function assertOperationProjectionValues(operation, expectedCommand) {
  const count = generatedDataValue(operation, 'observedCountClass')
  const result = generatedDataValue(operation, 'result')
  requireProjectionValue(
    generatedDataValue(operation, 'command') === expectedCommand &&
      generatedDataValue(operation, 'allowedMaximum') === 1 &&
      (
        (count === 'one' && result === 'match') ||
        (count === 'multiple' && result === 'mismatch') ||
        (count === 'unknown' && result === 'unproven') ||
        (count === 'zero' && isOneOf(result, ['match', 'unproven']))
      ),
    'invalidProjectionOperationValue'
  )
}

function assertDenseProjectionOrders(orderSet, count) {
  for (let order = 1; order <= count; order += 1) {
    requireProjectionValue(
      capturedReflectApply(capturedSetHas, orderSet, [order]),
      'invalidProjectionReceiptOrderDensity'
    )
  }
}

function assertFoundationProjectionValues(
  projection,
  expectedProjectionIntegrity,
  expectedProjectionValues
) {
  const expectedIntegrityResults = generatedDataValue(
    expectedProjectionValues,
    'integrityResults'
  )
  const expectedCleanupResults = generatedDataValue(
    expectedProjectionValues,
    'cleanupResults'
  )
  const expectedTargetAndSessionIntegrity = generatedDataValue(
    expectedIntegrityResults,
    '15'
  )
  requireProjectionValue(
    isOneOf(expectedProjectionIntegrity, ['confirmed', 'unproven']) &&
      isOneOf(expectedTargetAndSessionIntegrity, ['violated', 'unproven']) &&
      capturedGetOwnPropertyDescriptor(expectedIntegrityResults, 'length').value ===
        INTEGRITY_CHECK_IDS.length &&
      capturedGetOwnPropertyDescriptor(expectedCleanupResults, 'length').value ===
        CLEANUP_CHECK_IDS.length &&
      isOneOf(generatedDataValue(expectedProjectionValues, 'cleanupResult'), [
        'PASS',
        'FAIL',
        'UNPROVEN',
      ]),
    'invalidExpectedProjectionIntegrity'
  )
  requireProjectionValue(
    generatedDataValue(projection, 'schemaVersion') === 1 &&
      generatedDataValue(projection, 'projectionType') ===
        FOUNDATION_PROJECTION_TYPE &&
      typeof generatedDataValue(projection, 'diagnosticRunId') === 'string' &&
      testPattern(
        IDENTIFIER_PATTERN,
        generatedDataValue(projection, 'diagnosticRunId')
      ) &&
      isCanonicalUtcTimestamp(generatedDataValue(projection, 'observedAt')) &&
      isTimeZone(generatedDataValue(projection, 'timeZone')) &&
      generatedDataValue(projection, 'causeStatus') === 'CAUSE_NOT_PROVEN',
    'invalidProjectionRootValue'
  )

  const historical = generatedDataValue(projection, 'historicalEvidence')
  requireProjectionValue(
    generatedDataValue(historical, 'recordPath') ===
      'docs/evidence/browser-runtime-evidence.chrome-stable-windows-01.json' &&
      generatedDataValue(historical, 'recordSha256') ===
        'ffad6b1de2e0c32ec5c2cdc3e88bfd455b14adc2eb4dd45f0d81e911e1a64b33' &&
      generatedDataValue(historical, 'measurementRunId') ===
        'chrome-stable-win-01' &&
      generatedDataValue(historical, 'baseContextId') ===
        'chrome-stable-win-t0-01' &&
      generatedDataValue(historical, 'overallGate') === 'FAIL',
    'invalidProjectionHistoricalEvidenceValue'
  )
  assertReplayProjectionValues(projection, historical)

  const observer = generatedDataValue(projection, 'observer')
  requireProjectionValue(
    generatedDataValue(observer, 'deltaProfile') ===
      'adr-0030-passive-external-observer-v1' &&
      generatedDataValue(observer, 'controllerExclusivity') === 'unknown' &&
      generatedDataValue(observer, 'connectionProfile') === 'unknown' &&
      isOneOf(generatedDataValue(observer, 'targetProfile'), [
        'single-goldendawn-top-level',
        'other',
        'unknown',
      ]) &&
      generatedDataValue(observer, 'foundationSha256') === null &&
      (
        generatedDataValue(observer, 'evaluationSha256') === null ||
        generatedDataValue(observer, 'evaluationSha256') === EVALUATION_SHA256
      ) &&
      isOneOf(generatedDataValue(observer, 'controllerEvaluateIntentCount'), [
        'zero',
        'one',
      ]) &&
      isOneOf(generatedDataValue(observer, 'mainWorldEvaluationCount'), [
        'zero',
        'one',
        'multiple',
        'unknown',
      ]) &&
      isOneOf(generatedDataValue(observer, 'transportFactoryCallCount'), [
        'zero',
        'one',
        'unknown',
      ]) &&
      generatedDataValue(observer, 'primitiveProjectionProfile') ===
        'immediate-closed-by-value-pretransport-context-and-settlement-v2-no-handle',
    'invalidProjectionObserverValue'
  )
  const operations = generatedDataValue(observer, 'protocolOperations')
  for (let index = 0; index < PROTOCOL_COMMANDS.length; index += 1) {
    assertOperationProjectionValues(
      generatedDataValue(operations, CapturedString(index)),
      PROTOCOL_COMMANDS[index]
    )
  }
  const evaluateOperation = generatedDataValue(operations, '3')
  const evaluateOperationCount = generatedDataValue(
    evaluateOperation,
    'observedCountClass'
  )
  const evaluateOperationResult = generatedDataValue(evaluateOperation, 'result')
  requireProjectionValue(
    generatedDataValue(observer, 'evaluationSha256') === (
      evaluateOperationCount === 'one' && evaluateOperationResult === 'match'
        ? EVALUATION_SHA256
        : null
    ) &&
      (
        generatedDataValue(observer, 'controllerEvaluateIntentCount') === 'zero'
          ? evaluateOperationCount === 'zero' && evaluateOperationResult === 'match'
          : evaluateOperationCount !== 'zero'
      ),
    'invalidProjectionEvaluateOperationBinding'
  )

  const integrityChecks = generatedDataValue(observer, 'integrityChecks')
  let anyIntegrityViolated = false
  let allIntegrityConfirmed = true
  for (let index = 0; index < INTEGRITY_CHECK_IDS.length; index += 1) {
    const check = generatedDataValue(integrityChecks, CapturedString(index))
    const result = generatedDataValue(check, 'result')
    const expectedResult = index === 14
      ? expectedProjectionIntegrity
      : generatedDataValue(expectedIntegrityResults, CapturedString(index))
    requireProjectionValue(
      generatedDataValue(check, 'checkId') === INTEGRITY_CHECK_IDS[index] &&
        isOneOf(result, ['confirmed', 'violated', 'unproven']) &&
        result === expectedResult,
      'invalidProjectionIntegrityValue'
    )
    if (index === 3) {
      requireProjectionValue(
        result === 'confirmed',
        'invalidProjectionProtocolAllowlistIntegrity'
      )
    } else if (index === 14) {
      requireProjectionValue(
        result === expectedProjectionIntegrity,
        'invalidProjectionPrimitiveIntegrity'
      )
    } else if (index === 15) {
      requireProjectionValue(
        result === expectedTargetAndSessionIntegrity,
        'invalidProjectionTargetAndSessionIntegrity'
      )
    } else if (index === 16) {
      requireProjectionValue(
        isOneOf(result, ['violated', 'unproven']),
        'invalidProjectionCardinalityIntegrity'
      )
    } else {
      requireProjectionValue(
        result === 'unproven',
        'invalidProjectionFoundationIntegrityReachability'
      )
    }
    anyIntegrityViolated = anyIntegrityViolated || result === 'violated'
    allIntegrityConfirmed = allIntegrityConfirmed && result === 'confirmed'
  }
  const expectedInterference = anyIntegrityViolated
    ? 'contract-visible-detected'
    : (allIntegrityConfirmed ? 'none-contract-visible-detected' : 'unknown')
  requireProjectionValue(
    generatedDataValue(observer, 'interferenceObservation') ===
      expectedInterference,
    'invalidProjectionInterferenceDerivation'
  )

  const requestBudget = generatedDataValue(projection, 'requestBudget')
  const requestCountKeys = [
    'defaultTransportCalls',
    'retries',
    'directDiagnosticFetches',
    'negativeOriginRuns',
    'redirectRuns',
    'observerProductEndpointRequests',
    'endpointOptions',
    'endpointPosts',
    'endpointOtherMethods',
  ]
  for (let index = 0; index < requestCountKeys.length; index += 1) {
    requireProjectionValue(
      isOneOf(generatedDataValue(requestBudget, requestCountKeys[index]), [
        'zero',
        'one',
        'multiple',
        'unknown',
      ]),
      'invalidProjectionRequestCount'
    )
  }
  requireProjectionValue(
    isOneOf(generatedDataValue(requestBudget, 'defaultTransportCalls'), [
      'zero',
      'one',
      'unknown',
    ]) &&
      generatedDataValue(requestBudget, 'retries') === 'zero' &&
      generatedDataValue(requestBudget, 'directDiagnosticFetches') === 'zero' &&
      generatedDataValue(requestBudget, 'negativeOriginRuns') === 'zero' &&
      generatedDataValue(requestBudget, 'redirectRuns') === 'zero' &&
      generatedDataValue(requestBudget, 'observerProductEndpointRequests') ===
        'zero' &&
      isOneOf(generatedDataValue(requestBudget, 'sequence'), [
        'OPTIONS-204-POST-200-loadingFinished',
        'other',
        'incomplete',
        'ambiguous',
      ]),
    'invalidProjectionRequestBudgetValue'
  )

  const publicSettlement = generatedDataValue(projection, 'publicSettlement')
  if (publicSettlement !== null) {
    const observationState = generatedDataValue(
      publicSettlement,
      'observationState'
    )
    const outcome = generatedDataValue(publicSettlement, 'outcome')
    const staticProfileResult = generatedDataValue(
      publicSettlement,
      'staticProfileResult'
    )
    const deadlineRelation = generatedDataValue(
      publicSettlement,
      'deadlineRelation'
    )
    requireProjectionValue(
      isOneOf(observationState, ['observed', 'not-observed']) &&
        isOneOf(outcome, [
          'fulfilled',
          'static-redacted-rejection',
          'other-rejection',
          'unknown',
        ]) &&
        isOneOf(staticProfileResult, [
          'match',
          'mismatch',
          'unproven',
          'not-applicable',
        ]) &&
        isOneOf(deadlineRelation, [
          'deadline-compatible',
          'no-causal-classification',
          'unknown',
        ]) &&
        generatedDataValue(publicSettlement, 'internalStage') === 'unknown' &&
        generatedDataValue(publicSettlement, 'internalOwner') === 'unknown' &&
        (
          observationState === 'observed'
            ? (
              (outcome === 'fulfilled' && staticProfileResult === 'not-applicable') ||
              (
                outcome === 'static-redacted-rejection' &&
                staticProfileResult === 'match'
              ) ||
              (outcome === 'other-rejection' && staticProfileResult === 'mismatch')
            )
            : outcome === 'unknown' &&
              staticProfileResult === 'unproven' &&
              deadlineRelation === 'unknown'
        ),
      'invalidProjectionPublicSettlementValue'
    )
  }

  const stages = generatedDataValue(projection, 'stages')
  const controllerOrders = new CapturedSet()
  const mainWorldOrders = new CapturedSet()
  const networkOrders = new CapturedSet()
  const cleanupOrders = new CapturedSet()
  let controllerOrderCount = 0
  let mainWorldOrderCount = 0
  let networkOrderCount = 0
  let cleanupOrderCount = 0
  for (let index = 0; index < STAGE_DEFINITIONS.length; index += 1) {
    const stage = generatedDataValue(stages, CapturedString(index))
    const stageId = generatedDataValue(stage, 'stageId')
    const layer = generatedDataValue(stage, 'layer')
    const observationState = generatedDataValue(stage, 'observationState')
    const receiptOrder = generatedDataValue(stage, 'receiptOrder')
    const result = generatedDataValue(stage, 'result')
    const clockDomain = generatedDataValue(stage, 'clockDomain')
    const relativeMilliseconds = generatedDataValue(
      stage,
      'relativeMilliseconds'
    )
    const timingState = generatedDataValue(stage, 'timingState')
    const stageIdValid = index === 6
      ? isOneOf(stageId, [
        'post-loading-finished',
        'post-loading-failed',
        'post-loading-terminal',
      ])
      : stageId === STAGE_DEFINITIONS[index][0]
    requireProjectionValue(
      stageIdValid &&
        layer === STAGE_DEFINITIONS[index][1] &&
        clockDomain === STAGE_DEFINITIONS[index][2] &&
        isOneOf(observationState, [
          'observed',
          'not-observed',
          'ambiguous',
        ]) &&
        isOneOf(result, ['match', 'mismatch', 'unproven']) &&
        validProjectedTimingPair(relativeMilliseconds, timingState),
      'invalidProjectionStageValue'
    )
    if (observationState === 'observed') {
      requireProjectionValue(
        capturedNumberIsSafeInteger(receiptOrder) &&
          receiptOrder > 0 &&
          isOneOf(result, ['match', 'mismatch']),
        'invalidProjectionObservedStage'
      )
      let orderSet
      if (layer === 'controller') {
        orderSet = controllerOrders
        controllerOrderCount += 1
      } else if (layer === 'javascript-main-world') {
        orderSet = mainWorldOrders
        mainWorldOrderCount += 1
      } else if (layer === 'browser-network') {
        orderSet = networkOrders
        networkOrderCount += 1
      } else {
        orderSet = cleanupOrders
        cleanupOrderCount += 1
      }
      requireProjectionValue(
        !capturedReflectApply(capturedSetHas, orderSet, [receiptOrder]),
        'invalidProjectionDuplicateReceiptOrder'
      )
      capturedReflectApply(capturedSetAdd, orderSet, [receiptOrder])
    } else {
      requireProjectionValue(
        receiptOrder === null &&
          result === 'unproven' &&
          relativeMilliseconds === null &&
          timingState === 'unavailable',
        'invalidProjectionUnobservedStage'
      )
    }
  }
  assertDenseProjectionOrders(controllerOrders, controllerOrderCount)
  assertDenseProjectionOrders(mainWorldOrders, mainWorldOrderCount)
  assertDenseProjectionOrders(networkOrders, networkOrderCount)
  assertDenseProjectionOrders(cleanupOrders, cleanupOrderCount)

  const stageOne = generatedDataValue(stages, '0')
  requireProjectionValue(
    generatedDataValue(stageOne, 'stageId') === 'observer-armed' &&
      generatedDataValue(stageOne, 'layer') === 'controller' &&
      generatedDataValue(stageOne, 'clockDomain') === 'controller-monotonic' &&
      generatedDataValue(stageOne, 'observationState') === 'observed' &&
      generatedDataValue(stageOne, 'receiptOrder') === 1 &&
      generatedDataValue(stageOne, 'result') === 'match' &&
      generatedDataValue(stageOne, 'relativeMilliseconds') === 0 &&
      generatedDataValue(stageOne, 'timingState') === 'measured',
    'invalidProjectionObserverArmedStage'
  )
  const loadingStage = generatedDataValue(stages, '6')
  const loadingStageId = generatedDataValue(loadingStage, 'stageId')
  requireProjectionValue(
    (
      loadingStageId === 'post-loading-finished' &&
      generatedDataValue(loadingStage, 'observationState') === 'observed' &&
      generatedDataValue(loadingStage, 'result') === 'match'
    ) || (
      loadingStageId === 'post-loading-failed' &&
      generatedDataValue(loadingStage, 'observationState') === 'observed' &&
      generatedDataValue(loadingStage, 'result') === 'mismatch'
    ) || (
      loadingStageId === 'post-loading-terminal' &&
      isOneOf(generatedDataValue(loadingStage, 'observationState'), [
        'not-observed',
        'ambiguous',
      ]) &&
      generatedDataValue(loadingStage, 'result') === 'unproven'
    ),
    'invalidProjectionLoadingStage'
  )
  const preflightRequestStage = generatedDataValue(stages, '2')
  if (
    generatedDataValue(preflightRequestStage, 'observationState') === 'observed'
  ) {
    requireProjectionValue(
      generatedDataValue(preflightRequestStage, 'relativeMilliseconds') === 0 &&
        generatedDataValue(preflightRequestStage, 'timingState') === 'measured',
      'invalidProjectionPreflightOriginTiming'
    )
  }
  const cleanupStartStage = generatedDataValue(stages, '8')
  requireProjectionValue(
    generatedDataValue(cleanupStartStage, 'stageId') === 'cleanup-started' &&
      generatedDataValue(cleanupStartStage, 'observationState') === 'observed' &&
      generatedDataValue(cleanupStartStage, 'receiptOrder') === 1 &&
      generatedDataValue(cleanupStartStage, 'result') === 'match' &&
      (
        (
          generatedDataValue(cleanupStartStage, 'relativeMilliseconds') === 0 &&
          generatedDataValue(cleanupStartStage, 'timingState') === 'measured'
        ) || (
          generatedDataValue(cleanupStartStage, 'relativeMilliseconds') === null &&
          generatedDataValue(cleanupStartStage, 'timingState') === 'unavailable'
        )
      ),
    'invalidProjectionCleanupStartStage'
  )

  const timing = generatedDataValue(projection, 'timing')
  requireProjectionValue(
    generatedDataValue(timing, 'roundingMilliseconds') === 10 &&
      generatedDataValue(timing, 'durationCapMilliseconds') === 60000 &&
      generatedDataValue(timing, 'setupWindowMilliseconds') === 6000 &&
      generatedDataValue(timing, 'captureWindowMilliseconds') === 6000 &&
      generatedDataValue(timing, 'calibration') === 'none' &&
      generatedDataValue(timing, 'crossDomainComparison') === 'forbidden',
    'invalidProjectionTimingFixedValue'
  )
  const clockDomains = generatedDataValue(timing, 'clockDomains')
  const controllerClock = generatedDataValue(clockDomains, '0')
  const mainWorldClock = generatedDataValue(clockDomains, '1')
  const networkClock = generatedDataValue(clockDomains, '2')
  requireProjectionValue(
    generatedDataValue(controllerClock, 'clockDomain') ===
      'controller-monotonic' &&
      generatedDataValue(controllerClock, 'source') ===
        'controller-monotonic-fixed-v1' &&
      generatedDataValue(controllerClock, 'comparisonScope') ===
        'setup-observation-and-cleanup-only' &&
      generatedDataValue(mainWorldClock, 'clockDomain') ===
        'javascript-main-world' &&
      generatedDataValue(mainWorldClock, 'source') ===
        'window.performance.now' &&
      generatedDataValue(mainWorldClock, 'comparisonScope') ===
        'transport-dispatch-and-public-settlement-only' &&
      generatedDataValue(networkClock, 'clockDomain') === 'browser-network' &&
      generatedDataValue(networkClock, 'source') ===
        'cdp-network-monotonic-time' &&
      generatedDataValue(networkClock, 'comparisonScope') ===
        'endpoint-network-events-only',
    'invalidProjectionClockDomainValue'
  )

  const mainWorldCount = generatedDataValue(observer, 'mainWorldEvaluationCount')
  const factoryCount = generatedDataValue(observer, 'transportFactoryCallCount')
  const transportCount = generatedDataValue(
    requestBudget,
    'defaultTransportCalls'
  )
  requireProjectionValue(
    (
      generatedDataValue(observer, 'controllerEvaluateIntentCount') === 'one'
        ? mainWorldCount !== 'zero'
        : mainWorldCount === 'zero'
    ),
    'invalidProjectionEvaluateIntentCountBinding'
  )
  requireProjectionValue(
    (
      mainWorldCount === 'zero' &&
      factoryCount === 'zero' &&
      transportCount === 'zero'
    ) || (
      mainWorldCount === 'one' &&
      (
        (factoryCount === 'zero' && transportCount === 'zero') ||
        (factoryCount === 'one' && isOneOf(transportCount, ['zero', 'one']))
      )
    ) || (
      isOneOf(mainWorldCount, ['multiple', 'unknown']) &&
      factoryCount === 'unknown' &&
      transportCount === 'unknown'
    ),
    'invalidProjectionExecutionCountBinding'
  )
  const dispatchStage = generatedDataValue(stages, '1')
  if (mainWorldCount === 'zero') {
    requireProjectionValue(
      generatedDataValue(dispatchStage, 'observationState') === 'not-observed',
      'invalidProjectionZeroEvaluationStage'
    )
  } else if (mainWorldCount === 'one') {
    requireProjectionValue(
      generatedDataValue(dispatchStage, 'observationState') === 'observed' &&
        generatedDataValue(dispatchStage, 'result') === (
          transportCount === 'one' ? 'match' : 'mismatch'
        ),
      'invalidProjectionAcceptedEvaluationStage'
    )
  } else if (mainWorldCount === 'multiple') {
    requireProjectionValue(
      generatedDataValue(dispatchStage, 'observationState') === 'ambiguous',
      'invalidProjectionMultipleEvaluationStage'
    )
  } else {
    requireProjectionValue(
      isOneOf(generatedDataValue(dispatchStage, 'observationState'), [
        'not-observed',
        'ambiguous',
      ]),
      'invalidProjectionUnknownEvaluationStage'
    )
  }

  const settlementStage = generatedDataValue(stages, '7')
  if (publicSettlement === null) {
    requireProjectionValue(
      isOneOf(generatedDataValue(settlementStage, 'observationState'), [
        'not-observed',
        'ambiguous',
      ]),
      'invalidProjectionAbsentSettlementStage'
    )
  } else if (generatedDataValue(publicSettlement, 'observationState') === 'observed') {
    const settlementOutcome = generatedDataValue(publicSettlement, 'outcome')
    const settlementStageTiming = generatedDataValue(
      settlementStage,
      'timingState'
    )
    const settlementStageRelative = generatedDataValue(
      settlementStage,
      'relativeMilliseconds'
    )
    const expectedDeadlineRelation = settlementStageTiming === 'unavailable'
      ? 'unknown'
      : (
        settlementStageRelative >= 4500 && settlementStageRelative <= 5500
          ? 'deadline-compatible'
          : 'no-causal-classification'
      )
    requireProjectionValue(
      mainWorldCount === 'one' &&
        generatedDataValue(
          generatedDataValue(timing, 'completion'),
          'evaluateReplyCountClass'
        ) === 'one' &&
      generatedDataValue(settlementStage, 'observationState') === 'observed' &&
        generatedDataValue(settlementStage, 'result') === (
          settlementOutcome === 'static-redacted-rejection'
            ? 'match'
            : 'mismatch'
        ) &&
        generatedDataValue(publicSettlement, 'deadlineRelation') ===
          expectedDeadlineRelation,
      'invalidProjectionSettlementStageBinding'
    )
  }
  if (mainWorldCount === 'one') {
    const settlementTimingAvailable =
      publicSettlement !== null &&
      generatedDataValue(publicSettlement, 'observationState') === 'observed' &&
      generatedDataValue(settlementStage, 'timingState') !== 'unavailable'
    requireProjectionValue(
      settlementTimingAvailable
        ? generatedDataValue(dispatchStage, 'relativeMilliseconds') === 0 &&
          generatedDataValue(dispatchStage, 'timingState') === 'measured'
        : generatedDataValue(dispatchStage, 'relativeMilliseconds') === null &&
          generatedDataValue(dispatchStage, 'timingState') === 'unavailable',
      'invalidProjectionDispatchOriginTiming'
    )
  }

  if (
    generatedDataValue(requestBudget, 'sequence') ===
      'OPTIONS-204-POST-200-loadingFinished'
  ) {
    requireProjectionValue(
      transportCount === 'one' &&
        generatedDataValue(requestBudget, 'endpointOptions') === 'one' &&
        generatedDataValue(requestBudget, 'endpointPosts') === 'one' &&
        generatedDataValue(requestBudget, 'endpointOtherMethods') === 'zero' &&
        generatedDataValue(generatedDataValue(stages, '2'), 'result') === 'match' &&
        generatedDataValue(generatedDataValue(stages, '2'), 'receiptOrder') === 1 &&
        generatedDataValue(generatedDataValue(stages, '3'), 'result') === 'match' &&
        generatedDataValue(generatedDataValue(stages, '3'), 'receiptOrder') === 2 &&
        generatedDataValue(generatedDataValue(stages, '4'), 'result') === 'match' &&
        generatedDataValue(generatedDataValue(stages, '4'), 'receiptOrder') === 3 &&
        generatedDataValue(generatedDataValue(stages, '5'), 'result') === 'match' &&
        generatedDataValue(generatedDataValue(stages, '5'), 'receiptOrder') === 4 &&
        generatedDataValue(loadingStage, 'stageId') === 'post-loading-finished' &&
        generatedDataValue(loadingStage, 'receiptOrder') === 5,
      'invalidProjectionCanonicalRequestSequence'
    )
  }

  const completion = generatedDataValue(timing, 'completion')
  const productEvidenceComplete = generatedDataValue(
    completion,
    'productEvidenceComplete'
  )
  const observationCloseReason = generatedDataValue(
    completion,
    'observationCloseReason'
  )
  const captureWindowState = generatedDataValue(
    completion,
    'captureWindowState'
  )
  const evaluateReplyCountClass = generatedDataValue(
    completion,
    'evaluateReplyCountClass'
  )
  const cleanupFinalizeReason = generatedDataValue(
    completion,
    'cleanupFinalizeReason'
  )
  requireProjectionValue(
    typeof productEvidenceComplete === 'boolean' &&
      isOneOf(observationCloseReason, [
        'setup-cap',
        'setup-terminal-unproven',
        'capture-cap',
        'capture-terminal-unproven',
        'confirmed-violation',
      ]) &&
      generatedDataValue(completion, 'observationClosed') === true &&
      isOneOf(captureWindowState, [
        'not-started',
        'elapsed',
        'truncated',
      ]) &&
      isOneOf(evaluateReplyCountClass, [
        'zero',
        'one',
        'multiple',
        'unknown',
      ]) &&
      generatedDataValue(completion, 'requestBudgetFinalized') === true &&
      isOneOf(cleanupFinalizeReason, [
        'all-steps-terminal',
        'cleanup-cap',
        'cleanup-terminal-failure',
      ]) &&
      generatedDataValue(completion, 'cleanupFinalized') === true,
    'invalidProjectionCompletionValue'
  )
  const expectedProductEvidenceComplete =
    publicSettlement !== null &&
    generatedDataValue(publicSettlement, 'observationState') === 'observed' &&
    generatedDataValue(loadingStage, 'observationState') === 'observed' &&
    isOneOf(loadingStageId, [
      'post-loading-finished',
      'post-loading-failed',
    ]) &&
    generatedDataValue(requestBudget, 'sequence') !== 'ambiguous'
  requireProjectionValue(
    productEvidenceComplete === expectedProductEvidenceComplete,
    'invalidProjectionProductCompletionBinding'
  )
  if (
    observationCloseReason === 'setup-cap' ||
    observationCloseReason === 'setup-terminal-unproven'
  ) {
    requireProjectionValue(
      captureWindowState === 'not-started' &&
        evaluateReplyCountClass === 'zero' &&
        mainWorldCount === 'zero' &&
        publicSettlement === null &&
        generatedDataValue(requestBudget, 'endpointOptions') === 'unknown' &&
        generatedDataValue(requestBudget, 'endpointPosts') === 'unknown' &&
        generatedDataValue(requestBudget, 'endpointOtherMethods') === 'unknown' &&
        generatedDataValue(requestBudget, 'sequence') === 'incomplete',
      'invalidProjectionSetupCompletion'
    )
  } else if (observationCloseReason === 'capture-cap') {
    requireProjectionValue(
      captureWindowState === 'elapsed',
      'invalidProjectionCaptureCapCompletion'
    )
  } else if (observationCloseReason === 'capture-terminal-unproven') {
    requireProjectionValue(
      captureWindowState === 'truncated',
      'invalidProjectionCaptureTerminalCompletion'
    )
  } else {
    requireProjectionValue(
      captureWindowState === (
        generatedDataValue(observer, 'controllerEvaluateIntentCount') === 'zero'
          ? 'not-started'
          : 'truncated'
      ),
      'invalidProjectionViolationCompletion'
    )
  }
  if (generatedDataValue(observer, 'controllerEvaluateIntentCount') === 'zero') {
    requireProjectionValue(
      evaluateReplyCountClass === 'zero' &&
        mainWorldCount === 'zero' &&
        publicSettlement === null,
      'invalidProjectionGatedEvaluationCounts'
    )
  }
  if (
    evaluateOperationCount === 'unknown' &&
    evaluateOperationResult === 'unproven'
  ) {
    requireProjectionValue(
      evaluateReplyCountClass === 'unknown' &&
        mainWorldCount === 'unknown' &&
        factoryCount === 'unknown' &&
        transportCount === 'unknown' &&
        generatedDataValue(requestBudget, 'endpointOptions') === 'unknown' &&
        generatedDataValue(requestBudget, 'endpointPosts') === 'unknown' &&
        generatedDataValue(requestBudget, 'endpointOtherMethods') === 'unknown' &&
        generatedDataValue(requestBudget, 'sequence') === 'incomplete' &&
        publicSettlement === null,
      'invalidProjectionUnknownEvaluateSendBinding'
    )
  }
  const mainWorldIntegrityResult = generatedDataValue(
    generatedDataValue(integrityChecks, '16'),
    'result'
  )
  requireProjectionValue(
    (evaluateReplyCountClass === 'multiple') ===
      (mainWorldIntegrityResult === 'violated') &&
      (
        evaluateReplyCountClass === 'multiple'
          ? mainWorldCount === 'multiple' &&
            generatedDataValue(dispatchStage, 'observationState') === 'ambiguous' &&
            generatedDataValue(settlementStage, 'observationState') === 'ambiguous' &&
            publicSettlement === null
          : true
      ),
    'invalidProjectionEvaluateReplyCardinality'
  )

  const cleanup = generatedDataValue(projection, 'cleanup')
  requireProjectionValue(
    generatedDataValue(cleanup, 'observationClosedBeforeCleanup') === true &&
      isOneOf(generatedDataValue(cleanup, 'result'), [
        'PASS',
        'FAIL',
        'UNPROVEN',
      ]) &&
      generatedDataValue(cleanup, 'result') ===
        generatedDataValue(expectedProjectionValues, 'cleanupResult') &&
      generatedDataValue(cleanup, 'projectionMaterializedAfterCleanup') === true,
    'invalidProjectionCleanupValue'
  )
  const cleanupChecks = generatedDataValue(cleanup, 'checks')
  let anyCleanupFailed = false
  let anyCleanupUnproven = false
  let allCleanupConfirmed = true
  for (let index = 0; index < CLEANUP_CHECK_IDS.length; index += 1) {
    const check = generatedDataValue(cleanupChecks, CapturedString(index))
    const result = generatedDataValue(check, 'result')
    requireProjectionValue(
      generatedDataValue(check, 'checkId') === CLEANUP_CHECK_IDS[index] &&
        isOneOf(result, ['confirmed', 'failed', 'unproven']) &&
        result === generatedDataValue(
          expectedCleanupResults,
          CapturedString(index)
        ),
      'invalidProjectionCleanupCheckValue'
    )
    if (isOneOf(index, [0, 4, 10, 11, 12])) {
      requireProjectionValue(
        result === 'confirmed',
        'invalidProjectionConstructiveCleanupCheck'
      )
    } else if (
      index !== 1 && index !== 2 && index !== CLEANUP_CHECK_IDS.length - 1
    ) {
      requireProjectionValue(
        isOneOf(result, ['failed', 'unproven']),
        'invalidProjectionExternalCleanupCheck'
      )
    }
    anyCleanupFailed = anyCleanupFailed || result === 'failed'
    anyCleanupUnproven = anyCleanupUnproven || result === 'unproven'
    allCleanupConfirmed = allCleanupConfirmed && result === 'confirmed'
  }
  const cleanupResult = generatedDataValue(cleanup, 'result')
  requireProjectionValue(
    (!anyCleanupFailed || cleanupResult === 'FAIL') &&
      (
        cleanupResult === 'PASS'
          ? allCleanupConfirmed
          : true
      ) &&
      (
        cleanupResult === 'UNPROVEN'
          ? !anyCleanupFailed && anyCleanupUnproven
          : true
      ),
    'invalidProjectionCleanupResultDerivation'
  )
  const cleanupCompletionCheck = generatedDataValue(cleanupChecks, '19')
  const cleanupCompletionResult = generatedDataValue(
    cleanupCompletionCheck,
    'result'
  )
  const cleanupCompletionStage = generatedDataValue(stages, '9')
  if (cleanupFinalizeReason === 'all-steps-terminal') {
    requireProjectionValue(
      cleanupCompletionResult === 'confirmed' &&
        generatedDataValue(cleanupCompletionStage, 'observationState') ===
          'observed' &&
        generatedDataValue(cleanupCompletionStage, 'result') === 'match' &&
        isOneOf(generatedDataValue(cleanupCompletionStage, 'timingState'), [
          'measured',
          'at-or-above-cap',
        ]),
      'invalidProjectionTerminalCleanupCompletion'
    )
  } else if (cleanupFinalizeReason === 'cleanup-cap') {
    requireProjectionValue(
      cleanupCompletionResult === 'unproven' &&
        generatedDataValue(cleanupCompletionStage, 'observationState') ===
          'not-observed' &&
        generatedDataValue(cleanupCompletionStage, 'receiptOrder') === null &&
        generatedDataValue(cleanupCompletionStage, 'result') === 'unproven' &&
        generatedDataValue(cleanupCompletionStage, 'relativeMilliseconds') ===
          null &&
        generatedDataValue(cleanupCompletionStage, 'timingState') ===
          'unavailable',
      'invalidProjectionCleanupCapCompletion'
    )
  } else {
    requireProjectionValue(
      cleanupCompletionResult === 'failed' &&
        generatedDataValue(cleanupCompletionStage, 'observationState') ===
          'observed' &&
        generatedDataValue(cleanupCompletionStage, 'result') === 'mismatch' &&
        generatedDataValue(cleanupCompletionStage, 'relativeMilliseconds') ===
          null &&
        generatedDataValue(cleanupCompletionStage, 'timingState') ===
          'unavailable',
      'invalidProjectionFailedCleanupCompletion'
    )
  }

  const enableOperation = generatedDataValue(operations, '2')
  const disableOperation = generatedDataValue(operations, '4')
  const networkClosedCheck = generatedDataValue(cleanupChecks, '1')
  const enableNeverSent =
    generatedDataValue(enableOperation, 'observedCountClass') === 'zero' &&
    generatedDataValue(enableOperation, 'result') === 'match'
  const networkClosedConfirmed =
    generatedDataValue(networkClosedCheck, 'result') === 'confirmed'
  requireProjectionValue(
    (
      !enableNeverSent ||
      (
        networkClosedConfirmed &&
        generatedDataValue(disableOperation, 'observedCountClass') === 'zero' &&
        generatedDataValue(disableOperation, 'result') === 'match'
      )
    ) &&
      (
        !networkClosedConfirmed ||
        enableNeverSent ||
        (
          generatedDataValue(disableOperation, 'observedCountClass') === 'one' &&
          generatedDataValue(disableOperation, 'result') === 'match'
        )
      ),
    'invalidProjectionNetworkCleanupBinding'
  )
  const attachOperation = generatedDataValue(operations, '1')
  const detachOperation = generatedDataValue(operations, '5')
  const targetClosedCheck = generatedDataValue(cleanupChecks, '2')
  const attachNeverSent =
    generatedDataValue(attachOperation, 'observedCountClass') === 'zero' &&
    generatedDataValue(attachOperation, 'result') === 'match'
  const targetClosedConfirmed =
    generatedDataValue(targetClosedCheck, 'result') === 'confirmed'
  requireProjectionValue(
    (
      !attachNeverSent ||
      (
        targetClosedConfirmed &&
        generatedDataValue(detachOperation, 'observedCountClass') === 'zero' &&
        generatedDataValue(detachOperation, 'result') === 'match'
      )
    ) &&
      (
        !targetClosedConfirmed ||
        attachNeverSent ||
        (
          generatedDataValue(detachOperation, 'observedCountClass') === 'one' &&
          generatedDataValue(detachOperation, 'result') === 'match'
        )
      ),
    'invalidProjectionTargetCleanupBinding'
  )

  const adrGate = generatedDataValue(projection, 'adr0029OverallGate')
  requireProjectionValue(
    generatedDataValue(adrGate, 'before') === 'FAIL' &&
      generatedDataValue(adrGate, 'after') === 'FAIL' &&
      generatedDataValue(adrGate, 'unchanged') === true,
    'invalidProjectionAdr0029Gate'
  )
  const candidateObserverGate = generatedDataValue(
    projection,
    'candidateObserverGate'
  )
  const candidateFinding = generatedDataValue(projection, 'candidateFinding')
  requireProjectionValue(
    isOneOf(candidateObserverGate, ['FAIL', 'UNPROVEN']) &&
      candidateFinding === (
        candidateObserverGate === 'FAIL' ? 'observer-invalid' : 'inconclusive'
      ),
    'invalidProjectionCandidateValue'
  )
  let anyOperationMismatch = false
  for (let index = 0; index < PROTOCOL_COMMANDS.length; index += 1) {
    anyOperationMismatch = anyOperationMismatch ||
      generatedDataValue(
        generatedDataValue(operations, CapturedString(index)),
        'result'
      ) === 'mismatch'
  }
  const visibleHardViolation =
    observationCloseReason === 'confirmed-violation' ||
    cleanupResult === 'FAIL' ||
    anyIntegrityViolated ||
    anyOperationMismatch
  requireProjectionValue(
    candidateObserverGate === (visibleHardViolation ? 'FAIL' : 'UNPROVEN'),
    'invalidProjectionCandidateDerivation'
  )
}

function assertFoundationProjection(
  projection,
  forbidden,
  expectedProjectionIntegrity,
  expectedProjectionValues
) {
  const rootKeys = capturedReflectOwnKeys(projection)
  if (!exactKeys(rootKeys, FOUNDATION_PROJECTION_KEYS)) {
    throw new TypeError('invalidFoundationProjectionRoot')
  }
  assertClosedFrozenProjectionTree(projection, forbidden, new CapturedWeakSet())
  assertFoundationProjectionSchema(
    projection,
    expectedProjectionIntegrity,
    expectedProjectionValues
  )
}

function materializeFoundationProjection(machine, projectionIntegrityResult) {
  const snapshot = machine.preCleanupObservationSnapshot
  const ledger = machine.cleanupLedger
  const operations = new CapturedArray(6)
  for (let index = 0; index < 4; index += 1) {
    defineArrayElement(
      operations,
      index,
      cloneGeneratedTree(snapshot.observerObservation.protocolOperations[index])
    )
  }
  for (let index = 0; index < 2; index += 1) {
    defineArrayElement(
      operations,
      index + 4,
      cloneGeneratedTree(ledger.cleanupProtocolOperations[index])
    )
  }
  const integrityChecks = cloneGeneratedTree(
    snapshot.observerObservation.integrityChecks
  )
  if (
    integrityChecks[14].checkId !== 'closedPrimitiveProjectionConfirmed' ||
    !isOneOf(projectionIntegrityResult, ['confirmed', 'unproven'])
  ) {
    throw new TypeError('invalidProjectionIntegrityState')
  }
  integrityChecks[14].result = projectionIntegrityResult
  const observer = {
    deltaProfile: snapshot.observerObservation.deltaProfile,
    controllerExclusivity: snapshot.observerObservation.controllerExclusivity,
    connectionProfile: snapshot.observerObservation.connectionProfile,
    targetProfile: snapshot.observerObservation.targetProfile,
    foundationSha256: null,
    evaluationSha256: snapshot.observerObservation.evaluationSha256,
    controllerEvaluateIntentCount:
      snapshot.observerObservation.controllerEvaluateIntentCount,
    protocolOperations: operations,
    mainWorldEvaluationCount: snapshot.observerObservation.mainWorldEvaluationCount,
    transportFactoryCallCount:
      snapshot.observerObservation.transportFactoryCallCount,
    primitiveProjectionProfile:
      snapshot.observerObservation.primitiveProjectionProfile,
    integrityChecks,
    interferenceObservation: deriveInterferenceObservation(integrityChecks),
  }
  const stages = new CapturedArray(10)
  for (let index = 0; index < 8; index += 1) {
    defineArrayElement(
      stages,
      index,
      cloneGeneratedTree(snapshot.stagesOneThroughEight[index])
    )
  }
  for (let index = 0; index < 2; index += 1) {
    defineArrayElement(
      stages,
      index + 8,
      cloneGeneratedTree(ledger.cleanupStages[index])
    )
  }
  const timing = {
    roundingMilliseconds: snapshot.timingObservation.roundingMilliseconds,
    durationCapMilliseconds: snapshot.timingObservation.durationCapMilliseconds,
    setupWindowMilliseconds: snapshot.timingObservation.setupWindowMilliseconds,
    captureWindowMilliseconds: snapshot.timingObservation.captureWindowMilliseconds,
    clockDomains: cloneGeneratedTree(snapshot.timingObservation.clockDomains),
    calibration: snapshot.timingObservation.calibration,
    crossDomainComparison: snapshot.timingObservation.crossDomainComparison,
    completion: {
      productEvidenceComplete:
        snapshot.observationCompletion.productEvidenceComplete,
      observationCloseReason:
        snapshot.observationCompletion.observationCloseReason,
      observationClosed: true,
      captureWindowState: snapshot.observationCompletion.captureWindowState,
      evaluateReplyCountClass:
        snapshot.observationCompletion.evaluateReplyCountClass,
      requestBudgetFinalized: true,
      cleanupFinalizeReason: ledger.cleanupFinalizeReason,
      cleanupFinalized: true,
    },
  }
  const cleanup = {
    observationClosedBeforeCleanup: true,
    checks: cloneGeneratedTree(ledger.checks),
    result: ledger.result,
    projectionMaterializedAfterCleanup: true,
  }
  let hardViolation = snapshot.stickyViolation || ledger.result === 'FAIL'
  let proofIncomplete = snapshot.replay.equivalence.result !== 'EQUIVALENT' ||
    ledger.result !== 'PASS'
  for (let index = 0; index < observer.integrityChecks.length; index += 1) {
    hardViolation = hardViolation || observer.integrityChecks[index].result === 'violated'
    proofIncomplete = proofIncomplete || observer.integrityChecks[index].result === 'unproven'
  }
  const candidateObserverGate = deriveCandidateObserverGate(
    deepFreezeGenerated({ hardViolation, proofIncomplete })
  )
  const candidateFinding = deriveCandidateFinding(deepFreezeGenerated({
    candidateObserverGate,
    replayResult: snapshot.replay.equivalence.result,
    stimulusCount: snapshot.requestBudget.defaultTransportCalls,
    requestSequence: snapshot.requestBudget.sequence,
    settlementOutcome: snapshot.publicSettlement === null
      ? 'unknown'
      : snapshot.publicSettlement.outcome,
    settlementStaticProfileResult: snapshot.publicSettlement === null
      ? 'unproven'
      : snapshot.publicSettlement.staticProfileResult,
  }))
  return deepFreezeGenerated({
    schemaVersion: 1,
    projectionType: FOUNDATION_PROJECTION_TYPE,
    diagnosticRunId: machine.runBinding.diagnosticRunId,
    observedAt: machine.runBinding.observedAt,
    timeZone: machine.runBinding.timeZone,
    historicalEvidence: cloneGeneratedTree(snapshot.historicalEvidence),
    replay: cloneGeneratedTree(snapshot.replay),
    observer,
    requestBudget: cloneGeneratedTree(snapshot.requestBudget),
    publicSettlement: cloneGeneratedTree(snapshot.publicSettlement),
    stages,
    timing,
    cleanup,
    adr0029OverallGate: { before: 'FAIL', after: 'FAIL', unchanged: true },
    candidateObserverGate,
    candidateFinding,
    causeStatus: 'CAUSE_NOT_PROVEN',
  })
}

function createFoundationProjection(machine) {
  const forbidden = new CapturedWeakSet()
  collectGeneratedIdentities(machine.preCleanupObservationSnapshot, forbidden)
  collectGeneratedIdentities(machine.cleanupLedger, forbidden)
  collectGeneratedIdentities(machine.runBinding, forbidden)
  collectGeneratedIdentities(machine.acceptedMainWorldValue, forbidden)

  const snapshotObserver = capturedGetOwnPropertyDescriptor(
    machine.preCleanupObservationSnapshot,
    'observerObservation'
  ).value
  const snapshotIntegrityChecks = capturedGetOwnPropertyDescriptor(
    snapshotObserver,
    'integrityChecks'
  ).value
  const expectedIntegrityResults = new CapturedArray(
    INTEGRITY_CHECK_IDS.length
  )
  for (let index = 0; index < INTEGRITY_CHECK_IDS.length; index += 1) {
    const check = capturedGetOwnPropertyDescriptor(
      snapshotIntegrityChecks,
      CapturedString(index)
    ).value
    if (
      capturedGetOwnPropertyDescriptor(check, 'checkId').value !==
        INTEGRITY_CHECK_IDS[index]
    ) {
      throw new TypeError('invalidSnapshotIntegrityOrder')
    }
    defineArrayElement(
      expectedIntegrityResults,
      index,
      capturedGetOwnPropertyDescriptor(check, 'result').value
    )
  }
  const ledgerChecks = capturedGetOwnPropertyDescriptor(
    machine.cleanupLedger,
    'checks'
  ).value
  const expectedCleanupResults = new CapturedArray(CLEANUP_CHECK_IDS.length)
  for (let index = 0; index < CLEANUP_CHECK_IDS.length; index += 1) {
    const check = capturedGetOwnPropertyDescriptor(
      ledgerChecks,
      CapturedString(index)
    ).value
    if (
      capturedGetOwnPropertyDescriptor(check, 'checkId').value !==
        CLEANUP_CHECK_IDS[index]
    ) {
      throw new TypeError('invalidLedgerCleanupOrder')
    }
    defineArrayElement(
      expectedCleanupResults,
      index,
      capturedGetOwnPropertyDescriptor(check, 'result').value
    )
  }
  const expectedProjectionValues = deepFreezeGenerated({
    integrityResults: expectedIntegrityResults,
    cleanupResults: expectedCleanupResults,
    cleanupResult: capturedGetOwnPropertyDescriptor(
      machine.cleanupLedger,
      'result'
    ).value,
  })

  const checkedDraft = materializeFoundationProjection(machine, 'unproven')
  assertFoundationProjection(
    checkedDraft,
    forbidden,
    'unproven',
    expectedProjectionValues
  )
  collectGeneratedIdentities(checkedDraft, forbidden)

  const projection = materializeFoundationProjection(machine, 'confirmed')
  assertFoundationProjection(
    projection,
    forbidden,
    'confirmed',
    expectedProjectionValues
  )
  const observer = capturedGetOwnPropertyDescriptor(projection, 'observer').value
  const checks = capturedGetOwnPropertyDescriptor(observer, 'integrityChecks').value
  const projectionCheck = capturedGetOwnPropertyDescriptor(checks, '14').value
  if (
    capturedGetOwnPropertyDescriptor(projectionCheck, 'checkId').value !==
      'closedPrimitiveProjectionConfirmed' ||
    capturedGetOwnPropertyDescriptor(projectionCheck, 'result').value !== 'confirmed'
  ) {
    throw new TypeError('unconfirmedFoundationProjection')
  }
  return projection
}

// ADR-0035-CONFORMANCE-EXPORT-ANCHOR-V2

export function createBrowserSyncTransportRuntimeDiagnosticObserver(options) {
  let capturedExchange
  let capturedObservationClosed
  let internalRunBinding
  try {
    if (arguments.length !== 1) {
      throw new TypeError('invalidFactoryArity')
    }
    const visited = new CapturedWeakSet()
    const optionValues = readClosedRecord(
      options,
      ['effectPort', 'runBinding'],
      visited
    )
    const portValues = readClosedRecord(
      optionValues[0],
      ['exchange', 'observationClosed'],
      visited
    )
    if (
      typeof portValues[0] !== 'function' ||
      typeof portValues[1] !== 'function'
    ) {
      throw new TypeError('invalidEffectPort')
    }
    const notificationLength = capturedGetOwnPropertyDescriptor(portValues[1], 'length')
    if (
      notificationLength === undefined ||
      notificationLength.enumerable !== false ||
      capturedObjectHasOwn(notificationLength, 'value') !== true ||
      capturedObjectHasOwn(notificationLength, 'get') === true ||
      capturedObjectHasOwn(notificationLength, 'set') === true ||
      notificationLength.value !== 0
    ) {
      throw new TypeError('invalidObservationClosedCapability')
    }
    capturedExchange = portValues[0]
    capturedObservationClosed = portValues[1]
    internalRunBinding = copyRunBinding(optionValues[1], visited)
  } catch {
    throw new TypeError(FACTORY_DEPENDENCY_ERROR)
  }

  let runState = 'unused'
  let activeRunToken = null
  function run() {
    if (runState !== 'unused') {
      return createLocalResolvedPromise(createFoundationErrorResult())
    }
    runState = 'active'
    activeRunToken = 1
    if (arguments.length !== 0) {
      capturedExchange = null
      capturedObservationClosed = null
      internalRunBinding = null
      activeRunToken = null
      runState = 'terminal'
      return createLocalResolvedPromise(createFoundationErrorResult())
    }
    const activeExchange = capturedExchange
    const activeObservationClosed = capturedObservationClosed
    capturedExchange = null
    capturedObservationClosed = null
    let machine
    try {
      machine = createBrowserSyncTransportRuntimeDiagnosticRunMachine({
        activeExchange,
        activeObservationClosed,
        runBinding: internalRunBinding,
      })
      machine.ownerTerminalCallback = function ownerTerminalCallback() {
        activeRunToken = null
        runState = 'terminal'
      }
      internalRunBinding = null
      invokePreparedExchange(machine)
    } catch {
      internalRunBinding = null
      activeRunToken = null
      runState = 'terminal'
      return createLocalResolvedPromise(createFoundationErrorResult())
    }
    return machine.ownerRunPromise
  }

  return deepFreezeGenerated({ run })
}
