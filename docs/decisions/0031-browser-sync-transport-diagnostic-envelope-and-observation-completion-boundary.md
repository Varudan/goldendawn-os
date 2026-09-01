# ADR 0031 – BrowserSyncTransport Diagnostic Envelope and Observation Completion Boundary

## Status

Angenommen – 2026-08-30

Das dokumentierte ADR-0029-Runtimegate bleibt `FAIL`. Der Ursachenstatus bleibt
ausnahmslos `CAUSE_NOT_PROVEN`. Die Annahme dieses ADR ist weder
Ursachennachweis noch Runtime-`PASS`, Produktfreigabe, Implementierung oder
Laufautorisierung.

## Kontext

[ADR 0030](0030-browser-sync-transport-runtime-diagnostic-observer-boundary.md)
entscheidet die Grenze einer später zu implementierenden passiven
BrowserSyncTransport-Diagnose. Ein Implementierungsversuch wurde vor jeder
Dateiänderung und vor jeder Runtimeoperation korrekt gestoppt. Dabei wurden
drei Präzisierungsbedarfe getrennt:

1. Der bereits entschiedene `BrowserTransportDiagnosticRecord` enthält exakt
   20 Cleanup-Check-IDs. Die in einem späteren Implementierungsauftrag
   verlangte Zahl 21 war ein Fehler dieses Auftrags und keine Vertragslücke.
2. Das absolute ADR-0030-Verbot, dass ein `Runtime.RemoteObject` die Main World
   verlässt, ist mit der CDP-Antwort auf
   `Runtime.evaluate({ returnByValue: true })` unvereinbar. Das ursprüngliche
   Produktobjekt, der Responsewert und ein Rejectiongrund können in der Main
   World verbleiben; CDP liefert die geschlossene By-Value-Projektion dennoch
   innerhalb einer flüchtigen `Runtime.RemoteObject`-Protokollhülle.
3. ADR 0030 trennt öffentliches Settlement, Networkterminal und das
   6.000-ms-Capturefenster, legt aber keine eindeutige gemeinsame
   Abschlussbarriere fest. Ohne diese Barriere wäre offen, wann der
   Beobachtungszustand eingefroren und Cleanup begonnen werden darf.

Die Punkte 2 und 3 ändern normative Aussagen des angenommenen ADR 0030. Nach
den ADR-Regeln werden sie deshalb nicht rückwirkend in dessen Hauptteil
geschrieben, sondern durch diesen neuen ADR ersetzt.

## Formale ADR-Wirkung

> ADR 0031 ersetzt ADR 0030 formal und übernimmt sämtliche ADR-0030-Regeln vollständig, soweit diese Entscheidung sie nicht ausdrücklich korrigiert.

In ADR 0030 wird ausschließlich die Statuszeile auf „Ersetzt durch ADR 0031“
mit Datum `2026-08-30` geändert. Titel und Hauptteil ab `## Kontext` bleiben
bytegleich. ADR 0020, ADR 0028 und ADR 0029 sowie der historische
ADR-0029-Evidence-Record bleiben unverändert.

Der Diagnosepfad bleibt kein vierter ADR-0029-Vektor, kein zusätzliches
Runtimegate und keine Erweiterung des `BrowserRuntimeEvidenceRecord`. Dieses
ADR autorisiert weder die Diagnosefoundation noch einen Browser-, Gateway-,
Port-, Request-, Permission- oder Diagnoselauf.

## Entscheidung

### Exakt 20 Cleanup-Check-IDs

Der `BrowserTransportDiagnosticRecord` besitzt in Schema 1 exakt 20
Cleanup-Check-IDs. Es wird keine 21. ID ergänzt. Keine bestehende ID wird
entfernt, umbenannt oder umgeordnet. Die Reihenfolge bleibt exakt:

```text
cleanupStarted
networkDomainClosed
targetSessionClosed
debugPipeClosed
controllerObservationClosed
browserStopped
devServerStopped
gatewayStopped
profileRemoved
harnessFragmentsRemoved
objectGroupsAbsentOrReleased
rawEventsDiscarded
ephemeralIdentifiersDiscarded
permissionSiteCacheAndServiceWorkerStateCleared
environmentRestored
portsFree
repositoryAndIndexRestored
historicalEvidenceHashUnchanged
observerStorageLogAndTelemetryResidueAbsent
cleanupCompleted
```

Die frühere Zahl 21 stammt ausschließlich aus einem fehlerhaften
Implementierungsauftrag. `schemaVersion: 1` und
`recordType: browser-transport-diagnostic` bleiben unverändert.

### Main-World-Werte und flüchtige CDP-By-Value-Hülle

Das ursprüngliche Produktobjekt, ein Fulfillment-Responsewert und ein
Rejectiongrund bleiben vollständig in der Main World. Die einzige
Main-World-Auswertung projiziert das öffentliche Promise-Settlement dort
unmittelbar auf geschlossene primitive Werte. Der Responsewert wird nicht frei
inspiziert. Ein Rejectiongrund darf nur flüchtig gegen das bereits entschiedene
statische öffentliche Zwei-Felder-Profil geprüft werden und wird danach nicht
zurückgegeben oder behalten.

CDP überträgt diese Projektion bei `returnByValue: true` zwingend in einer
flüchtigen Protokollhülle. Die erfolgreiche Antwort auf das einzige
`Runtime.evaluate`-Kommando, das `Runtime.evaluate`-Methodenergebnis und dessen
`Runtime.RemoteObject` sind getrennte Protokollebenen:

1. Die Kommandoantwort muss eindeutig dem einzigen gesendeten
   `Runtime.evaluate` zugeordnet sein und eine erfolgreiche CDP-Antwort ohne
   eigenes CDP-Fehlerfeld sein.
2. Das `Runtime.evaluate`-Methodenergebnis darf keine eigene
   `exceptionDetails`-Property besitzen und muss als sein Ergebnis genau eine
   flüchtige `Runtime.RemoteObject`-Hülle bereitstellen.
3. Diese `Runtime.RemoteObject`-Hülle muss
   `type === "object"` und eine eigene serialisierte `value`-Property besitzen.
   Sie darf keine eigene `objectId`, `unserializableValue`,
   `deepSerializedValue`, `preview` oder `customPreview`-Property besitzen.
4. Ausschließlich die für die eindeutige CDP-Antwortkorrelation erforderlichen
   Routingfelder dürfen flüchtig ausgewertet werden; ihre Werte werden direkt
   nach der Zuordnung verworfen. Daneben dürfen nur die erlaubten `type`- und
   `value`-Properties ausgewertet werden. Beim CDP-Fehlerfeld, bei
   `exceptionDetails` und bei allen verbotenen `Runtime.RemoteObject`-Feldern
   wird ausschließlich ihre Own-Presence festgestellt; ihr Inhalt wird auch
   bei einer Vertragsverletzung niemals gelesen.

Die flüchtige `Runtime.RemoteObject`-Hülle ist kein autorisierter Remote-Handle
und kein persistierbares Diagnoseartefakt. Die eigene `value`-Property muss
exakt diese vier und keine weiteren eigenen Projektionsfelder enthalten:

```text
{
  outcome,
  staticProfileResult,
  relativeMilliseconds,
  timingState
}
```

Die geschlossenen Werte bleiben:

```text
outcome =
  fulfilled |
  static-redacted-rejection |
  other-rejection

staticProfileResult =
  match |
  mismatch |
  not-applicable
```

Zulässig sind genau diese drei Paare:

```text
fulfilled                   + not-applicable
static-redacted-rejection   + match
other-rejection             + mismatch
```

`relativeMilliseconds` und `timingState` folgen ausschließlich der bestehenden
ADR-0030-Timinggrenze. Die vier Felder werden unmittelbar auf den bereits
entschiedenen geschlossenen Diagnosezustand projiziert. Abgesehen von den nur
zur eindeutigen CDP-Antwortkorrelation erforderlichen flüchtigen Routingfeldern
werden sämtliche sonstigen Metadaten der Kommandoantwort, des
Methodenergebnisses und der `Runtime.RemoteObject`-Hülle weder ausgewertet noch
persistiert. Hülle, Routingfelder und alle nicht projizierten Felder werden
unmittelbar nach der Projektion verworfen.

Das einzige `Runtime.evaluate` behält exakt:

```text
awaitPromise: true
returnByValue: true
generatePreview: false
```

Weiterhin fehlen `objectGroup`, Command-Line-API, User-Gesture-Modus,
`serializationOptions` und jede zweite Evaluation. Verboten bleiben außerdem:

- `Runtime.getProperties`;
- `Runtime.releaseObject`;
- Dereferenzierung eines `objectId`;
- jede Folgeinspektion;
- Objektpreview;
- Fehler-, Stack- oder Responseinspektion;
- Behalten, Loggen oder Persistieren der Protokollhülle.

Der exakte Profilwert lautet nun:

```text
primitiveProjectionProfile =
  immediate-closed-by-value-primitives-via-transient-cdp-remote-object-envelope-no-handle-v1
```

`relationId = adr-0030-causal-replay-v1` und
`deltaProfile = adr-0030-passive-external-observer-v1` bleiben unverändert,
weil Replayrelation und Observerdelta nicht geändert werden.

### Statusableitung für die Protokollhülle

Eine eindeutig korrelierte Antwort mit falscher Hüllenform ist eine bestätigte
Vertragsverletzung. Dazu gehören insbesondere ein eigenes CDP-Fehlerfeld,
`exceptionDetails`, ein Remote-Handle, Preview, alternative Serialisierung,
ein falscher `Runtime.RemoteObject.type`, eine fehlende oder nicht geschlossene
eigene `value`-Property oder ein unzulässiges outcome/profile-Paar. Die
Verletzung setzt `closedPrimitiveProjectionConfirmed` auf `violated` und
ergibt:

```text
observerGate: FAIL
finding: observer-invalid
```

Verbotene Feldinhalte werden auch auf diesem Pfad nicht gelesen.

Eine fehlende, abgeschnittene, doppelte, nicht korrelierbare oder nicht
eindeutig klassifizierbare Antwort ergibt ohne eine anderweitig bestätigte
Vertragsverletzung:

```text
observerGate: UNPROVEN
finding: inconclusive
```

In beiden Fällen bleiben:

```text
internalStage: unknown
internalOwner: unknown
causeStatus: CAUSE_NOT_PROVEN
```

Eine bestätigte Verletzung besitzt bei jeder späteren Statusaggregation
`FAIL`-Präzedenz vor fehlenden oder unbewiesenen Beobachtungen.

### Gemeinsame Observation-Completion-Barriere

Der Controller führt ausschließlich diese drei lokalen booleschen Zustände:

```text
S = gültiges und eindeutig korreliertes öffentliches Settlement projiziert
N = eindeutig dem POST zugeordnetes loadingFinished oder loadingFailed beobachtet
C = controllerlokales 6.000-ms-Capturefenster erreicht
```

Das Capturefenster beginnt auf der controller-monotonen Clock beim Senden des
einzigen `Runtime.evaluate`-Kommandos. Die einzige Abschlussformel lautet:

```text
observationClosed := (S && N) || C
```

Die controllerlokale Verarbeitung ist geschlossen:

1. Settlement allein startet keinen Cleanup.
2. Networkterminal allein startet keinen Cleanup.
3. Trifft das Settlement zuerst ein, bleibt die Beobachtung bis zum eindeutig
   zugeordneten Networkterminal oder bis zum Cap offen.
4. Trifft das Networkterminal zuerst ein, bleibt sie bis zum gültigen
   Settlement oder bis zum Cap offen.
5. Sobald `S && N` vor dem Cap wahr ist, wird der Beobachtungszustand
   unmittelbar und atomar geschlossen und eingefroren.
6. Gewinnt der controllerlokale Cap, werden alle noch offenen Slots in
   demselben atomaren Schritt als `not-observed` beziehungsweise `unproven`
   eingefroren.
7. Erst nach diesem geschlossenen und eingefrorenen Beobachtungszustand wird
   `cleanup-started` gesetzt und Cleanup begonnen.
8. Spätere Evaluate-Antworten oder Networkevents werden verworfen und ändern
   weder Slots noch Befund.

Bei einem Ereignis exakt am Cap entscheidet ausschließlich die Reihenfolge, in
der der Controller den Ereignisempfang beziehungsweise den Timerabschluss vor
dem atomaren Freeze verarbeitet. Eine rückwirkende Zuordnung ist verboten.
Die Verbindung von `S` und `N` ist nur eine controllerlokale Zustandsbarriere;
sie behauptet keine globale zeitliche Ordnung zwischen Main-World-, Network-
und Controllerclock.

Ein fehlendes `S` oder `N` am Cap erzwingt ohne höherrangigen bestätigten
Verstoß `observerGate: UNPROVEN` und `finding: inconclusive`. Eine bereits
bestätigte Vertragsverletzung behält ihre `FAIL`-Präzedenz. Ein erst durch
Cleanup ausgelöstes `loadingFailed` ist keine Produktbeobachtung.

Der eingefrorene Beobachtungszustand ist nicht mit dem endgültigen
Cleanupstatus gleichzusetzen. Er ist ausschließlich die unveränderliche
Eingabe für den danach ausgeführten Cleanup. `cleanup.result` kann erst nach
Auswertung aller exakt 20 Cleanup-Checks `PASS`, `FAIL` oder `UNPROVEN`
werden; der persistierbare Record wird weiterhin erst nach abgeschlossenem
Cleanup materialisiert.

Cleanup vor `(S && N) || C`, die Übernahme eines späten Ereignisses oder eine
nachträgliche Änderung des eingefrorenen Beobachtungszustands ist eine
bestätigte Ablaufverletzung und ergibt ausnahmslos:

```text
cleanup.result: FAIL
observerGate: FAIL
finding: observer-invalid
```

### Unveränderte Diagnosegrenzen

ADR 0031 führt ausdrücklich unverändert fort:

- `T_replay ≡R T₀`;
- `T_diag = T_replay + Δ_observer`;
- genau eine Main-World-Evaluation und genau einen Transportstimulus;
- die sechs CDP-Kommandos und ihre bisherigen Höchstzahlen;
- die vier Networkeventklassen;
- exakt zehn externe Stages;
- getrennte Clock-Domänen ohne Cross-Domain-Vergleich;
- das exakte targetgebundene Requestbudget;
- `internalStage: unknown`;
- `internalOwner: unknown`;
- `causeStatus: CAUSE_NOT_PROVEN`;
- ADR-0029-`overallGate` vor und nach der Diagnose exakt `FAIL`;
- keine Ursachenbehauptung aus Reproduktion oder Timing;
- vollständige Redaction;
- keinen Produktfix, keine Browserkomposition und kein Browser-End-to-End.

Absolute Observerneutralität wird weiterhin nicht behauptet. Alle nicht
ausdrücklich korrigierten Redaction-, Replay-, Request-, Stage-, Timing-,
Status-, Cleanup- und Aussagegrenzen aus ADR 0030 bleiben normativ.

Die öffentliche
[CDP-Runtime-Dokumentation](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/)
darf ausschließlich als Protokollreferenz genannt werden. Sie ist keine
Chrome-151-Runtimeevidenz.

## Verbindliche Folgereihenfolge

Die weitere Reihenfolge lautet:

1. ADR 0031 als formale Korrektur von ADR 0030 dokumentieren und mergen;
2. die passive Diagnosefoundation in einem eigenen vollständig netzwerkfreien
   Implementierungsslice erstellen und testen;
3. erst danach Zielbrowser, `T_replay`, Observer, exakt einen Request,
   Benutzerinteraktion und Cleanup separat autorisieren;
4. den einmaligen sichtbaren Diagnoselauf ausführen und getrennt dokumentieren;
5. nur bei ausreichendem Befund einen neuen Produktentscheidungs-ADR erstellen;
6. Produktänderungen ausschließlich in einem eigenen Implementierungsslice
   vornehmen;
7. anschließend einen vollständig neuen ADR-0029-Runtime-Evidence-Lauf mit
   neuer Run-ID und vollständiger Gatematrix separat autorisieren;
8. Browserkomposition und Browser-End-to-End bleiben bis zu einem späteren
   ADR-0029-Gesamt-`PASS` geschlossen.

Kein Schritt impliziert den nächsten. Insbesondere autorisiert dieser
Dokumentationsslice weder Foundationimplementierung noch Browserstart,
CDP-Verbindung, Port oder Request.

## Bedingungen für eine Neubewertung

Eine Änderung an Replayrelation, Observerdelta, CDP-Allowlist,
Networkeventklassen, Anzahl der Evaluationen oder Transportstimuli,
Requestbudget, Stagekatalog, Clock-Domänen, Projection- oder
Observation-Completion-Profil, Cleanup-IDs, Statusableitung oder Redaction
benötigt einen neuen ADR.

Eine spätere Sourceinstrumentierung, ein Remote-Handle, eine
`Runtime.getProperties`-Folgeinspektion, alternative Serialisierung, ein
zweiter Auswertungskontext, freie Rohdaten, interne Stage-/Ownerbeobachtung
oder zusätzliche Requests benötigt ebenfalls einen neuen ADR und einen
eigenen Slice.

## Strikte Grenze dieses Dokumentationsslices

In diesem Slice werden weder Diagnosefoundation noch Tests für sie,
Main-World-Auswertung, Controller, Harness, Fixture, Launcher, Recordvorlage
oder Diagnose-Record erstellt. Es erfolgen keine Produkt-, Server-, Contract-,
Test-, Paket-, Bundle-, Manifest- oder Generatoränderungen.

Ausdrücklich nicht ausgeführt werden Browser, Vite, Gateway, CDP-Verbindung,
Debug-Pipe, Listener, Port, Request, Permission- oder Profiloperation und
Diagnose. Cloud, n8n, Provider, Credentials, Vault und private Daten bleiben
unberührt. Browserkomposition und Browser-End-to-End-`syncTest` bleiben
geschlossen.

Die bestehende automatisierte Suite, der Produktions-Build und der
schreibfreie Bundlecheck dürfen ausschließlich als lokale Regression gelten.
Sie sind weder Runtime- noch Diagnoseevidenz.

## Tor A

Phase 0/Tor A bleibt für diesen Dokumentationsslice eng bestätigt. Er führt
kein Modell, keine statistische Inferenz, keinen Provider, keine Credentials,
keine privaten Inhalts-Payloads und keinen Logging-, Storage- oder
Telemetriepfad ein. Er trifft keine Rechts- oder Complianceklassifikation.

Die Diagnosefoundation muss Tor A anhand ihrer tatsächlichen APIs,
Dependencies, Datenflüsse und Testseams erneut prüfen. Der spätere reale Lauf
benötigt zusätzlich seine eigene kontext-, versions- und
autorisierungsgebundene Prüfung.

## Konsequenzen

Positive Auswirkungen:

- Die CDP-By-Value-Übertragung wird technisch korrekt beschrieben, ohne einen
  Remote-Handle oder Rohdatenpfad zu erlauben.
- Die genaue Trennung von Kommandoantwort, Methodenergebnis,
  `Runtime.RemoteObject`-Hülle und geschlossener `value`-Projektion macht
  bestätigte Hüllenverletzungen von unvollständiger Evidenz unterscheidbar.
- `(S && N) || C` macht den Beobachtungsabschluss deterministisch und hält ihn
  vom späteren Cleanupresultat getrennt.
- Die bestätigten 20 Cleanup-IDs bleiben ohne künstliche Schemaänderung
  erhalten.
- `FAIL`-Präzedenz verhindert, dass eine bestätigte Verletzung durch einen
  späteren unbewiesenen Slot abgeschwächt wird.

Kosten und verbleibende Grenzen:

- Der externe Observer kann den Lauf weiterhin beeinflussen; absolute
  Neutralität bleibt unbeweisbar.
- Die flüchtige Protokollhülle vergrößert nicht den Diagnoseinhalt, muss aber
  vor ihrer sofortigen Verwerfung geschlossen geprüft werden.
- Der Observer sieht weiterhin weder interne Fehlerstufe noch
  First-Terminal-Owner.
- Jeder Implementierungs- und Laufabschnitt benötigt ein neues enges Review
  und eine eigene Autorisierung.

## Erwogene Alternativen

### Eine 21. Cleanup-ID ergänzen

Verworfen. Der Datenvertrag besitzt bereits exakt 20 vollständige IDs. Eine
zusätzliche ID würde einen nicht bestehenden Vertragsfehler erzeugen und ohne
fachlichen Bedarf Schema und Testmatrix ändern.

### Jedes `Runtime.RemoteObject` absolut verbieten

Verworfen. Auch die verlangte By-Value-Antwort wird durch CDP in einer
flüchtigen `Runtime.RemoteObject`-Hülle transportiert. Entscheidend sind
fehlender Handle, fehlende Preview und die unmittelbare geschlossene
By-Value-Projektion.

### Cleanup nach dem ersten Settlement oder Networkterminal beginnen

Verworfen. Das würde jeweils die andere notwendige Beobachtung abschneiden und
cleanupverursachte Networkevents mit Produktbeobachtungen vermischen können.

### Am Cap rückwirkend eintreffende Ereignisse übernehmen

Verworfen. Eine rückwirkende Zuordnung würde den atomaren Freeze und die
deterministische controllerlokale Reihenfolge aufheben.

## Review

Der unabhängige Daybreak-Blue-Vorabreview identifizierte die fehlerhafte
Cleanup-Kardinalitätsforderung, die technisch unvermeidbare flüchtige
CDP-By-Value-Hülle und die fehlende gemeinsame Completion-Barriere. Der
Contract-Audit verlangte zusätzlich die Trennung der drei Protokollebenen,
Own-Presence-Prüfungen ohne Lesen verbotener Inhalte, genau drei gültige
outcome/profile-Paare, die Trennung von Beobachtungsfreeze und endgültigem
Cleanupstatus sowie ausdrückliche `FAIL`-Präzedenz. Diese Anforderungen sind
Bestandteil der Entscheidung.

## Verwandte Dokumente

- [ADR 0020 – Local SyncGateway Raw-Wire and HTTP Foundation](0020-local-sync-gateway-raw-wire-http-foundation.md)
- [ADR 0028 – Browser SyncTransport Validator Integrity Boundary](0028-browser-sync-transport-validator-integrity-boundary.md)
- [ADR 0029 – Local Browser Runtime Evidence Gate](0029-browser-runtime-evidence-gate.md)
- [ADR 0030 – BrowserSyncTransport Runtime Diagnostic Observer Boundary](0030-browser-sync-transport-runtime-diagnostic-observer-boundary.md)
- [Datenverträge](../data-contracts.md#browser-transport-diagnostic-record--adr-0030)
- [Architektur](../architecture.md)
- [Security](../security.md)
- [Roadmap](../roadmap.md)
