# ADR 0010: Getrennte LearningArtifacts für Notizen und Zusammenfassungen

## Status

Angenommen – 2026-07-19

## Kontext

Der LearningHub-Inhaltsvertrag nach Schema 2 beschreibt ausschließlich die
Hierarchie aus LearningModule, LearningChapter und LearningNode. Der getrennte
LearningProgress-Vertrag nach Schema 1 hält Kapitelzustandswechsel als
append-only Ereignislog fest. Notizen und Zusammenfassungen besitzen einen
anderen Lebenszyklus als beide bestehenden Domänen: Sie beziehen sich auf einen
LearningNode, werden als aktuelle Arbeitsstände bearbeitet und sollen weder den
Inhaltsvertrag erweitern noch als Fortschrittsereignisse missverstanden werden.

Eine Ablage direkt am LearningNode würde private nutzerverfasste Texte mit der
allgemeinen Inhaltsstruktur koppeln. Eine Ablage im Progress-Log würde dessen
append-only Semantik verletzen und Änderungen an einem Arbeitstext als
Fortschrittsereignisse modellieren. Außerdem darf ein Artefakt keine Kopie der
vollständigen Modul-, Kapitel- oder LearningNode-Inhalte enthalten, weil solche
Duplikate auseinanderlaufen und unnötig private Inhalte vervielfältigen würden.

Für den nächsten Teil von `v0.2.1` wird deshalb eine eigenständige lokale
Foundation benötigt. Sie umfasst Vertrag, Service und Storage, aber noch keine
Anbindung an `LearningHubController`, `LearningHubView` oder `src/main.js`.

## Entscheidung

### Getrennter Vertrag und Persistenznamespace

LearningArtifacts verwenden einen eigenen Vertrag mit `schemaVersion: 1` und
den festen Storage-Key:

```text
goldendawn.learningHub.artifacts.v1
```

Das `v1` im Key versioniert den Persistenz-Namespace. Die identische Zahl im
gespeicherten Vertrag ist davon unabhängig. Inhalt, Fortschritt und Artefakte
bleiben damit drei getrennte Domänen:

| Belang | Vertrag | Storage-Key |
| --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` |
| Kapitelzustandswechsel | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` |
| Notizen und Zusammenfassungen | LearningArtifact `schemaVersion: 1` | `goldendawn.learningHub.artifacts.v1` |

Ein Artifact-Store enthält `dataOrigin` sowie ein `artifacts`-Array. Jedes
Artefakt besitzt eine global eindeutige `id`, den Typ `note` oder `summary`, die
stabilen Referenzen `moduleId`, `chapterId` und `learningNodeId`, den privaten
`content` sowie `createdAt` und `updatedAt` als kanonische UTC-Zeitstempel.
Titel und Inhalte der referenzierten Modul-, Kapitel- und LearningNode-Objekte
werden nicht kopiert.

Die Kombination aus `learningNodeId` und `type` ist im vollständigen Store
eindeutig. Pro LearningNode existiert daher höchstens eine aktuelle Notiz und
höchstens eine aktuelle Zusammenfassung. Beide Typen dürfen gleichzeitig für
denselben LearningNode vorhanden sein.

### Aktueller editierbarer Zustand

LearningArtifacts sind veränderbare aktuelle Arbeitsstände. Sie bilden kein
append-only Ereignisprotokoll und erhalten in Schema 1 keine Versionshistorie.
Beim ersten Speichern werden eine stabile Artefakt-ID und ein einmal erzeugter
Zeitstempel für `createdAt` und `updatedAt` vergeben. Eine Aktualisierung erhält
`id` und `createdAt`, ersetzt den Text und setzt ausschließlich `updatedAt` neu.
Der neue Zeitpunkt darf nicht vor dem bisherigen `updatedAt` liegen.

Inhaltlich identische Eingaben sind schreibfreie No-ops. Das Leeren erfolgt nur
über die typbezogenen Clear-Operationen und entfernt exakt das referenzierte
Artefakt; der jeweils andere Typ am selben LearningNode bleibt erhalten. No-ops
erzeugen weder IDs noch Zeitstempel.

Append-only bleibt ausschließlich eine Anwendungsregel des
`LearningProgressService`. Die Entscheidung für editierbare Artefakte ändert
weder den Schema-2-Inhaltsvertrag noch den Schema-1-Progress-Vertrag und dessen
Ereignisreihenfolge.

### Datenfluss und Referenzprüfung

Die implementierte Foundation verwendet diesen lokalen Datenfluss:

```text
LearningArtifactService
  ├→ LearningHubService
  │   → LearningHubStorage
  │   → StorageAdapter
  │
  └→ LearningArtifactStorage
      → StorageAdapter
      → localStorage
```

`LearningArtifactService` verwendet `LearningHubService` zum Laden des
aktuellen validen privaten Hubs und zur Prüfung der vollständigen Referenzkette
LearningModule → LearningChapter → LearningNode. Eine global vorhandene ID wird
nicht akzeptiert, wenn ihre angegebene Elternkette falsch ist. Vor einer
Mutation werden außerdem alle vorhandenen Artefaktreferenzen gegen den aktuellen
Hub geprüft. Ungültige oder verwaiste Daten werden weder repariert noch
überschrieben.

`LearningHubService` besitzt keine Rückabhängigkeit auf den
`LearningArtifactService`; eine gegenseitige oder zirkuläre Service-Abhängigkeit
ist ausgeschlossen. Die öffentlichen Artefaktoperationen lauten
`loadArtifacts`, `saveNote`, `saveSummary`, `clearNote` und `clearSummary`.
Jede echte Mutation erzeugt immutable einen vollständig validierten neuen Store
und speichert genau einmal.

### Validierung, lokale Speicherung und Datenschutz

IDs und Referenz-IDs müssen nicht leer und bereits getrimmt sein. Artefakttext
wird in der Anwendungsschicht vor Leer- und Längenprüfung getrimmt; der
persistierte Text ist nicht leer, bereits getrimmt und höchstens 10.000 Zeichen
lang. `createdAt` und `updatedAt` verwenden exakt das Format
`YYYY-MM-DDTHH:mm:ss.sssZ`; `updatedAt` darf nicht vor `createdAt` liegen. Die
aufgeführten Root- und Artefaktfelder sind eigene Pflichtfelder; unbekannte
eigene Felder werden abgelehnt. Die reine Vertragsvalidierung sammelt alle
strukturell auffindbaren Fehler als stabile `{ code, path, message }`-Einträge
und verändert ihre Eingabe nicht.

`LearningArtifactStorage` verwendet ausschließlich den gemeinsamen
`StorageAdapter`. Fehlt der feste Key, liefert ein Lesevorgang ohne
Initialisierungsschreibzugriff einen frischen privaten Store mit leerem
`artifacts`-Array. Der private Speicherpfad akzeptiert nur
`dataOrigin: private`. Synthetische, beschädigte und nicht unterstützte Werte
bleiben unangetastet. Lese- und Schreibwerte werden defensiv geklont, der
vollständige Store wird vor jedem Schreiben validiert und Storage- sowie
Quota-Fehler werden kontrolliert behandelt. Vor dem eigentlichen Schreiben
liest der Storage den festen Key erneut; ein vorhandener synthetischer,
beschädigter, nicht unterstützter oder nicht sicher lesbarer Bestand blockiert
den Save. Dieser Read-Preflight ist keine Transaktion und verhindert keine
Multi-Tab-Rennen.

`dataOrigin` ist nur eine fachliche Klassifikation. `localStorage` ist
unverschlüsselt, für JavaScript derselben Origin grundsätzlich zugänglich und
weder Cloud-Sicherung noch geräteübergreifende Synchronisierung. Browserdaten
können gelöscht werden; Browser-Quota und Multi-Tab-Rennen bleiben offene
Grenzen. Die Grenze von 10.000 Zeichen schützt nur ein einzelnes Artefakt und
ersetzt keine Gesamtgrößenbegrenzung des Stores.

Fehler und Konsolenausgaben dürfen keine privaten Texte, IDs, Referenzketten,
Rohwerte oder Zeitstempel enthalten. Eine spätere UI muss Artefakttexte über
`textContent` oder gleichwertige sichere DOM-Erzeugung ausgeben.

### Bewusster Umfang der Foundation

Diese Entscheidung führt keine UI, Formulare, Controller- oder
`src/main.js`-Anbindung ein. Ebenfalls nicht enthalten sind
Artefaktversionierung, automatische oder KI-gestützte Zusammenfassungen,
Import/Export, Migration, Cloud-Sicherung, Synchronisierung, Backend,
Authentifizierung, TestAgent-Logik und Lösch- oder Archivierungsregeln für die
referenzierten LearningHub-Inhalte. `v0.2.1` bleibt daher in Arbeit.

## Konsequenzen

Positive Auswirkungen:

- Inhalt, Fortschritt und private Lernartefakte können unabhängig validiert,
  gespeichert und später weiterentwickelt werden;
- höchstens ein aktueller Arbeitsstand je LearningNode und Artefakttyp verhindert
  fachliche Duplikate;
- stabile Referenz-IDs vermeiden Kopien privater Quellinhalte;
- No-ops vermeiden unnötige IDs, Zeitstempel und Schreibzugriffe;
- die einseitige Abhängigkeit vom Artefaktservice zum Inhaltsservice hält die
  Servicegrenze frei von Zyklen;
- injizierbare ID- und Zeitgeneratoren sowie getrennte Storage-Grenzen machen
  die Foundation deterministisch testbar.

Kosten und Einschränkungen:

- jede Mutation lädt und validiert Hub und vollständigen Artifact-Store;
- Bearbeitungen überschreiben den aktuellen Artefakttext ohne Historie;
- verwaiste Referenzen blockieren Mutationen, bis eine gesonderte Inhalts- und
  Löschrichtlinie beschlossen ist;
- lokale Browserpersistenz bietet keine Verschlüsselung, Transaktion,
  Gesamtgrößengarantie oder tabübergreifende Konsistenz;
- ohne Controller- und UI-Anbindung ist die Foundation noch nicht direkt
  bedienbar.

## Erwogene Alternativen

### Notiz und Zusammenfassung direkt am LearningNode speichern

Diese Variante würde private Arbeitstexte in Schema 2 aufnehmen, Inhalt und
Artefaktlebenszyklus koppeln und jede Artefaktänderung zu einer Änderung des
LearningHub-Inhaltsvertrags machen.

### Artefakte als Progress-Ereignisse modellieren

Notizen und Zusammenfassungen sind editierbare Inhalte und keine
Kapitelzustandswechsel. Ihre Aktualisierung oder Löschung passt nicht zur
append-only Semantik des Progress-Logs.

### Mehrere aktuelle Artefakte desselben Typs zulassen

Mehrere Notizen oder Zusammenfassungen pro LearningNode würden eine zusätzliche
Auswahl-, Sortier- und Löschsemantik benötigen. Für den lokalen MVP genügt je
Typ genau ein aktueller Arbeitsstand.

### Von Beginn an eine Versionshistorie führen

Eine unveränderliche Historie würde zusätzliche Verträge, Speicherwachstum und
Wiederherstellungsregeln erfordern. Sie wird nicht vorweggenommen, solange der
aktuelle editierbare Stand den bekannten Anwendungsfall erfüllt.

### Synthetische Artefakte automatisch in den privaten Store importieren

Automatisches Seeding würde Demo- und Privatdaten vermischen und bereits beim
ersten Laden schreiben. Der private Initialzustand bleibt stattdessen leer.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- eine Artefaktversionshistorie oder Wiederherstellung benötigt wird;
- Module, Kapitel oder LearningNodes archiviert oder dauerhaft gelöscht werden;
- mehrere Artefakte desselben Typs pro LearningNode benötigt werden;
- Import/Export, Multi-Tab-Koordination oder geräteübergreifende
  Synchronisierung eingeführt wird;
- Datenmenge oder Schreibfrequenz eine andere lokale Speichertechnik erfordert;
- Authentifizierung, ein Backend oder verschlüsselte Ablage eingeführt werden;
- eine neue Vertragsversion eine dokumentierte Migration benötigt.

## Verwandte Dokumente

- [`ADR 0004`](0004-private-demo-separation.md)
- [`ADR 0007`](0007-user-configured-learning-modules.md)
- [`ADR 0008`](0008-learning-hub-local-content-persistence.md)
- [`ADR 0009`](0009-append-only-learning-progress-events.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
