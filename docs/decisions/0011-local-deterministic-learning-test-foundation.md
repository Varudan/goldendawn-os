# ADR 0011: Lokale deterministische LearningTest-Foundation

## Status

Angenommen – 2026-07-19

## Kontext

Der LearningHub-Inhaltsvertrag nach Schema 2 hält Module, Kapitel und
LearningNodes. [ADR 0009](0009-append-only-learning-progress-events.md) trennt
davon Kapitelzustandswechsel und abgeleiteten Modulfortschritt;
[ADR 0010](0010-learning-artifacts-for-notes-and-summaries.md) führt für
Notizen und Zusammenfassungen einen weiteren editierbaren Vertrag ein.
Testfragen, laufende Tests und abgeschlossene Testversuche besitzen wiederum
andere Lebenszyklen und dürfen weder den Inhaltsvertrag noch Progress oder
LearningArtifacts erweitern.

Für den verbleibenden lokalen Mock-Test von `v0.2.1` wird eine testbare
Foundation ohne UI, KI oder `TestAgent` benötigt. Nutzer sollen eindeutige
Single-Choice-Fragen selbst konfigurieren und stabil mit vorhandenen
LearningNodes verknüpfen können. Ein Modultest muss bei unveränderten Eingaben
dieselbe nachvollziehbare Reihenfolge verwenden. Abgeschlossene Versuche sollen
historisch erhalten bleiben, während ein noch laufender Test keinen
dauerhaften, möglicherweise veralteten Zwischenstand erzeugen soll.

„LearningTest“ ist der fachliche Begriff. „Lokaler Mock-Test“ kennzeichnet nur
den lokalen, deterministischen Ablauf von `v0.2.1`; er behauptet keine KI- oder
Agentenfunktion.

## Entscheidung

### Getrennter Datenfluss ohne UI-Anbindung

Die Foundation verwendet diesen lokalen Datenfluss:

```text
LearningHubView / LearningHubController        noch nicht angebunden
                    ↓
LearningTestService
  ├→ LearningHubService                        Referenzprüfung
  ├→ LearningTestBankStorage
  │    → StorageAdapter
  │    → localStorage
  ├→ LearningTestAttemptStorage
  │    → StorageAdapter
  │    → localStorage
  └→ LearningTestEngine                        reine Deterministik
```

`LearningTestService` hängt einseitig vom `LearningHubService` ab, um vor jeder
Operation den aktuellen validen Hub zu laden und vollständige Modul-, Kapitel-
und LearningNode-Referenzketten zu prüfen. Der Inhaltsservice kennt die
Testschichten nicht. Contract, Engine, fachliche Storages und Service greifen
nicht direkt auf `localStorage` zu; eine zyklische Abhängigkeit wird nicht
eingeführt.

`LearningHubView`, `LearningHubController` und `src/main.js` werden in diesem
Arbeitspaket nicht angebunden. Die Foundation ist deshalb noch kein sichtbarer
„Lokaler Mock-Test“, und `v0.2.1` bleibt in Arbeit.

Die reine `LearningTestEngine` präzisiert und ersetzt für diese Foundation die
frühere Planung eines `MockLearningTestProvider` als Platzhalter unter dem
Service. Der Provider hätte einen vorbereiteten festen Fragenbestand und die
deterministische Auswahl in einer Rolle vermischt. Nun ist die
nutzergesteuerte `LearningTestBank` die klar validierte Fragenquelle, während
die Engine ausschließlich Auswahl, öffentliche Projektion und Auswertung ohne
Seiteneffekte übernimmt. Diese Präzisierung führt weder eine UI-Anbindung noch
Agentenlogik ein; der sichtbare Produktbegriff bleibt später „Lokaler
Mock-Test“.

### Nutzerkonfigurierte, veränderbare Single-Choice-Testbank

Fragen werden in einer eigenständigen `LearningTestBank` mit
`schemaVersion: 1` gespeichert. Schema 1 unterstützt ausschließlich den Typ
`singleChoice`. Jede Frage verweist über `moduleId`, `chapterId` und
`learningNodeId` auf die vollständige aktuelle Elternkette und besitzt zwei bis
sechs geordnete Optionen, genau eine korrekte Option, eine Schwierigkeitsstufe,
eine Position, eine Revision und kanonische UTC-Zeitstempel.

Die Testbank ist ein veränderbarer aktueller Fragenbestand. Erstellen hängt eine
Frage an die nächste freie Geschwisterposition des LearningNodes an.
Aktualisieren erhält Frage-ID, `createdAt` und Position und erhöht `revision`
nur bei einer tatsächlichen normalisierten Änderung. Unveränderte Eingaben
sind schreibfreie No-ops. Bleiben Optionsinhalt und -reihenfolge gleich,
bleiben auch die Options-IDs erhalten; andernfalls wird der vollständige
Optionssatz mit neuen stabilen IDs erzeugt. Löschen, Archivieren und Umsortieren
von Fragen sind nicht Teil von Schema 1 oder der Foundation.

Der private Persistenzpfad verwendet ausschließlich diesen festen Key:

```text
goldendawn.learningHub.testBank.v1
```

Das `v1` bezeichnet den Persistenz-Namespace; der gespeicherte Vertrag wird
unabhängig davon durch `schemaVersion: 1` versioniert.

### Deterministische Modulreihenfolge und reine Auswertung

Die reine `LearningTestEngine` bestimmt alle validen Fragen eines Moduls und
ordnet sie stabil nach Kapitelposition des aktuellen LearningHubs,
LearningNode-Position und Frageposition. Optionen werden ausschließlich nach
ihrer Position geordnet. Es gibt keine Zufallsauswahl und kein Shuffle;
`Math.random` wird nicht verwendet.

Die Engine verändert keine Eingabe und besitzt keinen Zugriff auf Uhr,
ID-Generator, Storage, Netzwerk oder DOM. Single-Choice-Antworten werden durch
strikte Gleichheit der Options-IDs ausgewertet. Der Prozentwert ist exakt
`Math.round(correctAnswerCount / totalQuestionCount * 100)`.

Vor der Abgabe enthält die öffentliche Testprojektion Prompt,
Schwierigkeitsstufe und Optionen, aber weder `correctOptionId` noch
`explanation`. Diese Projektion ist keine Geheimhaltungsgrenze gegenüber
anderem JavaScript derselben Origin; sie verhindert eine versehentliche
Weitergabe der Lösung an eine spätere View. Nach der Auswertung dürfen korrekte
Option und Erklärung als Feedback ausgegeben werden.

### Flüchtige In-Progress-Sessions

`startModuleTest` friert erst nach vollständiger Validierung einen privaten
Sessionsnapshot einschließlich Antwortschlüssel im Speicher des
`LearningTestService` ein. Die Session erhält eine stabile ID und einen
Startzeitpunkt, schreibt aber noch keinen Attempt. Sie verwendet weder
Zufallsauswahl noch einen vom Aufrufer gelieferten Lösungsschlüssel.

In-Progress-Sessions werden bewusst nicht persistiert. Nach einem Reload oder
dem Erzeugen einer neuen Serviceinstanz muss der Test neu begonnen werden. Die
spätere UI muss diese Grenze klar behandeln und darf keine Wiederaufnahme eines
nicht gespeicherten Zwischenstands versprechen.

`submitModuleTest` verlangt genau eine bekannte Antwort pro Sessionfrage und
bewertet ausschließlich den beim Start eingefrorenen privaten Snapshot.
Fehlende, doppelte, zusätzliche oder unbekannte Fragen und Optionen werden
ohne Attempt-Schreibzugriff abgelehnt. Die Session wird erst nach erfolgreichem
Anhängen entfernt; damit kann ein Speicherfehler kontrolliert wiederholt
werden. Nach erfolgreicher Persistenz verhindert der Service eine zweite
Speicherung derselben Session.

### Append-only abgeschlossene Attempts

Abgeschlossene Versuche verwenden einen getrennten
`LearningTestAttemptLog` mit `schemaVersion: 1`. Ein Attempt enthält die
Modulreferenz, Start- und Abschlusszeit, exakte Zähler und Prozentwert sowie die
Antworten in der autoritativen Testreihenfolge. Antworten speichern nur stabile
Frage-, Revisions-, LearningNode- und Options-IDs sowie `isCorrect`; Fragen-,
Options- und LearningNode-Texte werden nicht dupliziert.

Der feste Persistenz-Key lautet:

```text
goldendawn.learningHub.testAttempts.v1
```

`LearningTestAttemptStorage` bietet nur das Laden des Logs und das Anhängen
genau eines neuen Attempts an einen unveränderten gültigen Präfix. Es gibt
keinen allgemeinen öffentlichen Überschreib-, Änderungs-, Lösch-, Sortier-
oder Kompaktionspfad für historische Attempts. Die Arrayreihenfolge ist
autoritativ; Zeitstempel werden nicht zum Sortieren verwendet.

Append-only ist eine Service- und Storage-Regel. Technisch wird weiterhin ein
vollständiger JSON-Snapshot in `localStorage` geschrieben. Es gibt keine
kryptografische Verkettung, Signatur oder Manipulationssperre.

### Trennung von Inhalt, Progress, Artifacts und Testkompetenz

Die lokalen LearningHub-Belange bleiben unabhängig:

| Belang | Lebenszyklus |
| --- | --- |
| Module, Kapitel und LearningNodes | editierbarer Inhalt nach LearningHub-Schema 2 |
| Kapitelzustandswechsel und Modulfortschritt | append-only Progress-Ereignisse und abgeleitete Projektion |
| Notizen und Zusammenfassungen | editierbare aktuelle LearningArtifacts |
| Single-Choice-Fragen | veränderbare, versionierte LearningTestBank |
| abgeschlossene Testversuche | append-only LearningTestAttemptLog |
| laufender Test | flüchtige private Service-Session |
| Testkompetenz | nicht Bestandteil dieser Foundation |

Kapitelabschluss oder 100 Prozent Modulfortschritt sagen nichts über
Testkompetenz aus. Die Attempt-Foundation leitet keinen Kompetenzstand ab und
schreibt keine Progress-Ereignisse. Confidence, Hinweise, Freitext-Rubriken,
semantische Freitextbewertung und Testkompetenz sind mögliche spätere,
versionierte Erweiterungen. Schema 1 reserviert oder erfindet dafür keine
Felder.

### Persistenz- und Datenschutzgrenzen

Beide fachlichen Storages verwenden ausschließlich den gemeinsamen
`StorageAdapter`, validieren vollständige Werte und klonen Lese-, Schreib- und
Rückgabewerte defensiv. Ein fehlender Key liefert einen frischen privaten
Leerzustand ohne Initialisierungsschreibzugriff. Der private Produktionspfad
akzeptiert ausschließlich `dataOrigin: private`; synthetische, beschädigte
oder nicht unterstützte Bestände werden weder gelöscht noch überschrieben.
Vor jedem Save liest der jeweilige Storage seinen festen Key erneut und
blockiert den Schreibzugriff über einem nicht sicher verwendbaren Bestand.

Dieser Read-Preflight ist keine Transaktion. Zwischen Preflight und Save kann
sich der Wert ändern; TOCTOU- und Multi-Tab-Rennen, Browser-Quota und verlorene
Änderungen bleiben bekannte Grenzen. `localStorage` ist unverschlüsselt und für
JavaScript derselben Origin grundsätzlich lesbar. `dataOrigin` ist nur eine
fachliche Klassifikation und kein technischer Geheimschutz.

Private Fragen, Optionen, Erklärungen, Antworten und IDs gelangen nicht in
Repository-Demos oder Fehlermeldungen. Synthetische Beispiele werden
unabhängig erfunden und nicht automatisch in private Stores importiert. Die
Foundation führt keine Console-Ausgaben, Telemetrie, Netzwerk-, Webhook-,
Airtable-, Backend- oder KI-Aufrufe ein.

### Spätere Anbindung des TestAgent

Der spätere externe Zielpfad bleibt:

```text
LearningTestService
  → SyncService
  → SyncAgent
  → TestAgent
```

Der lokale deterministische Ablauf ist kein vorweggenommener `TestAgent`.
Semantische Freitextbewertung, automatische Fragengenerierung, begründetes
Agentenfeedback und externe Ergebnisspeicherung beginnen frühestens in
`v0.5.0` und benötigen ihre dokumentierten, versionierten Sync- und
Agentenverträge. Die heutige Trennung von Engine, Service und Datenverträgen
ermöglicht eine spätere Provider- oder Adaptergrenze, ohne den `TestAgent`
bereits in das Frontend einzubauen.

## Konsequenzen

Positive Auswirkungen:

- dieselben validen Inhalte und Fragen erzeugen eine reproduzierbare
  Modulreihenfolge und exakte lokale Auswertung;
- Lösungen bleiben bis zur Abgabe aus der öffentlichen Projektion entfernt;
- veränderbare Fragen und unveränderliche Versuchshistorie können unabhängig
  versioniert und gespeichert werden;
- der eingefrorene Sessionsnapshot verhindert, dass eine parallele
  Fragenänderung einen bereits gestarteten Test rückwirkend verändert;
- vollständige Referenzprüfung verhindert unbemerkte Verschiebungen zwischen
  LearningNodes und kontrolliert verwaiste Daten;
- getrennte Verträge halten Fortschritt, Lerntexte, Testergebnisse und spätere
  Kompetenzmodelle auseinander;
- injizierbare ID-Generatoren und Uhr sowie eine reine Engine ermöglichen
  deterministische Tests.

Kosten und Einschränkungen:

- jede Serviceoperation lädt und validiert den aktuellen Hub und die jeweils
  benötigten vollständigen lokalen Stores;
- laufende Tests gehen bei Reload verloren;
- beide JSON-Stores können ohne Kompaktion wachsen und unterliegen der
  Browser-Quota;
- `localStorage` bietet keine Verschlüsselung, Transaktion, kryptografische
  Integrität oder garantierte tabübergreifende Konsistenz;
- ohne Controller- und View-Anbindung ist der lokale Mock-Test noch nicht
  bedienbar und `v0.2.1` bleibt in Arbeit.

## Erwogene Alternativen

### Vorbereitete feste Fragen in einem MockLearningTestProvider

Ein ausschließlich fester Fragenkatalog wäre einfach, erfüllte aber nicht den
aktuellen Anwendungsfall nutzerkonfigurierter und mit privaten LearningNodes
verknüpfter Fragen. Die veränderbare Testbank übernimmt deshalb die lokale
Fragenquelle; die reine Engine bleibt von ihrer Persistenz getrennt.

### Zufällige Auswahl oder Shuffle

Zufall würde Reproduzierbarkeit, Fehlersuche und nachvollziehbare lokale Tests
erschweren. Schema 1 verwendet stattdessen ausschließlich stabile
Strukturpositionen.

### Fragen und Attempts im LearningHub-Inhaltsvertrag speichern

Ein gemeinsamer Vertrag würde Inhaltsbearbeitung, Fragenrevisionen und
Versuchshistorie koppeln. Getrennte Verträge und Keys erhalten die
unterschiedlichen Lebenszyklen.

### Laufende Sessions in localStorage persistieren

Persistierte Zwischenstände benötigten einen weiteren Vertrag, Regeln für
Fragenänderungen, Ablauf und Wiederaufnahme sowie zusätzliche private
Antwortdaten. Für den lokalen MVP wird ein Test nach Reload bewusst neu
gestartet.

### Historische Attempts aktualisierbar machen

Ein allgemeiner Save-Pfad könnte frühere Ergebnisse unbemerkt ändern,
entfernen oder umsortieren. Der Storage erlaubt deshalb nur einen
präfixerhaltenden Append.

### Confidence, Hinweise oder Kompetenzfelder vorab reservieren

Unbestimmte optionale Felder würden Semantik ohne aktuellen Anwendungsfall
festschreiben. Solche Fähigkeiten benötigen bei Bedarf eine neue
Vertragsversion statt leerer Platzhalter in Schema 1.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- Multiple Choice, Freitext, Hinweise, Confidence oder ein Kompetenzmodell
  eingeführt werden;
- Fragen gelöscht, archiviert, umsortiert oder zwischen LearningNodes
  verschoben werden sollen;
- laufende Sessions Reloads überstehen müssen;
- Attempt-Historien gelöscht, exportiert, synchronisiert oder kompaktiert
  werden sollen;
- Multi-Tab-Koordination, Transaktionen, kryptografische Integrität oder eine
  andere lokale Speichertechnik benötigt werden;
- `TestAgent` oder externe Ergebnisspeicherung angebunden werden;
- eine neue Vertragsversion eine dokumentierte Migration benötigt.

## Verwandte Dokumente

- [`ADR 0004`](0004-private-demo-separation.md)
- [`ADR 0007`](0007-user-configured-learning-modules.md)
- [`ADR 0008`](0008-learning-hub-local-content-persistence.md)
- [`ADR 0009`](0009-append-only-learning-progress-events.md)
- [`ADR 0010`](0010-learning-artifacts-for-notes-and-summaries.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
