# ADR 0014: Begrenzte private LichtwaldLog-Full-Snapshot-Persistenz

## Status

Angenommen – 2026-07-26

## Kontext

ADR 0013 legt den kleinen LichtwaldLog-Schema-1-Vertrag mit einer einzelnen
Fokusreferenz fest und verschiebt den konkreten lokalen Persistenzpfad bewusst
in einen eigenen Slice. Dieser nächste Slice benötigt eine private
Storage-Grenze, ohne bereits Service, Controller, View, CRUD, Suche oder Filter
einzuführen.

Der vollständige Root enthält sowohl `entries` als auch `featuredEntryId`.
Getrennte Storage-Werte könnten deshalb einen Zustand erzeugen, in dem die
Fokusreferenz nicht mehr zum Eintragsbestand passt. Gleichzeitig können bis zu
1.000 vertragsgültige Einträge mit längeren Texten einen großen JSON-Snapshot
erzeugen. Die bestehenden Feld- und Mengenlimits begrenzen diesen
Gesamtverbrauch nicht ausreichend und die browserabhängige `localStorage`-
Quota ist keine verlässliche Anwendungsgrenze.

Der gemeinsame `StorageAdapter` kapselt bereits JSON-Serialisierung und
technische Browserfehler für alle lokalen Domänen. Die LichtwaldLog-Foundation
soll diese Grenze wiederverwenden, ohne einen zweiten Raw-JSON-Pfad oder eine
zweite Serialisierung einzuführen. Bestehende unlimitierte Aufrufer müssen
dabei unverändert funktionieren.

Private Journalinhalte sind besonders schutzbedürftig. Beschädigte,
synthetische, inkompatible oder übergroße vorhandene Werte dürfen nicht durch
einen vermeintlichen Leerzustand oder einen neuen Save automatisch
überschrieben werden. Fehler müssen stabil und ohne private Inhalte oder fremde
Exception-Meldungen bleiben.

## Entscheidung

### Fester Key und unabhängige Versionierung

LichtwaldLog verwendet ausschließlich diesen festen, nicht
nutzergesteuerten Storage-Key:

```text
goldendawn.lichtwaldLog.content.v1
```

Das `v1` versioniert den Persistenznamespace. Der gespeicherte Vertrag wird
unabhängig davon über `schemaVersion: 1` versioniert. Eine spätere Änderung des
Schemas erzwingt daher nicht stillschweigend einen anderen Key, und eine
Migration des Persistenznamespace darf nicht durch eine unveränderte
Schemaversion vorgetäuscht werden.

Der Wert unter diesem Key ist direkt der vollständige Schema-1-Root. Es gibt
kein zusätzliches Storage-Envelope und keine getrennten Keys für `entries` und
`featuredEntryId`. Jede erfolgreiche Speicherung schreibt genau einen
vollständigen validierten JSON-Snapshot.

### Private-only-Storage-Grenze

Der allgemeine LichtwaldLog-Vertrag akzeptiert `synthetic` und `private`. Die
private Storage-Foundation akzeptiert an ihrer Lese- und Schreibgrenze dagegen
ausschließlich `dataOrigin: private`. Diese Herkunftsprüfung wird nach jedem
defensiven Clone erneut durchgeführt.

`dataOrigin` ist nur eine fachliche Klassifikation. Das Feld verschlüsselt
nichts, authentifiziert keine Person und bildet keine technische
Zugriffskontrolle.

### Begrenzung der tatsächlichen JSON-Zeichenfolge

Der LichtwaldLog-Snapshot ist auf exakt 500.000 serialisierte
UTF-16-Codeeinheiten begrenzt. Maßgeblich ist die tatsächliche von
`JSON.stringify` erzeugte Zeichenfolge und deren JavaScript-`String.length`,
einschließlich notwendiger JSON-Escapes. Ein Wert mit exakt 500.000
Codeeinheiten ist erlaubt. Jeder größere Wert wird kontrolliert abgelehnt.

Diese Grenze ist eine Anwendungsgrenze und keine Browser-Quota-Garantie. Auch
ein kleinerer Wert kann wegen einer bereits ausgeschöpften oder abweichenden
Browser-Quota scheitern. `QuotaExceededError` bleibt deshalb ein eigener
Fehlerfall und wird nicht als Größenlimitverletzung umklassifiziert.

### Rückwärtskompatible StorageAdapter-Erweiterung

Der gemeinsame Adapter erhält diese optional begrenzbaren Signaturen:

```text
readJson(key, options?)
writeJson(key, value, options?)
```

Ohne `options` beziehungsweise mit `undefined` bleibt das bestehende Verhalten
aller bisherigen Aufrufer unverändert. Wird `options` angegeben, muss
`options.maxSerializedLength` eine positive sichere Ganzzahl sein. Eine
ungültige Konfiguration wird vor jedem Storage- oder Serialisierungszugriff mit
`invalidLimit` / `invalidStorageLimit` abgelehnt.

Beim Lesen wird nach Key- und Optionsprüfung `getItem` kontrolliert aufgerufen.
Ein fehlender Key bleibt `missing`. Ein vorhandener String wird vor
`JSON.parse` anhand seiner tatsächlichen Länge geprüft. Bei Überschreitung
liefert der Adapter `sizeLimitExceeded` / `storageSizeLimitExceeded`, ohne den
String zu parsen.

Beim Schreiben wird der Wert nach Key- und Optionsprüfung exakt einmal mit
`JSON.stringify` serialisiert. Serialisierungsfehler bleiben kontrolliert. Die
tatsächliche Stringlänge wird vor `setItem` geprüft. Bei Überschreitung wird
`setItem` nicht aufgerufen und derselbe Größenfehler zurückgegeben; andernfalls
erfolgt genau ein `setItem`-Aufruf.

Die JSON-Serialisierung verbleibt vollständig im gemeinsamen Adapter.
`LichtwaldLogStorage` greift weder direkt auf `localStorage` zu noch erzeugt es
einen zweiten serialisierten Rohwert.

Die Semantik von `removeJsonIfUnchanged` wird nicht verändert. Die gemeinsame
Fehlerklassifikation wird jedoch für alle drei Adaptermethoden gehärtet: Ein
Fehlerobjekt mit werfendem oder unlesbarem `name`-Getter darf keine Exception
entkommen lassen und fällt auf den allgemeinen Lese-, Schreib- beziehungsweise
Entfernungsfehler zurück.

### Kleine eingefrorene LichtwaldLogStorage-API

`createLichtwaldLogStorage(storageAdapter)` gibt ausschließlich eine
eingefrorene API mit diesen beiden Methoden zurück:

```text
loadLichtwaldLog
saveLichtwaldLog
```

Die Foundation bietet keine frei wählbaren Keys und keine Methoden für Delete,
Clear, Reset, Import, Export, Migration, Seeding, Append oder Sync.

Fehlt der feste Key, liefert jeder Load ohne Schreibzugriff einen neuen
privaten Leerzustand mit `schemaVersion: 1`, `dataOrigin: private`,
`featuredEntryId: null` und einem leeren `entries`-Array. Der Leerzustand wird
nicht zwischen Aufrufen geteilt.

Ein gefundener Wert wird mit dem festen Größenlimit geladen, vollständig mit
`validateLichtwaldLog` validiert und auf private Herkunft geprüft. Danach wird
er defensiv tief geklont, als Clone erneut vollständig validiert und nur als
detached Clone zurückgegeben. Synthetische, beschädigte, inkompatible oder
übergroße Bestände werden nicht umklassifiziert, repariert, gelöscht oder
überschrieben.

Beim Speichern wird zuerst der vollständige Kandidat validiert und auf private
Herkunft geprüft. Erst danach folgen defensiver tiefer Clone, erneute
vollständige Validierung, erneute Herkunftsprüfung und die Prüfung der
benötigten Adaptermethoden. Vor dem Write liest der Storage den vorhandenen Key
mit demselben Limit. Jeder Fehler dieses Preflights beendet die Operation ohne
Schreibzugriff. Nur ein fehlender Key oder ein vollständig valider privater
Bestand erlaubt den anschließenden Full-Snapshot-Write des validierten Clones.
Weder geladene oder zu speichernde Eingaben noch sichere Rückgabewerte werden
mutiert oder zwischen Aufrufen als veränderliche Referenz geteilt.

Der Read-Preflight schützt problematische vorhandene Werte vor automatischem
Überschreiben. Er ist ausdrücklich keine Transaktion, kein Compare-and-Swap,
kein Lock und kein Schutz vor TOCTOU- oder Multi-Tab-Rennen.

### Stabile Fehlergrenze und Redaktion

Die fachliche Storage-Schicht akzeptiert nur eine feste Allowlist bekannter
Status-Code-Paare des gemeinsamen Adapters und ersetzt deren Meldungen durch
eigene statische LichtwaldLog-Texte. Geworfene, widersprüchliche, unbekannte
oder formal unbrauchbare Adapterresultate werden als `storageFailed` /
`unexpectedStorageResult` behandelt. Fehlende Adaptermethoden liefern
`unavailable` / `storageAdapterUnavailable`.

Ungültige gespeicherte Vertragsdaten liefern `invalidStoredData` /
`invalidLichtwaldLogData`, nicht private gespeicherte Daten
`invalidStoredData` / `privateLichtwaldLogRequired`. Ein ungültiger
Save-Kandidat liefert `validationFailed` / `invalidLichtwaldLogData`, ein nicht
privater Kandidat `validationFailed` / `privateLichtwaldLogRequired`.

Fehler und Logs enthalten niemals Entry-IDs, `featuredEntryId`, Titel, Texte,
Tags, vollständige JSON-Werte, tatsächliche gespeicherte Größen, fremde
Adapter- oder `DOMException`-Meldungen, Stacktraces oder Validator-Rohwerte.
Die Foundation erzeugt keine Console-Ausgaben.

### Keine Reparatur oder vorgezogene spätere Phase

Die Storage-Foundation führt keine Reparatur, Migration, Demo-Übernahme,
automatische Initialisierung oder Löschung problematischer Bestände ein. Es
entstehen weder Service, Controller, View, CRUD, Suche noch Filter. Bilder und
andere Binärdaten bleiben aus `v0.2.2` ausgeschlossen.

LichtwaldLog erhält keine Sync-Felder, externen Aktionen, Airtable-IDs,
Agentenmetadaten, KI-Ausgaben oder technischen Zeitstempel. Der Slice verwendet
keine externe Kommunikation, Webhooks, Synchronisierung, Agentenlogik oder
Airtable-Anbindung. Ein späterer Agentenfluss benötigt einen eigenen
minimierten Vertrag; der private lokale Gesamtsnapshot darf nicht automatisch
oder vollständig an Agenten weitergegeben werden.

### Explizite Sicherheitsgrenzen

`localStorage` ist unverschlüsselt und kann von JavaScript derselben Origin
gelesen oder verändert werden. Die Foundation bietet keine Authentifizierung,
Zugriffskontrolle, kryptografische Integritätsgarantie, Transaktion,
Multi-Tab-Sperre, Cloud-Sicherung oder geräteübergreifende Synchronisierung.
Das Löschen des Browserprofils kann den vollständigen Store entfernen.

Aus dem lokalen, deterministischen Storage-Slice wird weder eine formale
Konformitäts- oder Risikoklassifizierungsbehauptung nach dem EU AI Act noch
eine allgemeine Sicherheitskonformität abgeleitet.

## Konsequenzen

Positive Auswirkungen:

- Fokusreferenz und Einträge bleiben in einem gemeinsam validierten Snapshot;
- der feste Key und die kleine eingefrorene API begrenzen Fehlbedienung und
  versteckte Persistenzpfade;
- die Prüfung der tatsächlichen JSON-Zeichenfolge erfasst auch
  Serialisierungsescaping und weist übergroße Reads vor dem Parsen ab;
- bestehende unlimitierte Adapteraufrufer bleiben rückwärtskompatibel;
- vollständige Validierung, defensive Klone und Read-Preflight schützen
  Eingaben sowie vorhandene problematische Bestände vor unbeabsichtigter
  Mutation beziehungsweise Überschreibung;
- statische Fehlertexte reduzieren das Risiko, private Inhalte oder fremde
  Fehlermeldungen offenzulegen.

Kosten und Einschränkungen:

- jeder Save validiert, klont, liest und serialisiert den vollständigen
  Snapshot;
- das Anwendungslimit garantiert keine verfügbare Browser-Quota;
- ein beschädigter, inkompatibler, synthetischer oder übergroßer vorhandener
  Wert blockiert automatische Saves, bis eine spätere ausdrücklich
  beschlossene Behandlung existiert;
- zwischen Read-Preflight und Write kann ein anderer Tab den Wert verändern;
- lokale unverschlüsselte Speicherung schützt nicht vor Same-Origin-Code oder
  dem Löschen des Browserprofils;
- ohne Service und UI ist die Foundation noch kein bedienbares Journal-Modul.

## Erwogene Alternativen

### Getrennte Keys für Einträge und Fokus

Getrennte Writes könnten eine verwaiste oder falsche Fokusreferenz erzeugen.
Der einzelne vollständige Snapshot hält beide Vertragsbestandteile gemeinsam
validierbar.

### Zusätzliches Storage-Envelope

Ein zweites Envelope würde keine aktuelle fachliche Anforderung erfüllen und
Key-, Contract- und Serialisierungssemantik unnötig vervielfachen. Der direkte
Schema-1-Root ist ausreichend und eindeutig versioniert.

### Ausschließlich auf Browser-Quota vertrauen

Browserquoten sind umgebungsabhängig und reagieren erst beim Schreibversuch.
Das feste Anwendungslimit ermöglicht dagegen einen deterministischen Read- und
Write-Preflight, ersetzt den getrennten Quota-Fehler aber nicht.

### Vorab geschätzte Objektgröße oder zweite Serialisierung

Eine Schätzung würde JSON-Escaping und tatsächliche Serialisierungsdetails
nicht zuverlässig erfassen. Eine zweite Serialisierung im fachlichen Storage
könnte vom tatsächlich geschriebenen Wert abweichen. Deshalb misst nur der
gemeinsame Adapter seine eine autoritative JSON-Zeichenfolge.

### Problematische Bestände beim Save überschreiben

Ein solcher Pfad könnte private oder diagnostisch wichtige Rohwerte endgültig
verlieren. Der Read-Preflight blockiert den Write und überlässt Reparatur,
Migration oder Löschung einer späteren ausdrücklichen Entscheidung.

### Synthetische Daten automatisch in den privaten Store übernehmen

Ein automatischer Demo-Import würde die Herkunftsgrenze verwischen und könnte
vorhandene private Daten gefährden. Die Storage-Foundation bleibt strikt
private-only und besitzt keine Seed-Funktion.

### Transaktion oder Multi-Tab-Locking vortäuschen

Ein Read-Preflight kann ohne zusätzliche Koordination keine atomare
Compare-and-Swap-Semantik bieten. Eine echte Multi-Tab-Lösung benötigt einen
eigenen Vertrag und wird nicht durch eine stärkere Bezeichnung des aktuellen
Ablaufs vorgetäuscht.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- das Schema oder der Persistenznamespace versioniert geändert werden muss;
- reale lokale Nutzung zeigt, dass das 500.000-Codeeinheiten-Limit fachlich
  angepasst werden sollte;
- Reparatur, Migration, Import, Export, Backup oder Recovery eingeführt werden;
- Service, CRUD oder Löschregeln neue Persistenzoperationen benötigen;
- Bilder oder andere Binärdaten einen geeigneten separaten Speicher erfordern;
- Authentifizierung, Zugriffskontrolle oder ein Backend eingeführt werden;
- Multi-Tab-Koordination, Transaktionen oder eine Integritätsgarantie benötigt
  werden;
- Synchronisierung oder ein minimierter Agentenvertrag beschlossen wird.

## Verwandte Dokumente

- [`ADR 0004`](0004-private-demo-separation.md)
- [`ADR 0013`](0013-lichtwald-log-local-contract.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
