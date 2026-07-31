# GoldenDawn OS – Daten- und Sync-Verträge

## Dokumentstatus

| Feld | Wert |
| --- | --- |
| Projektphase | `v0.2.2 – LichtwaldLog Local MVP in Arbeit` |
| Vertragsversion | `1.0` |
| PromptVault-Speicherschema | `2` |
| LearningHub-Schema | `2` |
| LearningHub-Persistenznamespace | `v1` |
| LearningProgress-Schema | `1` |
| LearningProgress-Persistenznamespace | `v1` |
| LearningArtifact-Schema | `1` |
| LearningArtifact-Persistenznamespace | `v1` |
| LearningTestBank-Schema | `1` |
| LearningTestBank-Persistenznamespace | `v1` |
| LearningTestAttemptLog-Schema | `1` |
| LearningTestAttempt-Persistenznamespace | `v1` |
| LichtwaldLog-Schema | `1` |
| LichtwaldLog-Persistenznamespace | `v1` |
| LichtwaldLog-Snapshotlimit | 500.000 UTF-16-Codeeinheiten |
| Agenten-Scope | SyncAgent, DataAgent und TestAgent |
| Status | LearningHub Local MVP veröffentlicht; LichtwaldLog Contract-, private Storage-, Service-, Controller- sowie isolierte View- und CSS-Foundation implementiert; Sync-Vertrag bleibt Zielzustand |
| Letzte Aktualisierung | 2026-07-31 |

Dieses Dokument definiert die implementierten lokalen Speicherverträge für
PromptVault, LearningHub-Inhalte, LearningHub-Fortschritt, LearningArtifacts,
die lokale LearningTestBank und abgeschlossene LearningTestAttempts. Es
dokumentiert außerdem den implementierten LichtwaldLog-Schema-1-Vertrag, seine
begrenzte private Full-Snapshot-Persistenz und die darauf aufbauenden lokalen
Service-, Controller- sowie isolierte View- und CSS-Foundation sowie die
maschinenlesbare Sprache zwischen dem GoldenDawn-OS-Frontend, dem SyncAgent,
dem DataAgent und dem TestAgent. Es konkretisiert die Grenzen aus `AGENTS.md`,
`docs/architecture.md` und `docs/security.md`.

Der lokale PromptVault-Vertrag gilt für den abgeschlossenen Stand von `v0.2.0`.
In `v0.2.1` sind die LearningHub-Schema-2-Foundation, die lokale
Inhaltspersistenz sowie Controller und Inhaltsoberfläche implementiert. Der
separate Schema-1-Fortschrittsvertrag, seine Projektion, sein Service und seine
lokale Persistenz sind ebenfalls implementiert und über den vorhandenen
Controller und die View bedienbar. Die UI-Integration verändert keinen der
beiden Verträge. Zusätzlich sind der getrennte LearningArtifact-Schema-1-
Vertrag, sein privater lokaler Storage und sein referenzprüfender Service
implementiert und über den vorhandenen Controller sowie die View bedienbar.
Die UI-Integration verändert den LearningArtifact-Vertrag nicht. Zusätzlich
sind die getrennten Schema-1-Verträge für die veränderbare LearningTestBank und
den append-only LearningTestAttemptLog, ihre privaten Storages, die reine
deterministische Engine und der referenzprüfende LearningTestService
implementiert und über `src/main.js`, den vorhandenen
`LearningHubController` und die `LearningHubView` als lokaler
deterministischer Mock-Test bedienbar. Der LearningHub Local MVP ist vollständig
geprüft und veröffentlicht. Der annotierte Tag `v0.2.1` und das zugehörige
GitHub Release wurden am `2026-07-25` veröffentlicht; GoldenDawn OS ist
seitdem als öffentlich sichtbares Portfolio-Repository ohne Open-Source-Lizenz
verfügbar. Die externen Sync- und Agentenverträge beschreiben den geplanten
Zielzustand späterer Versionen.

Für `v0.2.2` sind der reine LichtwaldLog-Schema-1-Vertrag,
`validateLichtwaldLog`, die zugehörigen synthetischen Contract-Tests und die
private Storage-Foundation unter `goldendawn.lichtwaldLog.content.v1`
implementiert. Die darauf aufbauende Service-Foundation stellt den privaten
fachlichen Kern für Laden, Erstellen, vollständiges Bearbeiten, Löschen und
Fokusverwaltung bereit. Die Controller-Foundation koordiniert diesen Kern über
eine flüchtige, defensiv validierte UI-Projektion. Die isolierte View- und
CSS-Foundation stellt diese Projektion sicher dar, bleibt aber außerhalb der
`src/main.js`-Komposition. Navigation, der vollständig über die Anwendung
bedienbare UI-CRUD- und Fokusfluss, reale Browserintegration, Suche, Filter und
Demo-Integration folgen in getrennten Slices. Die lokalen Foundations führen
keine externe Aktion ein.

Solange eine externe Aktion noch nicht implementiert ist, muss sie in UI und
Dokumentation als geplant gekennzeichnet bleiben.

## Vertragsgrenzen der lokalen Module v0.2.1 und v0.2.2

Die lokalen Module `v0.2.1` und `v0.2.2` erweitern die externe
Aktions-Allowlist dieses Dokuments nicht. LearningHub-Inhalt,
LearningProgress, LearningArtifacts, LearningTestBank und
LearningTestAttemptLog sind rein interne Datenverträge und führen keine
externe Aktion ein. Der LichtwaldLog-Schema-1-Vertrag ist ebenfalls rein
intern. Seine implementierte private Persistenz verwendet den festen Namespace
`goldendawn.lichtwaldLog.content.v1`; das `v1` im Key und
`schemaVersion: 1` werden unabhängig versioniert. Die implementierten
LearningHub-Persistenzen verwenden die getrennten festen
Namespaces `goldendawn.learningHub.content.v1`,
`goldendawn.learningHub.progress.v1`,
`goldendawn.learningHub.artifacts.v1`,
`goldendawn.learningHub.testBank.v1` und
`goldendawn.learningHub.testAttempts.v1`. Das jeweilige `v1` im Key bezeichnet
keine Schemaversion: Der Inhaltsvertrag bleibt bei `schemaVersion: 2`; die vier
anderen lokalen Verträge verwenden unabhängig davon jeweils
`schemaVersion: 1`. Die nachfolgenden externen `learningTest.*`-Verträge
bleiben ausdrücklich ein Zielzustand für `v0.5.0` und sind nicht mit den
lokalen Serviceoperationen gleichzusetzen. Die internen `DataAgent`-Verträge
sind Zielzustände für `v0.4.0` und, im Lernfluss, `v0.5.0`.

### v0.2.1 – LearningHub Local MVP

Der implementierte vollständige Pfad für die lokale Inhaltsverwaltung bleibt
vollständig lokal:

```text
LearningHubView
  → LearningHubController
  → LearningHubService
  → LearningHubStorage
  → StorageAdapter
  → localStorage
```

Implementiert sind `LearningHubView`, `LearningHubController`,
`createLearningHubService` mit `loadHub`, `createModule`, `renameModule`,
`addChapter`, `renameChapter`, `addLearningNode` und `updateLearningNode`
sowie `createLearningHubStorage` mit `loadLearningHub` und
`saveLearningHub`. Modulauswahl, Accordion-Zustände, Node-Auswahl und
Formularzustände bleiben flüchtig im Controller beziehungsweise in der View
und werden nicht in den Inhaltsvertrag geschrieben.

Daneben ist die lokale Progress-Foundation über
`validateLearningProgress`, `projectLearningProgress`,
`createLearningProgressService` und `createLearningProgressStorage`
implementiert. `src/main.js` injiziert den Progress-Service in den bestehenden
`LearningHubController`; Kapitel-Checkboxen sowie sichtbare Modulzähler,
Prozentwerte und Fortschrittsbalken verwenden ausschließlich die validierte
Projektion. Es gibt keinen separaten Progress-Controller.

Die ebenfalls implementierte LearningArtifact-Foundation umfasst
`validateLearningArtifactStore`, `createLearningArtifactService` und
`createLearningArtifactStorage`. Sie speichert aktuelle private Notizen und
Zusammenfassungen getrennt von Inhalt und Fortschritt. Der Artifact-Service
prüft Referenzen über `LearningHubService`; der Inhaltsservice besitzt keine
Rückabhängigkeit. `src/main.js` injiziert ihn in den vorhandenen
`LearningHubController`; die `LearningHubView` macht aktuelle Notizen und
Zusammenfassungen lokal bedienbar. Es gibt keinen separaten
LearningArtifact-Controller.

Davon getrennt ist der lokale LearningTest-Pfad mit UI-Anbindung implementiert:

```text
LearningHubView
  → LearningHubController
      → LearningTestService
          ├→ LearningHubService                Referenzprüfung
          ├→ LearningTestBankStorage
          │    → StorageAdapter
          │    → localStorage
          ├→ LearningTestAttemptStorage
          │    → StorageAdapter
          │    → localStorage
          └→ LearningTestEngine                reine Deterministik
```

Die reine Engine präzisiert und ersetzt für diese Foundation die frühere
`MockLearningTestProvider`-Platzhalterplanung. Die nutzergesteuerte Testbank
ist die getrennte Fragenquelle; die Engine bleibt auf Auswahl, öffentliche
Projektion und Auswertung ohne Seiteneffekte begrenzt. Die UI-Anbindung führt
weder Agenten- noch externe Providerlogik ein.

Sie verwendet nutzerkonfigurierte Single-Choice-Fragen, arbeitet ohne Zufall
und speichert ausschließlich abgeschlossene Attempts. Laufende Sessions
bleiben flüchtig. Dieser lokale Ablauf verwendet weder `SyncAgent` noch
`TestAgent` und ist nicht mit den geplanten externen Aktionen
`learningTest.create`, `learningTest.evaluate` oder
`learningTest.result.get` gleichzusetzen. Die UI kennzeichnet ihn sichtbar als
„Lokaler Mock-Test“. `v0.2.1` ist vollständig geprüft und veröffentlicht. Von
`v0.2.2 – LichtwaldLog Local MVP` sind die nachfolgend dokumentierte Contract-
und private Storage-Foundation sowie die darauf aufbauenden Service- und
Controller-Foundations und die isolierte View- und CSS-Foundation
implementiert. `src/main.js`-Anbindung, Navigation, der vollständig über die
Anwendung bedienbare UI-CRUD- und Fokusfluss, reale Browserintegration, Suche,
Filter und Demo-Integration bleiben spätere Slices desselben rein lokalen
Meilensteins.

#### Interner LearningHub-Vertrag – Schema 2

Schema 2 beschreibt ausschließlich die Inhaltsstruktur:

```json
{
  "schemaVersion": 2,
  "dataOrigin": "synthetic",
  "modules": [
    {
      "id": "demo_module_garden",
      "title": "Erfundene Ideenwerkstatt",
      "position": 1,
      "chapters": [
        {
          "id": "demo_chapter_observations",
          "title": "Neutrale Beobachtungen",
          "position": 1,
          "learningNodes": [
            {
              "id": "demo_node_perspectives",
              "title": "Zwei Blickwinkel",
              "content": "Beschreibe eine erfundene Beobachtung aus zwei Perspektiven.",
              "position": 1
            }
          ]
        }
      ]
    }
  ]
}
```

Die verbindliche Hierarchie lautet **LearningHub → LearningModule →
LearningChapter → LearningNode**. `schemaVersion` ist exakt `2`; Schema 1 und
unbekannte Versionen werden abgelehnt. `dataOrigin` erlaubt ausschließlich
`synthetic` oder `private`. `modules` ist ein Array, darf für einen neuen Hub
leer sein und unterstützt mehrere Module. Jedes persistierbare Modul besitzt
mindestens ein Kapitel. `learningNodes` ist ein Array und darf leer sein.

IDs, Titel und LearningNode-Inhalte sind nicht leer und bereits getrimmt. IDs
sind über Module, Kapitel und LearningNodes hinweg global eindeutig.
`position` ist eine positive Ganzzahl und unter Geschwistern eindeutig; gleiche
Positionen unter verschiedenen Eltern sind zulässig. Die Validierung
normalisiert oder verändert Eingaben nicht und sammelt Fehler stabil als
`{ code, path, message }`.

Alle Kapitel sind implizit trackbar; `isTrackable` wird nicht gespeichert.
Course, Unit, `parentId`, rekursive Strukturverweise, Knotentypen, Abschluss-
und Fortschrittsfelder, UI-Zustände und Aktionen, Testdaten, Zeitstempel und
Versionshistorien gehören nicht zu Schema 2. Kapitelabschluss und
Modulfortschritt verwenden den nachfolgend dokumentierten separaten
LearningProgress-Vertrag. Testkompetenz bleibt davon getrennt.

Der tief eingefrorene Demo-Hub enthält genau das Modul
`[Demo] KI-Grundlagen – vom Datensatz zum Transformer` mit drei Kapiteln und
vier LearningNodes in fester Reihenfolge. Seine Inhalte sind unabhängig
erfunden und tragen in der kanonischen Repository-Quelle
`dataOrigin: synthetic`; private Nutzerdaten tragen `dataOrigin: private` und
werden nie in diese Quelle übernommen. Die zugehörigen acht Artefakte und
sieben Fragen stammen aus derselben kanonischen Seed-Definition. Eine
Migration ist nicht erforderlich, weil keine LearningHub-Nutzerdaten nach
Schema 1 persistiert wurden.

Schema 2 bleibt ein reiner Inhaltsvertrag. Die lokale Persistenz speichert
genau diesen Vertrag, ergänzt ihn aber nicht um UI-, Fortschritts-, Notiz- oder
Testfelder. Diese getrennten Belange benötigen eigene Service-, Storage- und
Datenverträge.

#### Lokaler LearningHub-Inhaltsspeichervertrag

##### Storage-Key und Versionssemantik

LearningHub-Inhalte verwenden ausschließlich diesen festen, nicht
nutzergesteuerten Storage-Key:

```text
goldendawn.learningHub.content.v1
```

Das `v1` im Storage-Key bezeichnet den Persistenz-Namespace. Es ist weder die
Schemaversion des gespeicherten Hubs noch ein Hinweis auf eine Schema-1-
Migration. Der gespeicherte Wert ist unmittelbar ein LearningHub mit
`schemaVersion: 2`; ein zusätzlicher Storage-Envelope oder eine zweite
Serialisierungslogik wird nicht eingeführt.

Der Key enthält ausschließlich LearningHub-Inhalte. Kapitelabschluss und
Fortschritt gehören in den getrennten Vertrag unter
`goldendawn.learningHub.progress.v1`. Notizen und Zusammenfassungen gehören in
den nachfolgend dokumentierten LearningArtifact-Vertrag unter
`goldendawn.learningHub.artifacts.v1`. Fragen und abgeschlossene Testversuche
gehören in keinen dieser Werte; sie verwenden die getrennten Verträge unter
`goldendawn.learningHub.testBank.v1` und
`goldendawn.learningHub.testAttempts.v1`.

`dataOrigin` klassifiziert die Herkunft als `synthetic` oder `private`. Das Feld
ist keine Verschlüsselungs-, Authentifizierungs- oder Sicherheitsfunktion.

##### Initialzustand und Demo-Trennung

Fehlt der Storage-Key, liefert das Laden im Arbeitsspeicher einen neuen leeren
privaten Hub:

```json
{
  "schemaVersion": 2,
  "dataOrigin": "private",
  "modules": []
}
```

Dieser reine Lesevorgang schreibt nichts. Erst eine erfolgreiche fachliche
Mutation persistiert den vollständigen neuen Hub. Zusätzlich darf der in
ADR 0012 definierte vorgelagerte Erststartkoordinator den kanonischen
synthetischen Demo-Datensatz genau einmal als private, lokal editierbare
Arbeitskopie speichern. Diese Ausnahme gehört nicht zu `loadLearningHub()` und
verändert dessen schreibfreies Verhalten nicht.

Der Erststart gilt nur dann als vollständig uninitialisiert, wenn alle vier
Keys fehlen:

```text
goldendawn.learningHub.content.v1
goldendawn.learningHub.artifacts.v1
goldendawn.learningHub.testBank.v1
goldendawn.learningHub.demoInitialization.v1
```

Jeder vorhandene Fachstore verhindert das Seeding, auch wenn sein Vertragswert
leer oder technisch nicht auswertbar ist. Der Koordinator ergänzt,
normalisiert oder überschreibt einen solchen Wert nicht. Er validiert Hub,
Artifact-Store und Testbank vollständig vor dem ersten Write, prüft ihre
Referenzketten und schreibt danach sequenziell über die bestehenden
Fachstorages. Progress und Attempts gehören nicht zum Seed.

Der Marker wird als letzter Wert geschrieben und besitzt bei neuen Writes
exakt diese Form:

```json
{
  "schemaVersion": 1,
  "initializationCompleted": true,
  "decision": "seeded"
}
```

`decision` ist `seeded` oder `skippedExistingData`. Bereits die Existenz des
Marker-Keys gilt als abgeschlossene Entscheidung; sein Inhalt wird nicht zur
Freigabe eines erneuten Seeds herangezogen. Wiederholte Aufrufe schreiben
nichts, lokale Bearbeitungen bleiben erhalten und ein später gelöschtes Demo
kehrt bei erhaltenem Marker nicht zurück. Nur das vollständige Löschen aller
lokalen Anwendungsdaten einschließlich Marker ermöglicht einen neuen
Erststart.

Scheitert ein Fach- oder Marker-Write, gleicht der Koordinator jeden
möglicherweise angelegten Fachwert mit dem vorbereiteten serialisierten Seed
ab. Nur ein weiterhin bytegleicher Seed-Wert darf in umgekehrter Reihenfolge
entfernt werden; fremde oder zwischenzeitlich geänderte Werte bleiben
unangetastet. Dies ist eine defensive Rollback-Strategie, aber keine
Multi-Key-Transaktion oder Multi-Tab-Sperre.

Fehlende Daten sind ausdrücklich von ungültigem JSON, ungültigen Schema-Daten,
einer falschen Datenherkunft und Adapterfehlern zu unterscheiden. Beschädigte
oder ungültige gespeicherte Daten werden nicht automatisch gelöscht,
überschrieben oder durch den leeren privaten Initialzustand ersetzt. Es wird
keine Migration für nicht vorhandene Schema-1-Nutzerdaten erfunden.

##### LearningHubStorage

`createLearningHubStorage` erhält den gemeinsamen `StorageAdapter` per
Dependency Injection und stellt ausschließlich `loadLearningHub` und
`saveLearningHub` bereit. Beide Operationen verwenden nur den festen
LearningHub-Key.

Geladene und zu speichernde Werte werden vollständig mit
`validateLearningHub` validiert. Der private Persistenzpfad verlangt zusätzlich
`dataOrigin: 'private'`. Der Storage unterscheidet einen fehlenden Key von
beschädigten oder ungültigen Daten und von technischen Lese-, Schreib-,
Verfügbarkeits- und Quota-Fehlern. Technische Fehler werden in stabile lokale
Fehlerergebnisse übersetzt; rohe `DOMException`- oder Storage-Objekte und
private Titel oder LearningNode-Texte werden nicht an höhere Schichten oder
Logs weitergereicht.

Die JSON-Serialisierung verbleibt beim gemeinsamen `StorageAdapter`.
`LearningHubStorage` erzeugt keine zweite Serialisierungslogik und führt bei
Fehlern weder automatische Löschungen noch Reparaturwrites aus.

##### LearningHubService und Mutationen

`createLearningHubService` verwendet den Storage als persistente Quelle und
stellt diese öffentlichen Operationen bereit:

| Operation | Fachliche Wirkung |
| --- | --- |
| `loadHub()` | aktuellen privaten Hub laden oder bei fehlendem Key den unpersistierten leeren Initialzustand liefern |
| `createModule({ title, firstChapterTitle })` | Modul und erstes Kapitel atomar am Ende der jeweiligen Listen anlegen |
| `renameModule({ moduleId, title })` | Modultitel ändern und Identität, Position sowie Kapitel erhalten |
| `addChapter({ moduleId, title })` | Kapitel im angegebenen Modul ergänzen |
| `renameChapter({ moduleId, chapterId, title })` | Kapiteltitel ändern und Identität, Position sowie LearningNodes erhalten |
| `addLearningNode({ moduleId, chapterId, title, content })` | Textkarte im angegebenen Kapitel ergänzen |
| `updateLearningNode({ moduleId, chapterId, learningNodeId, title, content })` | Titel und Inhalt einer Textkarte ändern; Identität und Position erhalten |

Jede Mutation folgt derselben Reihenfolge:

1. aktuellen Hub laden;
2. Zielzuordnung und Eingaben prüfen;
3. einen neuen Zustand ohne Mutation des geladenen Hubs oder des
   Eingabeobjekts erzeugen;
4. den vollständigen neuen Hub mit `validateLearningHub` validieren;
5. genau einmal über `saveLearningHub` speichern;
6. nur nach erfolgreicher Speicherung den aktualisierten Zustand zurückgeben.

Eingabetexte werden vor der fachlichen Prüfung und damit vor der Längenprüfung
an den Rändern getrimmt. Der `LearningHubService` begrenzt alle Modul-, Kapitel-
und LearningNode-Titel auf maximal 120 Zeichen sowie LearningNode-Inhalte auf
maximal 10.000 Zeichen. Leere Titel und leere LearningNode-Inhalte werden vor
jedem Schreibzugriff abgelehnt. Nicht gefundene oder falsch zugeordnete Modul-,
Kapitel- und LearningNode-IDs erzeugen kontrollierte Fehler und keinen
Schreibzugriff.

Diese Werte sind Eingabegrenzen der Anwendungsschicht. Der persistierte
Inhaltsvertrag bleibt unverändert bei `schemaVersion: 2`; es wird weder ein
neues Vertragsfeld noch eine Schema-3-Erweiterung eingeführt. Die Grenzen
reduzieren versehentlich übergroße einzelne Eingaben, ersetzen aber weder die
kontrollierte Quota-Behandlung noch eine allgemeine Größenbegrenzung des
vollständigen LearningHubs.

Neue IDs werden ausschließlich im Service über einen injizierbaren Generator
erzeugt. Sie müssen getrimmt, nicht leer und im gesamten Hub eindeutig sein;
Kollisionen oder fehlerhafte Generatoren werden mit einer begrenzten Zahl von
Versuchen behandelt. Bestehende IDs ändern sich bei Mutationen nicht. Neue
Positionen liegen hinter der höchsten vorhandenen Geschwisterposition und
werden nicht nur aus der Array-Länge abgeleitet.

`createModule` speichert Modul und erstes Kapitel atomar, sodass zu keinem
Zeitpunkt ein vertragswidriges Modul ohne Kapitel persistiert wird. Schlägt
Zielprüfung, Eingabevalidierung, ID-Erzeugung, vollständige Vertragsvalidierung
oder Speicherung fehl, wird kein teilweise veränderter Hub geschrieben.

Löschen, Archivieren, Umsortieren, Schema-Migrationen und garantierte
Multi-Tab-Synchronisierung oder Transaktionssperren gehören nicht zu diesem
Vertrag.

#### Lokale LearningTestBank – Schema 1

##### Trennung und Persistenznamespace

Die LearningTestBank speichert nutzerkonfigurierte Single-Choice-Fragen als
veränderbaren aktuellen Bestand. Sie erweitert weder den LearningHub-Inhalt
noch Progress, LearningArtifacts oder die abgeschlossene Versuchshistorie:

| Belang | Vertrag | Storage-Key | Lebenszyklus |
| --- | --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` | editierbarer Inhalt |
| Kapitelzustandswechsel und Modulfortschritt | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` | append-only Ereignisfolge |
| Notizen und Zusammenfassungen | LearningArtifact `schemaVersion: 1` | `goldendawn.learningHub.artifacts.v1` | editierbarer aktueller Stand |
| Single-Choice-Fragen | LearningTestBank `schemaVersion: 1` | `goldendawn.learningHub.testBank.v1` | veränderbarer aktueller Fragenbestand |
| abgeschlossene Testversuche | LearningTestAttemptLog `schemaVersion: 1` | `goldendawn.learningHub.testAttempts.v1` | append-only Attempts |

Die Zahlen in den Keys versionieren ausschließlich ihre Persistenz-Namespaces.
Der LearningTestBank-Vertrag wird unabhängig davon durch
`schemaVersion: 1` versioniert.

##### LearningTestBank: Struktur und Validierung

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "questions": [
    {
      "id": "question_synthetic_1",
      "moduleId": "module_synthetic_1",
      "chapterId": "chapter_synthetic_1",
      "learningNodeId": "node_synthetic_1",
      "type": "singleChoice",
      "prompt": "Welche erfundene Markierung zeigt nach Norden?",
      "difficulty": "easy",
      "position": 1,
      "revision": 1,
      "createdAt": "2026-07-19T10:00:00.000Z",
      "updatedAt": "2026-07-19T10:00:00.000Z",
      "options": [
        {
          "id": "option_synthetic_blue",
          "label": "Die blaue Raute",
          "position": 1
        },
        {
          "id": "option_synthetic_gold",
          "label": "Der goldene Kreis",
          "position": 2
        }
      ],
      "correctOptionId": "option_synthetic_blue",
      "explanation": "Im erfundenen Beispiel markiert die blaue Raute Norden."
    }
  ]
}
```

Root, Fragen und Optionen besitzen jeweils ausschließlich die dokumentierten
eigenen Pflichtfelder. Vertragsobjekte akzeptieren nur
`Object.prototype` oder `null` als direkten Prototyp. Arrays oder `null` sind
an Objektstellen ungültig. Zusätzliche, unbekannte oder geerbte Vertragsfelder
und benutzerdefinierte Prototypen werden kontrolliert abgelehnt.

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `questions` | Array | darf leer sein |
| `questions[].id` | String | nicht leer, bereits getrimmt und zusammen mit allen Option-IDs bankweit eindeutig |
| `questions[].moduleId` | String | nicht leer und bereits getrimmt |
| `questions[].chapterId` | String | nicht leer und bereits getrimmt |
| `questions[].learningNodeId` | String | nicht leer und bereits getrimmt |
| `questions[].type` | String | exakt `singleChoice` |
| `questions[].prompt` | String | nicht leer, bereits getrimmt und höchstens 500 Zeichen |
| `questions[].difficulty` | String | `easy`, `medium` oder `hard` |
| `questions[].position` | positive Ganzzahl | innerhalb desselben LearningNodes eindeutig |
| `questions[].revision` | positive Ganzzahl | steigt bei tatsächlichen Updates |
| `questions[].createdAt` | String | kanonischer UTC-Zeitstempel im exakten Format `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `questions[].updatedAt` | String | dasselbe kanonische UTC-Format und nicht vor `createdAt` |
| `questions[].options` | Array | zwei bis sechs Einträge |
| `questions[].options[].id` | String | nicht leer, bereits getrimmt und zusammen mit allen Frage- und Option-IDs bankweit eindeutig |
| `questions[].options[].label` | String | nicht leer, bereits getrimmt und höchstens 300 Zeichen |
| `questions[].options[].position` | positive Ganzzahl | innerhalb der Frage eindeutig |
| `questions[].correctOptionId` | String | nicht leer, bereits getrimmt und exakt die ID einer Option derselben Frage |
| `questions[].explanation` | String | bereits getrimmt, darf leer sein und umfasst höchstens 2.000 Zeichen |

Fragepositionen sind nur innerhalb desselben LearningNodes eindeutig; gleiche
Positionen an unterschiedlichen LearningNodes sind zulässig. Optionspositionen
sind nur innerhalb ihrer jeweiligen Frage eindeutig. Die Arrayreihenfolge ist
nicht die Testreihenfolge: Die Engine verwendet die dokumentierten
Strukturpositionen.

Der reine Validator sammelt alle strukturell auffindbaren Fehler vollständig
und stabil als `{ code, path, message }`. Meldungen enthalten keine privaten
Prompts, Optionslabel, Erklärungen, IDs oder sonstigen Rohwerte. Die Validierung
verändert oder normalisiert ihre Eingabe nicht. Ob die drei Referenz-IDs im
aktuellen LearningHub existieren und ihre vollständige Elternkette bilden,
prüft bewusst erst der `LearningTestService`.

Confidence, Hinweise, Freitext-Rubriken und Kompetenzstände gehören nicht zu
Schema 1. Sie sind ausschließlich mögliche spätere versionierte Erweiterungen;
dieser Vertrag reserviert oder erfindet keine Felder dafür.

Die stabilen Bank-Validatorcodes lauten:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningTestBank` | Root ist kein unterstütztes Vertragsobjekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidQuestions` | `questions` ist kein Array |
| `invalidQuestion` | Frage ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `unknownProperty` | ein unterstütztes Root-, Frage- oder Optionsobjekt enthält einen unbekannten eigenen Schlüssel |
| `missingProperty` | ein erforderliches eigenes Feld fehlt |
| `invalidId` | ID oder Referenz ist leer, ungetrimmt oder kein String |
| `duplicateId` | Frage- oder Option-ID ist bankweit nicht eindeutig |
| `invalidQuestionType` | Fragetyp ist nicht `singleChoice` |
| `invalidPrompt` | Prompt ist leer, ungetrimmt oder kein String |
| `promptTooLong` | Prompt überschreitet 500 Zeichen |
| `invalidDifficulty` | Schwierigkeit ist nicht `easy`, `medium` oder `hard` |
| `invalidPosition` | Frage- oder Optionsposition ist keine positive Ganzzahl |
| `duplicateQuestionPosition` | Frageposition ist im LearningNode nicht eindeutig |
| `invalidRevision` | Revision ist keine positive Ganzzahl |
| `invalidCreatedAt` | Erstellungszeitpunkt ist nicht kanonisch |
| `invalidUpdatedAt` | Änderungszeitpunkt ist nicht kanonisch |
| `updatedAtBeforeCreatedAt` | Änderungszeitpunkt liegt vor dem Erstellungszeitpunkt |
| `invalidOptions` | `options` ist kein Array |
| `invalidOptionCount` | Frage besitzt nicht zwei bis sechs Optionen |
| `invalidOption` | Option ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `duplicateOptionPosition` | Optionsposition ist in der Frage nicht eindeutig |
| `invalidOptionLabel` | Optionslabel ist leer, ungetrimmt oder kein String |
| `optionLabelTooLong` | Optionslabel überschreitet 300 Zeichen |
| `correctOptionNotFound` | `correctOptionId` gehört nicht zu einer Option derselben Frage |
| `invalidExplanation` | Erklärung ist ungetrimmt oder kein String |
| `explanationTooLong` | Erklärung überschreitet 2.000 Zeichen |

#### Lokaler LearningTestAttemptLog – Schema 1

##### Struktur abgeschlossener Testversuche

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "attempts": [
    {
      "id": "attempt_synthetic_1",
      "moduleId": "module_synthetic_1",
      "startedAt": "2026-07-19T10:05:00.000Z",
      "completedAt": "2026-07-19T10:06:00.000Z",
      "totalQuestionCount": 1,
      "correctAnswerCount": 1,
      "scorePercent": 100,
      "answers": [
        {
          "questionId": "question_synthetic_1",
          "questionRevision": 1,
          "learningNodeId": "node_synthetic_1",
          "selectedOptionId": "option_synthetic_blue",
          "correctOptionId": "option_synthetic_blue",
          "isCorrect": true
        }
      ]
    }
  ]
}
```

Root, Attempts und Antworten besitzen ausschließlich die dargestellten eigenen
Pflichtfelder und akzeptieren nur `Object.prototype` oder `null` als direkten
Prototyp. Zusätzliche, unbekannte oder geerbte Vertragsfelder,
benutzerdefinierte Prototypen und Nichtobjekte werden abgelehnt.

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `attempts` | Array | darf leer sein; Append-Reihenfolge ist autoritativ |
| `attempts[].id` | String | nicht leer, bereits getrimmt und im Log eindeutig |
| `attempts[].moduleId` | String | nicht leer und bereits getrimmt |
| `attempts[].startedAt` | String | kanonischer UTC-Zeitstempel im exakten Format `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `attempts[].completedAt` | String | dasselbe kanonische UTC-Format und nicht vor `startedAt` |
| `attempts[].totalQuestionCount` | positive Ganzzahl | exakt `answers.length` |
| `attempts[].correctAnswerCount` | nicht-negative Ganzzahl | exakt die Zahl der Antworten mit `isCorrect: true` |
| `attempts[].scorePercent` | Ganzzahl | exakt `Math.round(correctAnswerCount / totalQuestionCount * 100)` |
| `attempts[].answers` | Array | mindestens eine Antwort in autoritativer Testreihenfolge |
| `attempts[].answers[].questionId` | String | nicht leer, bereits getrimmt und innerhalb des Attempts eindeutig |
| `attempts[].answers[].questionRevision` | positive Ganzzahl | eingefrorene Revision der beantworteten Frage |
| `attempts[].answers[].learningNodeId` | String | nicht leer und bereits getrimmt |
| `attempts[].answers[].selectedOptionId` | String | nicht leer und bereits getrimmt |
| `attempts[].answers[].correctOptionId` | String | nicht leer und bereits getrimmt |
| `attempts[].answers[].isCorrect` | Boolean | exakt `selectedOptionId === correctOptionId` |

Fragen und Antworten erscheinen in der beim Teststart autoritativ bestimmten
Reihenfolge; jede `questionId` kommt in einem Attempt genau einmal vor. Der Log
wird weder bei der Validierung noch beim Laden anhand von Zeitstempeln sortiert.
Zeitstempel beschreiben den Versuch, während die Arrayreihenfolge seine
persistierte Historie festlegt. Fragen-, Options- und LearningNode-Texte werden
nicht in Attempts kopiert.

Der Validator prüft alle ableitbaren Zähler, den exakten Prozentwert und jede
Korrektheitsgleichheit, sammelt strukturell auffindbare Fehler vollständig als
stabile `{ code, path, message }`-Einträge und verändert seine Eingabe nicht.
Fehlermeldungen enthalten keine Antworten, IDs, Zeitstempel oder Rohwerte.

Schema 1 enthält keine Confidence-Werte, Hinweise, Freitext-Rubriken,
semantische Bewertung oder Kompetenzprojektion. Solche Fähigkeiten benötigen
eine spätere versionierte Erweiterung und werden nicht durch leere optionale
Felder vorweggenommen.

Die stabilen Attempt-Validatorcodes lauten:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningTestAttemptLog` | Root ist kein unterstütztes Vertragsobjekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidAttempts` | `attempts` ist kein Array |
| `invalidAttempt` | Attempt ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `unknownProperty` | ein unterstütztes Root-, Attempt- oder Antwortobjekt enthält einen unbekannten eigenen Schlüssel |
| `missingProperty` | ein erforderliches eigenes Feld fehlt |
| `invalidId` | ID oder Referenz ist leer, ungetrimmt oder kein String |
| `duplicateAttemptId` | Attempt-ID ist im Log nicht eindeutig |
| `invalidStartedAt` | Startzeitpunkt ist nicht kanonisch |
| `invalidCompletedAt` | Abschlusszeitpunkt ist nicht kanonisch |
| `completedAtBeforeStartedAt` | Abschlusszeitpunkt liegt vor dem Startzeitpunkt |
| `invalidTotalQuestionCount` | Gesamtzahl ist keine positive Ganzzahl |
| `invalidCorrectAnswerCount` | Korrektzahl ist keine nicht-negative Ganzzahl |
| `invalidScorePercent` | Prozentwert ist keine Ganzzahl im gültigen Bereich |
| `invalidAnswers` | `answers` ist kein Array |
| `attemptRequiresAnswer` | Attempt enthält keine Antwort |
| `invalidAnswer` | Antwort ist kein unterstütztes Vertragsobjekt oder besitzt einen unzulässigen Prototype |
| `duplicateQuestionId` | Frage kommt im Attempt mehrfach vor |
| `invalidQuestionRevision` | Fragenrevision ist keine positive Ganzzahl |
| `invalidIsCorrect` | `isCorrect` ist kein Boolean |
| `inconsistentIsCorrect` | `isCorrect` widerspricht dem strikten ID-Vergleich |
| `totalQuestionCountMismatch` | Gesamtzahl entspricht nicht `answers.length` |
| `correctAnswerCountMismatch` | Korrektzahl entspricht nicht den korrekten Antworten |
| `scorePercentMismatch` | Prozentwert entspricht nicht der exakten `Math.round`-Formel |

#### Lokale LearningTest-Persistenzgrenzen

`createLearningTestBankStorage` erhält ausschließlich den gemeinsamen
`StorageAdapter` und verwendet den festen, nicht nutzerkontrollierten Key:

```text
goldendawn.learningHub.testBank.v1
```

Es stellt `loadLearningTestBank()` und `saveLearningTestBank(testBank)` bereit.
Ein erfolgreicher Load liefert `status: missing` oder `status: found` und den
vollständig defensiv geklonten Wert in `testBank`; ein erfolgreicher Save
liefert `status: saved`. Ein fehlender Key ergibt ohne
Initialisierungsschreibzugriff diesen frischen privaten Leerzustand:

```json
{
  "schemaVersion": 1,
  "dataOrigin": "private",
  "questions": []
}
```

`createLearningTestAttemptStorage` verwendet getrennt ausschließlich diesen
festen Key:

```text
goldendawn.learningHub.testAttempts.v1
```

Es stellt `loadLearningTestAttempts()` und
`appendLearningTestAttempt(attempt)` bereit. Ein erfolgreicher Load liefert
`status: missing` oder `status: found` und den defensiv geklonten Wert in
`attemptLog`. Ein fehlender Key ergibt schreibfrei einen frischen privaten Log
mit `schemaVersion: 1`, `dataOrigin: private` und leerem `attempts`-Array. Ein
erfolgreicher Append liefert `status: appended` und den vollständigen neuen
defensiv geklonten `attemptLog`.

Der einmalige LearningHub-Demo-Erststart legt diesen Attempt-Key ausdrücklich
nicht an. Fragen werden vorbefüllt, aber Attempts, Antworten, Ergebnisse und
Historieneinträge entstehen erst durch eine vom Nutzer abgeschlossene Abgabe.

`LearningTestAttemptStorage` besitzt keinen öffentlichen allgemeinen
Save-Pfad. Vor dem Schreiben lädt und validiert es den aktuellen vollständigen
Log und hängt genau einen neuen, validen Attempt an einen unveränderten
gültigen Präfix. Bestehende Attempts dürfen weder verändert, entfernt noch
umsortiert werden. Eine doppelte Attempt-ID oder ein abweichender historischer
Präfix blockiert den Schreibzugriff.

Beide Storages validieren Lese- und Schreibwerte vollständig, klonen sie
defensiv und akzeptieren im privaten Produktionspfad ausschließlich
`dataOrigin: private`. Synthetische, beschädigte oder nicht unterstützte Werte
werden weder gelöscht noch überschrieben oder als private Leerzustände
ausgegeben. Vor jedem Save beziehungsweise Append liest der Storage seinen
festen Key erneut. Nur ein fehlender Key oder ein vollständig valider privater
Bestand erlaubt den Schreibzugriff.

Stabile fachliche Storage-Fehler unterscheiden mindestens ungültige
Testbankdaten (`invalidLearningTestBankData`), falsche Bankherkunft
(`privateLearningTestBankRequired`), ungültige Attempt-Logs
(`invalidLearningTestAttemptLogData`) und falsche Attempt-Herkunft
(`privateLearningTestAttemptsRequired`) von den bestehenden technischen
Adapter-, Lese-, Schreib- und Quota-Fehlern. Meldungen geben keine Prompts,
Optionen, Erklärungen, Antworten, IDs, Rohwerte oder ungefilterten
Dependency-Fehler weiter. Es gibt keine Console-Ausgaben.

Der Read-Preflight ist keine Transaktion. Zwischen Lesen und Schreiben kann
sich derselbe Wert ändern; TOCTOU- und Multi-Tab-Rennen werden dadurch nicht
verhindert. `localStorage` ist unverschlüsselt und für JavaScript derselben
Origin grundsätzlich lesbar. `dataOrigin` ist nur eine Klassifikation, keine
Authentifizierung oder technische Geheimhaltungsgrenze. Browser-Quota,
fehlende Gesamtgrößenlimits, verlorene Änderungen, fehlende Synchronisierung
und das Löschen des Browserprofils bleiben bekannte Grenzen.

Append-only ist eine Service- und Storage-Regel über vollständig neu
geschriebene JSON-Snapshots. Es gibt keine kryptografische Verkettung,
Signatur, Manipulationssperre oder beweisbare Urheberschaft historischer
Attempts.

#### Reine LearningTestEngine

Die reine Engine exportiert drei Operationen:

| Operation | Wirkung |
| --- | --- |
| `selectModuleTestQuestions(learningHub, testBank, moduleId)` | alle Fragen des Moduls nach aktueller Hub-Struktur deterministisch auswählen |
| `projectPublicTestQuestions(questions)` | defensive öffentliche Fragen ohne Lösung und Erklärung erzeugen |
| `evaluateLearningTestAnswers(questions, answers)` | vollständige Single-Choice-Antworten mit dem privaten Fragensnapshot auswerten |

Die Auswahl sortiert stabil nach Kapitelposition des aktuellen LearningHubs,
LearningNode-Position und Frageposition. Optionen werden ausschließlich nach
ihrer eigenen Position sortiert. Arrayindizes, Zeitstempel und sichtbare Texte
sind keine Sortierschlüssel. Die Engine verwendet niemals `Math.random`,
verändert keine Eingabe und besitzt weder Uhr-, ID-, Storage-, Netzwerk- noch
DOM-Zugriffe.

Eine öffentliche Frage hat exakt diese Form:

```json
{
  "id": "question_synthetic_1",
  "learningNodeId": "node_synthetic_1",
  "type": "singleChoice",
  "prompt": "Welche erfundene Markierung zeigt nach Norden?",
  "difficulty": "easy",
  "options": [
    {
      "id": "option_synthetic_blue",
      "label": "Die blaue Raute"
    },
    {
      "id": "option_synthetic_gold",
      "label": "Der goldene Kreis"
    }
  ]
}
```

`correctOptionId`, `explanation`, Referenzkette, Revision, Positionen und
Zeitstempel werden vor der Auswertung nicht öffentlich projiziert. Diese
Reduktion verhindert eine versehentliche Lösungsweitergabe an die
Runner-View, bildet gegenüber lokalem Same-Origin-JavaScript aber keine technische
Geheimhaltungsgrenze.

Der `LearningTestService` akzeptiert vor dem Engine-Aufruf genau eine bekannte
Antwort je ausgewählter Frage und weist fehlende, doppelte, zusätzliche und
unbekannte Fragen oder Optionen ab. Die reine Engine erhält dadurch eine
vollständige Antwortmenge und vergleicht die Options-IDs strikt. Sie übernimmt
weder Korrektheitswerte noch Zähler oder Scores vom Aufrufer. Ihr Ergebnis hat
die Form
`{ answers, totalQuestionCount, correctAnswerCount, scorePercent }`; die
einzelnen Antworten entsprechen dem Attempt-Vertrag. Dabei gelten exakt:

```text
isCorrect = selectedOptionId === correctOptionId
totalQuestionCount = answers.length
correctAnswerCount = Anzahl der Antworten mit isCorrect === true
scorePercent = Math.round(correctAnswerCount / totalQuestionCount * 100)
```

Fragen und Ergebnisantworten bleiben in der autoritativen Testreihenfolge.
Nach der Auswertung darf eine Service-Ergebnisprojektion korrekte Option und
Erklärung als Feedback enthalten; der rohe Fragenbestand wird nicht
zurückgegeben.

#### LearningTestService und flüchtige Sessions

`LearningTestService` stellt diese öffentlichen Operationen bereit:

| Operation | Fachliche Wirkung |
| --- | --- |
| `loadTestBank()` | aktuellen privaten Fragenbestand laden und vollständig gegen den aktuellen Hub prüfen |
| `createQuestion({ moduleId, chapterId, learningNodeId, prompt, difficulty, options, correctOptionIndex, explanation })` | Single-Choice-Frage am Ende der Fragen desselben LearningNodes erstellen |
| `updateQuestion({ moduleId, chapterId, learningNodeId, questionId, prompt, difficulty, options, correctOptionIndex, explanation })` | vorhandene Frage ohne unbemerkten Referenzwechsel aktualisieren |
| `startModuleTest({ moduleId })` | deterministische öffentliche Testsession für ein Modul starten |
| `submitModuleTest({ testSessionId, answers })` | eingefrorene Session exakt einmal auswerten und Attempt anhängen |
| `cancelModuleTest({ testSessionId })` | eine sicher abbrechbare flüchtige Session ohne Attempt oder Persistenz beenden |
| `loadAttemptHistory({ moduleId })` | textfreie Attempt-Projektionen eines Moduls in Append-Reihenfolge laden |

Mit Ausnahme des rein speicherinternen `cancelModuleTest` lädt jede Operation
zuerst den aktuellen autoritativen LearningHub. Bank und Hub werden vollständig
validiert; jede gespeicherte Frage muss auf eine
existierende vollständige Modul-, Kapitel- und LearningNode-Kette zeigen.
Global vorhandene IDs mit falscher Elternzuordnung und verwaiste Referenzen
werden kontrolliert abgelehnt und nicht repariert. Eine Frage kann durch
`updateQuestion` nicht unbemerkt auf einen anderen LearningNode verschoben
werden. Der Inhaltsservice besitzt keine Rückabhängigkeit auf den Testservice.

Serviceeingaben werden vor Leer- und Längenprüfung an den Rändern getrimmt.
`options` ist ein Array aus zwei bis sechs Texten; `correctOptionIndex` muss
exakt auf eine dieser Optionen zeigen. `createQuestion` verwendet die nächste
freie positive Geschwisterposition des LearningNodes. `updateQuestion` erhält
Frage-ID, `createdAt` und Position und erhöht `revision` nur bei einer
tatsächlichen Änderung. Bei identischen normalisierten Eingaben erfolgt ein
vollständiger No-op ohne ID-, Uhr- oder Schreibzugriff. Unveränderte Optionen
behalten ihre IDs; ändert sich Optionsinhalt, -reihenfolge oder -anzahl, erhält
der vollständige Optionssatz neue stabile IDs.

ID-Generator und Uhr sind injizierbar. IDs müssen im jeweiligen vollständigen
Vertrag eindeutig, nicht leer und bereits getrimmt sein. Kollisionen,
ungültige Generatorwerte und Generatorfehler sind auf insgesamt fünf Versuche
begrenzt. Eine erfolgreiche echte Bankmutation validiert den vollständigen
neuen Bestand und speichert exakt einmal.

Die stabilen Erfolgsstatus und Ergebnisfelder lauten:

| Operation und Fall | `status` | Ergebnisfeld | `changed` |
| --- | --- | --- | --- |
| `loadTestBank`, fehlender Key | `empty` | `testBank` | `false` |
| `loadTestBank`, vorhandene valide Bank | `loaded` | `testBank` | `false` |
| `createQuestion`, erfolgreich | `questionCreated` | `testBank`, `question` | `true` |
| `updateQuestion`, tatsächliche Änderung | `questionUpdated` | `testBank`, `question` | `true` |
| `updateQuestion`, identische normalisierte Eingabe | `questionUnchanged` | `testBank`, `question` | `false` |
| `startModuleTest`, erfolgreich | `testStarted` | `testSession` | `true` |
| `submitModuleTest`, erfolgreich persistiert | `testCompleted` | `result` | `true` |
| `cancelModuleTest`, sicher abgebrochen | `testCancelled` | – | `true` |
| `loadAttemptHistory`, keine Attempts des Moduls | `attemptHistoryEmpty` | `attempts` | `false` |
| `loadAttemptHistory`, vorhandene Attempts | `attemptHistoryLoaded` | `attempts` | `false` |

`testSession` enthält eine defensive öffentliche Fragenprojektion ohne Lösung
oder Erklärung. `result` enthält sichere Attempt-Metadaten und Feedback nach
der Auswertung, aber keine Rohstores. `attempts` enthält defensive, textfreie
Projektionen und bleibt in persistierter Append-Reihenfolge. Jeder Fehler
verwendet `ok: false`, `changed: false` sowie stabile generische Codes und
Meldungen; ungefilterte Dependency-Meldungen und private Eingabewerte werden
nicht weitergereicht.

`startModuleTest` benötigt mindestens eine gültige Frage des Moduls. Erst nach
allen Validierungen erzeugt es eine lokale Session-ID und genau einen
kanonischen Startzeitpunkt, friert die autoritative Fragenreihenfolge samt
Antwortschlüssel im privaten Servicezustand ein und gibt nur die öffentliche
Projektion zurück. Es schreibt keinen Attempt und verwendet weder
Zufallsauswahl noch Shuffle. Fehler oder No-ops konsumieren keine ID und keinen
Zeitstempel.

In-Progress-Sessions werden absichtlich nicht persistiert. Nach einem Reload
oder einer neuen Serviceinstanz muss der Test neu begonnen werden. Änderungen
an Hub oder Testbank verändern den bereits eingefrorenen Sessionsnapshot
nicht. Die UI weist sichtbar auf diese Grenze hin und verspricht keine
Wiederaufnahme eines nicht gespeicherten Tests.

`submitModuleTest` akzeptiert ausschließlich `{ questionId,
selectedOptionId }` für genau jede Sessionfrage und bewertet nur anhand des
privaten Snapshots. Erst eine vollständige valide Abgabe erzeugt eine
Attempt-ID und einen kanonischen Abschlusszeitpunkt, konstruiert den
konsistenten Attempt und ruft `appendLearningTestAttempt` genau einmal auf.
Die Session wird erst nach erfolgreichem Append entfernt. Ein Speicherfehler
erhält sie für einen kontrollierten Retry; nach erfolgreichem Abschluss wird
eine zweite Abgabe derselben Session ohne zweiten Attempt abgelehnt.

`cancelModuleTest` liest `testSessionId` defensiv genau einmal. Eine bekannte
Session wird nur entfernt, wenn weder `submissionInProgress` noch
`pendingSubmission` gesetzt ist. Der sichere Abbruch erzeugt keinen Attempt,
keinen Storage-Zugriff, keine neue ID und keine Uhrzeit. Während einer laufenden
Abgabe oder nach einem möglicherweise bereits erfolgten Schreibzugriff liefert
der Service `conflict` mit `changed: false`, damit Retry beziehungsweise
Reconciliation möglich bleibt. Eine unbekannte Session liefert kontrolliert
`notFound`; Sessiondetails oder Dependency-Meldungen werden nicht ausgegeben.
Abgebrochene Session-IDs bleiben innerhalb derselben Serviceinstanz reserviert.

`loadAttemptHistory` filtert nur anhand der validierten `moduleId`, sortiert
nicht nach Zeitstempeln und kopiert weder Fragen-, Options- noch
LearningNode-Texte. Attempts führen keine Progress-Mutation aus und leiten
keinen Kompetenzstand ab. Fortschritt, LearningArtifacts und Testkompetenz
bleiben fachlich getrennt.

`src/main.js` erzeugt beide Test-Storages über den vorhandenen
`StorageAdapter`, erzeugt den `LearningTestService` und injiziert ihn in den
vorhandenen `LearningHubController`. Es gibt keinen separaten Test-Controller.
Der Controller validiert Bankmutationen gegen unveränderte Schwesterfragen,
öffentliche Sessions gegen Ziel, Reihenfolge und lösungsfreie Felder,
`testCompleted` gegen die eingefrorene Session und den abgegebenen
Antwortpayload sowie Historienprojektionen gegen Modul, Reihenfolge, Zähler und
`Math.round`. Die View erhält während des Tests keine Lösungen oder
Erklärungen; historische View-Modelle enthalten nur Abschlusszeit, Zähler und
Prozentwert.

Die sichtbare lokale Mock-Test-UI ist bedienbar; `v0.2.1` ist vollständig
geprüft und veröffentlicht. Der spätere externe Zielpfad lautet weiterhin:

```text
LearningTestService
  → SyncService
  → SyncAgent
  → TestAgent
```

Semantische Freitextbewertung, automatische Fragengenerierung, Confidence,
Hinweise und Testkompetenz beginnen frühestens mit einer späteren
versionierten Entscheidung. Die lokalen Schema-1-Verträge reservieren dafür
keine Felder.

#### Lokaler LearningArtifact-Vertrag – Schema 1

##### Trennung von Inhalt und Fortschritt

LearningArtifacts bilden private, benutzerverfasste Notizen und
Zusammenfassungen als aktuelle Arbeitsstände ab. Sie erweitern weder den
LearningHub-Inhaltsvertrag noch den append-only Progress-Vertrag:

| Belang | Vertrag | Storage-Key | Lebenszyklus |
| --- | --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` | editierbarer Inhalt |
| Kapitelzustandswechsel und Modulfortschritt | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` | append-only Ereignisfolge |
| Notizen und Zusammenfassungen | LearningArtifact `schemaVersion: 1` | `goldendawn.learningHub.artifacts.v1` | editierbarer aktueller Stand ohne Historie |

Die Zahlen in den Storage-Keys versionieren ausschließlich die jeweiligen
Persistenz-Namespaces. Sie ändern die unabhängig versionierten Verträge nicht.
Die Artifact-Foundation führt keine Progress-Ereignisse, kein Schema 3 des
LearningHubs und keine gemeinsame Sammelpersistenz ein.

##### LearningArtifact: Struktur und Validierung

Der Root enthält ausschließlich die Vertragsversion, die
Herkunftsklassifikation und das Artefakt-Array. Jedes Artefakt enthält
ausschließlich seine Identität, seinen Typ, die drei stabilen
Quellenreferenzen, den privaten Text und zwei Zeitstempel. Alle aufgeführten
Felder sind eigene Pflichtfelder; fehlende und unbekannte Felder werden
abgelehnt.

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `artifacts` | Array | darf leer sein |
| `artifacts[].id` | String | nicht leer, bereits getrimmt und im vollständigen Store global eindeutig |
| `artifacts[].type` | String | ausschließlich `note` oder `summary` |
| `artifacts[].moduleId` | String | nicht leer und bereits getrimmt |
| `artifacts[].chapterId` | String | nicht leer und bereits getrimmt |
| `artifacts[].learningNodeId` | String | nicht leer und bereits getrimmt |
| `artifacts[].content` | String | nicht leer, bereits getrimmt und höchstens 10.000 Zeichen |
| `artifacts[].createdAt` | String | kanonischer UTC-Zeitstempel im exakten Format `YYYY-MM-DDTHH:mm:ss.sssZ` |
| `artifacts[].updatedAt` | String | dasselbe kanonische UTC-Format und nicht vor `createdAt` |

Die Kombination aus `learningNodeId` und `type` ist im vollständigen Store
eindeutig. Ein LearningNode besitzt daher höchstens eine aktuelle `note` und
höchstens eine aktuelle `summary`; beide Typen dürfen gleichzeitig existieren.
Modul-, Kapitel- und LearningNode-Titel sowie deren vollständige Inhalte werden
nicht in den Artifact-Store kopiert. Gespeichert werden ausschließlich die
stabilen Referenz-IDs und der private Artefakttext einschließlich seiner
Artefaktmetadaten.

`validateLearningArtifactStore` sammelt alle strukturell auffindbaren Fehler als
stabile Einträge `{ code, path, message }` und verändert die Eingabe nicht. Die
Implementierung exportiert die fachlich benötigten Vertragskonstanten, die
kanonische Zeitprüfung und den Validator. Die stabilen Vertragsfehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningArtifactStore` | Root ist kein Objekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidArtifacts` | `artifacts` ist kein Array |
| `invalidArtifact` | ein Artefakteintrag ist kein Objekt |
| `unknownProperty` | Root oder Artefakt enthält ein nicht unterstütztes eigenes Feld |
| `missingProperty` | ein erforderliches eigenes Feld fehlt |
| `invalidId` | Artefakt-ID oder Referenz-ID ist leer, ungetrimmt oder kein String |
| `duplicateArtifactId` | eine Artefakt-ID kommt im Store mehrfach vor |
| `invalidArtifactType` | Typ ist weder `note` noch `summary` |
| `duplicateLearningNodeArtifactType` | Kombination aus `learningNodeId` und `type` kommt mehrfach vor |
| `invalidContent` | Artefakttext ist leer, ungetrimmt oder kein String |
| `contentTooLong` | Artefakttext überschreitet 10.000 Zeichen |
| `invalidCreatedAt` | `createdAt` ist ungültig oder nicht kanonisch |
| `invalidUpdatedAt` | `updatedAt` ist ungültig oder nicht kanonisch |
| `updatedAtBeforeCreatedAt` | `updatedAt` liegt vor `createdAt` |

Die strukturelle Validierung prüft bewusst nicht, ob die Referenz-IDs im
aktuellen LearningHub existieren und richtig miteinander verknüpft sind. Diese
Prüfung benötigt den aktuellen Inhaltsstand und liegt im
`LearningArtifactService`.

##### Datenfluss, Service und Referenzintegrität

```text
LearningHubView
  → LearningHubController
  → LearningArtifactService
      ├→ LearningHubService
      │   → LearningHubStorage
      │   → StorageAdapter
      │
      └→ LearningArtifactStorage
          → StorageAdapter
          → localStorage
```

`LearningArtifactService` verwendet `LearningHubService` ausschließlich zum
Laden des aktuellen privaten Inhaltsstands und zur Referenzprüfung. Der
Inhaltsservice besitzt keine Rückabhängigkeit auf den Artifact-Service; eine
zirkuläre Service-Abhängigkeit entsteht nicht. `src/main.js` injiziert den
Service in den vorhandenen Controller, der der View nur eine defensiv geprüfte
Projektion aktueller Notiz- und Zusammenfassungstexte übergibt. Ein eigener
Artifact-Controller entsteht nicht; Artefakt-IDs, Referenzketten und
Zeitstempel gehören nicht zum UI-Vertrag.

Der Service stellt diese öffentlichen Operationen bereit:

| Operation | Fachliche Wirkung |
| --- | --- |
| `loadArtifacts()` | aktuellen privaten Artifact-Store laden oder bei fehlendem Key den unpersistierten leeren Initialzustand liefern |
| `saveNote({ moduleId, chapterId, learningNodeId, content })` | aktuelle Notiz erstellen oder ihren Text aktualisieren |
| `saveSummary({ moduleId, chapterId, learningNodeId, content })` | aktuelle Zusammenfassung erstellen oder ihren Text aktualisieren |
| `clearNote({ moduleId, chapterId, learningNodeId })` | exakt die Notiz der Referenz entfernen |
| `clearSummary({ moduleId, chapterId, learningNodeId })` | exakt die Zusammenfassung der Referenz entfernen |

Die stabilen Erfolgsstatus lauten:

| Operation und Fall | `status` | `changed` |
| --- | --- | --- |
| `loadArtifacts`, fehlender Artifact-Key | `empty` | `false` |
| `loadArtifacts`, vorhandener valider Store | `loaded` | `false` |
| erstmaliges Speichern eines Typs | `artifactCreated` | `true` |
| Aktualisieren eines vorhandenen Typs | `artifactUpdated` | `true` |
| Speichern eines inhaltlich identischen Texts | `artifactUnchanged` | `false` |
| Entfernen eines vorhandenen Typs | `artifactCleared` | `true` |
| Entfernen eines nicht vorhandenen Typs | `artifactAlreadyEmpty` | `false` |

Jeder Service-Erfolg und -Fehler enthält ein konsistentes `changed`. Sichere
Ergebnisse liefern defensive Kopien des vollständigen `artifactStore`;
Fehlerfälle verwenden stabile generische Codes und Meldungen ohne private
Inhalte.

Jede Mutation folgt diesen Grenzen:

1. aktuellen LearningHub über `LearningHubService` laden und vollständig
   validieren;
2. Existenz und Eigentum der Zielkette `moduleId` → `chapterId` →
   `learningNodeId` prüfen;
3. aktuellen Artifact-Store laden und vollständig validieren;
4. alle bereits gespeicherten Referenzketten gegen den aktuellen Hub prüfen;
5. immutable einen neuen vollständigen Zustand erzeugen;
6. den Ergebniszustand vollständig validieren;
7. nur bei einer echten Änderung genau einmal speichern.

Ein Modul muss existieren, das Kapitel muss zu diesem Modul und der LearningNode
zu diesem Kapitel gehören. Eine andernorts global vorhandene ID macht eine
falsche Elternkette nicht gültig. Verwaiste oder falsch zugeordnete gespeicherte
Artefakte blockieren Mutationen kontrolliert und werden weder repariert,
gelöscht noch überschrieben.

`saveNote` und `saveSummary` trimmen `content` vor Leer- und Längenprüfung.
Leerer Text wird abgelehnt; Entfernen erfolgt ausschließlich über die
Clear-Operationen. Beim Erstellen entstehen eine neue stabile Artefakt-ID und
genau ein Zeitwert, der gleichermaßen für `createdAt` und `updatedAt` verwendet
wird. Beim Aktualisieren bleiben `id` und `createdAt` unverändert; der neue
`updatedAt`-Wert darf nicht vor dem vorherigen `updatedAt` liegen.

Neue IDs werden über einen injizierbaren Generator erzeugt und im vollständigen
Store auf Eindeutigkeit geprüft. Nach höchstens fünf ungültigen Werten,
Generatorfehlern oder Kollisionen bricht die Erzeugung kontrolliert ohne
Schreibzugriff ab. Die injizierbare Uhr muss einen kanonischen UTC-Zeitstempel
liefern; Uhrfehler, nicht kanonische Werte und rückläufige Aktualisierungszeiten
führen ebenfalls zu keinem Save.

Inhaltlich identische Speicheraufrufe sind vollständige No-ops: Sie erzeugen
weder ID noch Zeitstempel und schreiben nicht. Clear-Operationen erzeugen
grundsätzlich keine ID oder Uhrabfrage. Sie entfernen nur den exakt
referenzierten Typ, erhalten das andere Artefakt desselben LearningNodes und
verändern die Reihenfolge aller übrigen Artefakte nicht. Auch ein bereits leerer
Typ bleibt ohne Schreibzugriff.

##### UI-Projektion, No-ops und Fehlerisolation

Der `LearningHubController` akzeptiert beim Laden ausschließlich `empty` und
`loaded`. Für Speichermutationen akzeptiert er `artifactCreated` und
`artifactUpdated` mit `changed: true` sowie `artifactUnchanged` mit
`changed: false`. Clear-Mutationen verwenden `artifactCleared` mit
`changed: true` oder `artifactAlreadyEmpty` mit `changed: false`. Andere oder
widersprüchliche Status-/Changed-Kombinationen gelten nicht als Erfolg.

Die UI verbindet Artefakte ausschließlich über die stabile Auswahl des
aktuellen LearningNodes. Sie erhält defensiv geprüfte aktuelle Texte für
`note` und `summary`, nicht den rohen Store, Artefakt-IDs, Referenzketten oder
Zeitstempel. Nutzertext wird nur über `textContent`, Formularwert-Eigenschaften
oder gleichwertige sichere DOM-Erzeugung ausgegeben.

Ein isolierter Ladefehler markiert Artefakte als nicht verfügbar, deaktiviert
ihre Mutationen und bietet `loadArtifacts` als nicht destruktiven Retry an;
Inhalte und Fortschritt bleiben bedienbar. Mutationsfehler behalten die letzte
valide Projektion und den eingegebenen Text. Erfolgreiche No-ops werden als
Hinweis sichtbar und lösen keinen zusätzlichen Save aus.

Das Leeren einer vorhandenen Notiz oder Zusammenfassung benötigt eine
zugängliche Inline-Bestätigung. Abbrechen verändert weder Projektion noch
Storage; Bestätigen ruft ausschließlich die passende Clear-Operation auf.
Blockierende Browserdialoge werden nicht verwendet. Busy-Zustände verhindern
parallele Artefaktmutationen, und der Fokus wird nach Erfolg, No-op oder Fehler
zum betroffenen Editor oder zur auslösenden Aktion zurückgeführt.

Wichtige stabile Service-Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningArtifactInput` | Ziel-IDs oder Artefakttext sind formal ungültig |
| `moduleNotFound` | Zielmodul existiert nicht |
| `chapterNotFound` | Zielkapitel existiert nicht |
| `chapterModuleMismatch` | Zielkapitel gehört nicht zum angegebenen Modul |
| `learningNodeNotFound` | Ziel-LearningNode existiert nicht |
| `learningNodeChapterMismatch` | Ziel-LearningNode gehört nicht zur angegebenen Elternkette |
| `orphanedArtifactModuleReference` | gespeichertes Artefakt verweist auf kein vorhandenes Modul |
| `orphanedArtifactChapterReference` | gespeichertes Artefakt verweist auf kein vorhandenes Kapitel |
| `artifactChapterModuleMismatch` | gespeichertes Artefakt besitzt eine falsche Modul-Kapitel-Zuordnung |
| `orphanedArtifactLearningNodeReference` | gespeichertes Artefakt verweist auf keinen vorhandenen LearningNode |
| `artifactLearningNodeChapterMismatch` | gespeichertes Artefakt besitzt eine falsche vollständige Elternkette |
| `learningArtifactIdGenerationFailed` | in höchstens fünf Versuchen entstand keine gültige eindeutige Artefakt-ID |
| `learningArtifactClockFailed` | injizierte Uhr ist fehlgeschlagen |
| `invalidLearningArtifactTimestamp` | Uhrwert ist kein kanonischer UTC-Zeitstempel |
| `learningArtifactTimestampMovedBackward` | Aktualisierungszeitpunkt liegt vor dem vorherigen `updatedAt` |
| `invalidLearningArtifactState` | vollständiger neuer Artifact-Store ist nicht vertragsgültig |
| `invalidStoredLearningHub` | geladener Inhaltszustand ist kein gültiger privater Schema-2-Hub |
| `invalidStoredLearningArtifacts` | geladener Artefaktzustand ist kein gültiger privater Schema-1-Store |
| `learningArtifactStorageUnavailable` | Artifact-Storage-Schnittstelle fehlt |
| `learningArtifactStorageReadFailed` | Artifact-Store konnte nicht gelesen werden |
| `learningArtifactStorageWriteFailed` | Artifact-Store konnte nicht geschrieben werden |
| `unexpectedLearningHubResult` | Inhaltsservice lieferte kein verwertbares Ergebnis |
| `unexpectedStorageResult` | Artifact-Storage lieferte kein verwertbares Ergebnis |

##### Lokale Persistenz und Sicherheitsgrenzen

`createLearningArtifactStorage` erhält ausschließlich den gemeinsamen
`StorageAdapter` und stellt `loadLearningArtifacts` sowie
`saveLearningArtifacts` unter diesem festen, nicht nutzerkontrollierten Key
bereit:

```text
goldendawn.learningHub.artifacts.v1
```

Fehlt der Key, liefert jeder Lesevorgang ohne Initialisierungsschreibzugriff
einen frischen Store mit `schemaVersion: 1`, `dataOrigin: private` und leerem
`artifacts`-Array. Ein erfolgreicher Lesevorgang liefert `status: missing` oder
`status: found` und den defensiv geklonten Wert in `artifactStore`; ein
erfolgreicher Schreibvorgang liefert `status: saved`.

Vor jedem Schreibzugriff liest der Storage denselben festen Key erneut und
wendet auf einen vorhandenen Wert dieselbe vollständige Vertrags- und
Herkunftsprüfung an. Ein synthetischer, beschädigter, nicht unterstützter oder
nicht sicher lesbarer Bestand blockiert den Save; erst ein fehlender Key oder
ein gültiger privater Bestand erlaubt den anschließenden Schreibzugriff. Dieser
Read-Preflight verhindert ein bewusstes Überschreiben erkennbar unsicherer
Bestände, ist aber keine Transaktion und schließt Multi-Tab-Rennen nicht aus.

Laden und Speichern validieren den vollständigen Vertrag. Der private Pfad
akzeptiert ausschließlich `dataOrigin: private`. Synthetische, beschädigte und
nicht unterstützte gespeicherte Werte werden weder gelöscht, überschrieben noch
durch den leeren Initialzustand ersetzt. Auch an den Adapter übergebene
Schreibwerte werden defensiv geklont.

Adapter-, Verfügbarkeits-, Lese-, Schreib- und Quota-Fehler werden kontrolliert
in stabile Ergebnisse übersetzt. Fehler und Konsolenausgaben enthalten keine
privaten Texte, IDs, Referenzketten, Rohwerte oder Zeitstempel. Es gibt keinen
Demo-Import, Netzwerkzugriff und keine Telemetrie.

`dataOrigin` ist nur eine Klassifikation und kein technischer Schutz.
`localStorage` ist unverschlüsselt und für JavaScript derselben Origin
grundsätzlich zugänglich. Die lokale Ablage ist keine Cloud-Sicherung und keine
geräteübergreifende Synchronisierung; Browserdaten können gelöscht werden.
Browser-Quota, Multi-Tab-Rennen und fehlende Transaktionssperren bleiben
Grenzen. Die 10.000-Zeichen-Grenze gilt je Artefakt und ersetzt keine
Gesamtgrößenbegrenzung des Stores. Die implementierte UI gibt private
Artefakttexte über `textContent`, Formularwert-Eigenschaften oder gleichwertige
sichere DOM-Erzeugung aus.

Schema 1 enthält keine Artefakt-Versionshistorie. Eine spätere Historie,
Migration, Import/Export, Synchronisierung sowie Archivierungs- oder
Löschregeln für referenzierte LearningHub-Inhalte benötigen jeweils eine
gesonderte Vertrags- und Architekturentscheidung.

#### Lokaler LearningHub-Fortschrittsvertrag – Schema 1

##### Trennung vom Inhaltsvertrag

Der Fortschrittsvertrag erweitert den LearningHub-Inhaltsvertrag nicht. Ein
Kapitel erhält insbesondere kein veränderliches `completed`-Feld. Inhalt und
Fortschritt besitzen getrennte Schemaversionen, Validierungen, Services und
Storage-Keys:

| Belang | Vertrag | Storage-Key |
| --- | --- | --- |
| Module, Kapitel und LearningNodes | LearningHub `schemaVersion: 2` | `goldendawn.learningHub.content.v1` |
| Kapitelzustandswechsel und daraus abgeleiteter Modulfortschritt | LearningProgress `schemaVersion: 1` | `goldendawn.learningHub.progress.v1` |

Die identische Zahl `1` in Progress-Schema und Progress-Key ist zufällig. Das
`v1` im Key versioniert den Persistenz-Namespace; `schemaVersion: 1`
versioniert unabhängig davon die Struktur des gespeicherten Fortschrittslogs.

##### LearningHub-Fortschritt: Struktur und Validierung

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "events": [
    {
      "id": "learning-progress-event-synthetic-example",
      "type": "chapter.completed",
      "moduleId": "module-synthetic-atlas",
      "chapterId": "chapter-synthetic-compass",
      "occurredAt": "2026-07-18T12:00:00.000Z"
    },
    {
      "id": "learning-progress-event-synthetic-reopen",
      "type": "chapter.reopened",
      "moduleId": "module-synthetic-atlas",
      "chapterId": "chapter-synthetic-compass",
      "occurredAt": "2026-07-18T12:05:00.000Z"
    }
  ]
}
```

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | exakt `1` |
| `dataOrigin` | String | ausschließlich `synthetic` oder `private` |
| `events` | Array | darf leer sein; Reihenfolge ist autoritativ |
| `events[].id` | String | nicht leer, bereits getrimmt und im vollständigen Log eindeutig |
| `events[].type` | String | `chapter.completed` oder `chapter.reopened` |
| `events[].moduleId` | String | nicht leer und bereits getrimmt |
| `events[].chapterId` | String | nicht leer und bereits getrimmt |
| `events[].occurredAt` | String | gültiger kanonischer ISO-8601-UTC-Zeitstempel im Format mit Millisekunden und `Z` |

Root und jedes Ereignis müssen Objekte sein; Arrays oder `null` sind an diesen
Stellen ungültig. Zeitstempel müssen weder eindeutig noch monoton sein. Der
Vertrag sortiert nicht nach `occurredAt`: Die persistierte Reihenfolge im
`events`-Array bestimmt die Zustandsableitung.

`validateLearningProgress` sammelt alle strukturell auffindbaren Fehler als
stabile Einträge `{ code, path, message }` und verändert die Eingabe nicht. Die
Implementierung exportiert `LEARNING_PROGRESS_SCHEMA_VERSION`,
`LEARNING_PROGRESS_DATA_ORIGINS`, `LEARNING_PROGRESS_EVENT_TYPES`,
`LEARNING_PROGRESS_ERROR_CODES` und `validateLearningProgress`. Die
exportierten Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningProgress` | Root ist kein Objekt |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1` |
| `invalidDataOrigin` | Herkunft ist weder `synthetic` noch `private` |
| `invalidEvents` | `events` ist kein Array |
| `invalidEvent` | ein Ereigniseintrag ist kein Objekt |
| `invalidId` | Ereignis-ID oder Referenz ist leer, ungetrimmt oder kein String |
| `duplicateEventId` | Ereignis-ID kommt im vollständigen Log mehrfach vor |
| `invalidEventType` | Ereignistyp gehört nicht zu Schema 1 |
| `invalidOccurredAt` | Zeitstempel ist ungültig oder nicht kanonisch |

Die strukturelle Validierung prüft bewusst nicht, ob `moduleId` oder
`chapterId` im aktuellen LearningHub existieren oder ob das Kapitel zum Modul
gehört. Diese referenzielle Prüfung benötigt den aktuellen Inhaltsstand und
liegt im `LearningProgressService`.

Schema 1 unterstützt kein `chapter.started`. Eine spätere Einführung dieses
oder eines anderen Ereignistyps ist keine stille Enum-Erweiterung, sondern eine
versionierte Vertragsänderung mit angepasster Validierung, Projektion,
Persistenzdokumentation und Tests.

##### Reine Fortschrittsprojektion

`projectLearningProgress(learningHub, progressLog)` erhält einen validen
LearningHub und einen validen Fortschrittslog, verändert beide Eingaben nicht
und persistiert nichts. Die Funktion gibt direkt ein Modul-Array zurück:

```json
[
  {
    "moduleId": "module-synthetic-atlas",
    "completedChapterCount": 1,
    "totalChapterCount": 3,
    "progressPercent": 33,
    "isCompleted": false,
    "chapters": [
      {
        "chapterId": "chapter-synthetic-compass",
        "isCompleted": true
      },
      {
        "chapterId": "chapter-synthetic-map",
        "isCompleted": false
      },
      {
        "chapterId": "chapter-synthetic-route",
        "isCompleted": false
      }
    ]
  }
]
```

Die Ereignisreihenfolge ist autoritativ. `chapter.completed` setzt das
referenzierte Kapitel auf abgeschlossen, `chapter.reopened` wieder auf offen;
das letzte Array-Ereignis derselben Modul- und Kapitelreferenz gewinnt.
`occurredAt` beeinflusst die Reihenfolge nicht.

Module und Kapitel werden ohne Eingabemutation aufsteigend nach ihrer
`position` aus dem Inhaltsvertrag projiziert. Titel und LearningNode-Inhalte
werden nicht kopiert. `progressPercent` ist
`Math.round(completedChapterCount / totalChapterCount * 100)`; bei exakt `.5`
gilt für die nicht negativen Werte die aufwärts gerichtete `Math.round`-Regel.
Bei null Kapiteln ist der Prozentwert `0`. `isCompleted` ist nur wahr, wenn das
Modul mindestens ein Kapitel besitzt und alle Kapitel abgeschlossen sind. Ein
leerer Hub ergibt `[]`; Module mit 100 Prozent bleiben vollständig im Ergebnis.

##### Datenfluss und referenzielle Integrität

```text
LearningProgressService
  ├→ LearningHubService
  │   → LearningHubStorage
  │   → StorageAdapter
  │
  └→ LearningProgressStorage
      → StorageAdapter
      → localStorage
```

`LearningProgressService` verwendet `LearningHubService` ausschließlich zum
Laden des aktuellen Inhaltsstands und zur Prüfung von Modul-, Kapitel- und
Eigentumsreferenzen. Es gibt keine Rückabhängigkeit vom Inhaltsservice und
keine zirkuläre Service-Abhängigkeit. Der Progress-Service stellt
`loadProgress`, `completeChapter({ moduleId, chapterId })` und
`reopenChapter({ moduleId, chapterId })` bereit.

Die stabilen Erfolgsstatus lauten:

| Operation und Fall | `status` | `changed` |
| --- | --- | --- |
| `loadProgress`, fehlender Progress-Key | `empty` | `false` |
| `loadProgress`, vorhandener valider Log | `loaded` | `false` |
| echte Änderung durch `completeChapter` | `chapterCompleted` | `true` |
| `completeChapter` bei abgeschlossenem Kapitel | `chapterAlreadyCompleted` | `false` |
| echte Änderung durch `reopenChapter` | `chapterReopened` | `true` |
| `reopenChapter` bei offenem Kapitel | `chapterAlreadyOpen` | `false` |

Jeder Erfolg enthält defensive Kopien von `progressLog` und dem direkten
Modul-Array `projection`. Fehler enthalten immer `ok: false`, `changed: false`
und einen stabilen `error`; der letzte valide Log und seine Projektion werden
nur mitgeliefert, soweit der Fehlerfall einen sicheren aktuellen Zustand
besitzt.

Wichtige stabile Service-Fehlercodes sind:

| Code | Bedeutung |
| --- | --- |
| `invalidLearningProgressInput` | Ziel-IDs sind formal ungültig; `fieldErrors` benennt die Felder |
| `moduleNotFound` | Zielmodul existiert nicht |
| `chapterNotFound` | Zielkapitel existiert nicht |
| `chapterModuleMismatch` | Zielkapitel gehört nicht zum angegebenen Modul |
| `orphanedProgressModuleReference` | gespeichertes Ereignis verweist auf kein vorhandenes Modul |
| `orphanedProgressChapterReference` | gespeichertes Ereignis verweist auf kein vorhandenes Kapitel |
| `progressChapterModuleMismatch` | gespeichertes Ereignis besitzt eine falsche Modul-Kapitel-Zuordnung |
| `learningProgressEventIdGenerationFailed` | in höchstens fünf Versuchen entstand keine gültige eindeutige Ereignis-ID |
| `learningProgressClockFailed` | injizierte Uhr ist fehlgeschlagen |
| `invalidLearningProgressTimestamp` | Uhrwert ist kein kanonischer UTC-Zeitstempel |
| `invalidLearningProgressState` | vollständiger neuer Log ist nicht vertragsgültig |
| `invalidStoredLearningHub` | geladener Inhaltszustand ist nicht der gültige private Schema-2-Hub |
| `invalidStoredLearningProgress` | geladener Fortschrittszustand ist nicht der gültige private Schema-1-Log |
| `learningProgressStorageUnavailable` | Progress-Storage-Schnittstelle fehlt |
| `learningProgressStorageReadFailed` | Progress-Log konnte nicht gelesen werden |
| `learningProgressStorageWriteFailed` | Progress-Log konnte nicht geschrieben werden |
| `unexpectedLearningHubResult` | Inhaltsservice lieferte kein verwertbares Ergebnis |
| `unexpectedStorageResult` | Progress-Storage lieferte kein verwertbares Ergebnis |
| `learningProgressProjectionFailed` | Projektion konnte nicht sicher erzeugt werden |

Kontrollierte Abhängigkeitsfehler werden mit ihrem stabilen Status und Code
weitergereicht. Kein Fehlerfall löst einen Reparatur-, Lösch- oder
Ersatzschreibzugriff aus.

Jede Mutation:

1. lädt den aktuellen LearningHub über `LearningHubService`;
2. lädt den aktuellen Fortschrittslog;
3. validiert beide vollständigen Zustände;
4. prüft sämtliche bereits gespeicherten Ereignisreferenzen;
5. prüft Existenz und Eigentum der Zielreferenz;
6. leitet den aktuellen Kapitelzustand ausschließlich aus der Arrayreihenfolge
   ab;
7. hängt bei einer echten Zustandsänderung genau ein neues Ereignis an;
8. validiert den vollständigen neuen Log;
9. speichert genau einmal;
10. gibt die neue Projektion zurück.

`moduleId` muss ein vorhandenes LearningModule bezeichnen, `chapterId` ein
vorhandenes LearningChapter, und das Kapitel muss zum angegebenen Modul
gehören. Verwaiste oder falsch zugeordnete gespeicherte Ereignisse führen zu
einem kontrollierten Fehler. Ungültige Daten werden nicht repariert, gelöscht
oder überschrieben.

| Ausgangszustand und Operation | Ergebnis |
| --- | --- |
| offenes Kapitel + `completeChapter` | genau ein `chapter.completed`, `changed: true`, genau ein Save |
| abgeschlossenes Kapitel + `completeChapter` | erfolgreicher No-op, `changed: false`, kein Save |
| abgeschlossenes Kapitel + `reopenChapter` | genau ein `chapter.reopened`, `changed: true`, genau ein Save |
| offenes oder nie abgeschlossenes Kapitel + `reopenChapter` | erfolgreicher No-op, `changed: false`, kein Save |
| nach `chapter.reopened` erneut `completeChapter` | neues `chapter.completed`, `changed: true`, genau ein Save |

No-ops erzeugen weder Ereignis-ID noch Zeitstempel, speichern nicht und
verändern keine Eingaben. Service-Ergebnisse folgen den bestehenden lokalen
Konventionen und liefern je nach Fall strukturierte `ok`-, `status`-,
`changed`-, `error`-, `progressLog`- und `projection`-Informationen.

Neue Ereignis-IDs verwenden im Produktionsdefault das fachliche Präfix
`learning-progress-event` und müssen im vollständigen Log eindeutig sein. Der
injizierbare Generator erhält höchstens fünf Versuche;
Fehler, leere oder ungetrimmte Werte und Kollisionen führen nach der Begrenzung
zu einem kontrollierten Ergebnis ohne Schreibzugriff. Eine injizierbare Uhr
muss einen kanonischen ISO-UTC-Zeitstempel liefern. Auch eine fehlschlagende
oder ungültige Uhr führt zu keinem Save. `occurredAt` bleibt beschreibend; die
Append-Reihenfolge ist fachlich autoritativ.

Es gibt keine öffentlichen Operationen zum Bearbeiten, Entfernen oder
Umsortieren vorhandener Fortschrittsereignisse.

##### UI-Projektion und Fehlerisolation

Der Controller akzeptiert beim Laden ausschließlich die Erfolgsstatus `empty`
und `loaded`. Für Fortschrittsmutationen akzeptiert er exakt
`chapterCompleted` und `chapterReopened` mit `changed: true` sowie
`chapterAlreadyCompleted` und `chapterAlreadyOpen` mit `changed: false`. Ein
gültiger Erfolg wird ohne weiteren Schreibzugriff aus der zurückgegebenen
`projection` übernommen. Obwohl Service-Ergebnisse für andere
Anwendungsschichten auch `progressLog` enthalten, hält oder rendert die
LearningHub-UI ausschließlich die Projektion; Ereignis-IDs und Zeitstempel
gelangen nicht in ihren Zustand.

Vor der Darstellung wird die Projektion anhand stabiler `moduleId`- und
`chapterId`-Zuordnungen vollständig gegen den aktuellen Hub geprüft. Zähler und
Abschlussstatus müssen exakt zu den Kapitelstatus passen. Der Prozentwert muss
eine plausible Ganzzahl zwischen 0 und 100 mit konsistenten 0- und
100-Prozent-Endpunkten sein; der Controller berechnet oder rundet ihn nicht
selbst neu. Arrayindizes verbinden keine Progress- und Inhaltsobjekte.
Ungültige oder unvollständige Projektionen gelten als nicht verfügbar und
werden weder als 0 Prozent dargestellt noch zur Mutation verwendet.

Ein Progress-Fehler blockiert den gültigen Inhaltszustand nicht. Die UI
deaktiviert Fortschrittsaktionen, bietet `loadProgress` als gezielten Retry an
und führt keinen Reparatur-, Lösch- oder Ersatzschreibzugriff aus. Die letzte
valide Projektion bleibt bei einer fehlgeschlagenen Mutation unverändert. Nach
`createModule` und `addChapter` wird sie neu geladen; scheitert dieser Refresh
nach erfolgreicher Inhaltsmutation, bleibt der Inhaltserfolg bestehen und die
vorherige Projektion wird nicht mehr als aktuell ausgegeben. Umbenennungen und
LearningNode-Mutationen verändern die Projektion nicht.

##### Lokale Persistenz und Fehlergrenzen

`createLearningProgressStorage` erhält ausschließlich den gemeinsamen
`StorageAdapter` und stellt `loadLearningProgress` sowie
`saveLearningProgress` unter diesem festen, nicht nutzerkontrollierten Key
bereit:

```text
goldendawn.learningHub.progress.v1
```

Fehlt der Key, liefert ein Lesevorgang jeweils einen frischen privaten, leeren
Log, ohne ihn sofort zu speichern:

```json
{
  "schemaVersion": 1,
  "dataOrigin": "private",
  "events": []
}
```

Ein erfolgreicher Lesevorgang liefert `status: missing` oder `status: found`
und den defensiv geklonten Wert im Feld `progressLog`. Ein erfolgreicher
Schreibvorgang liefert `status: saved`. Fehlende oder unbrauchbare
Adapter-Schnittstellen und formal unerwartete Adapterresultate werden von
Vertrags-, Herkunfts-, Lese-, Schreib- und Quota-Fehlern kontrolliert
unterschieden.

Laden und Speichern validieren den vollständigen Vertrag. Der private
Storage-Pfad akzeptiert ausschließlich `dataOrigin: private`. Synthetische,
beschädigte oder nicht unterstützte gespeicherte Werte werden nicht gelöscht,
überschrieben, repariert oder durch den leeren Initialzustand ersetzt. Es gibt
weder Demo-Import noch Netzwerkzugriff. Rückgaben und an den Adapter übergebene
Werte werden defensiv geklont.

Adapter-Ausnahmen, unerwartete Adapterergebnisse, Verfügbarkeits-, Lese-,
Schreib- und Quota-Fehler werden in kontrollierte stabile Ergebnisse übersetzt.
Fehlermeldungen enthalten keine privaten Modul- oder Kapiteltitel,
LearningNode-Inhalte, vollständigen Logs oder Rohdaten.

##### Append-only-Grenzen und spätere Inhaltslebenszyklen

Append-only ist eine Anwendungsregel des `LearningProgressService`. Technisch
wird bei jeder echten Zustandsänderung der vollständige JSON-Log als Snapshot
in `localStorage` geschrieben. Es gibt keine kryptografische Verkettung,
Signatur oder Manipulationssperre; andere Skripte derselben Origin könnten den
Wert lesen oder verändern. GoldenDawn OS beansprucht damit kein vollständiges
Event Sourcing. Das Modell ist xAPI-inspiriert, aber nicht xAPI-konform, und es
gibt kein LRS.

Multi-Tab-Rennen, Browser-Quota, fehlende Transaktionssperren, fehlende
Verschlüsselung und fehlende Synchronisierung bleiben bekannte Grenzen. Lokale
Browserpersistenz ist weder Cloud-Sicherung noch geräteübergreifende
Speicherung; das Löschen des Browserprofils kann den Log entfernen.

Archivieren und dauerhaftes Löschen sind nicht implementiert. Eine spätere
Archivierung von Modulen oder Kapiteln muss verknüpfte Ereignisse erhalten und
deren Projektionssichtbarkeit festlegen. Dauerhaftes Löschen benötigt zuvor
eine gesonderte Referenz- und Löschrichtlinie für verbundene Ereignisse,
mögliche Tombstones und historische Nachvollziehbarkeit. Stilles
kaskadierendes Löschen oder das bewusste Erzeugen verwaister Ereignisse wird
nicht vorweggenommen.

### v0.2.2 – LichtwaldLog Local MVP

Contract Foundation, private Storage-Foundation, Service-Foundation,
Controller-Foundation sowie isolierte View- und CSS-Foundation des rein lokalen
LichtwaldLogs sind implementiert. Sie umfassen das Schema-1-Modul
`lichtwaldLogContract.js`, den reinen Validator `validateLichtwaldLog`,
synthetische Contract-Tests, `createLichtwaldLogStorage` hinter dem
gemeinsamen `StorageAdapter` sowie `createLichtwaldLogService` als
Anwendungsgrenze und `createLichtwaldLogController` als flüchtige
UI-Koordinationsgrenze und `createLichtwaldLogView` als isolierte DOM-Grenze.
`src/main.js`-Anbindung, Navigation, der vollständig über die Anwendung
bedienbare UI-CRUD- und Fokusfluss, reale Browserintegration, Suche, Filter und
Demo-Integration sind noch nicht implementiert. Vertrag, View, Controller,
Service und Storage führen weder eine externe Aktion noch einen Zugriff durch
`SyncAgent`, `DataAgent` oder `TestAgent` ein.

#### LichtwaldLog – Schema 1

Schema 1 beschreibt einen vollständigen flachen Journalzustand. Der Root
besitzt exakt `schemaVersion`, `dataOrigin`, `featuredEntryId` und `entries`.
Ein Eintrag besitzt exakt `id`, `calendarDate`, `title`, `text` und `tags`.
Alle Felder sind eigene Pflichtfelder; unbekannte Root- und Entry-Felder werden
abgelehnt.

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "featuredEntryId": "lichtwald-entry-example",
  "entries": [
    {
      "id": "lichtwald-entry-example",
      "calendarDate": "2026-07-26",
      "title": "Vollständig synthetischer Testmoment",
      "text": "Dieser Inhalt wurde ausschließlich als Testfixture erfunden.",
      "tags": ["Natur", "Ruhe"]
    }
  ]
}
```

##### Root-Felder

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Zahl | exakt `1` |
| `dataOrigin` | String | exakt `private` oder `synthetic` |
| `featuredEntryId` | String oder `null` | immer vorhanden; bei String bereits getrimmt, 1 bis 100 Zeichen und exakte Referenz auf einen vorhandenen Eintrag |
| `entries` | Array | dichtes Vertragsarray, darf leer sein, höchstens 1.000 Einträge |

Bei einem leeren `entries`-Array muss `featuredEntryId` `null` sein. Der
allgemeine Contract akzeptiert private und synthetische Zustände. Der
implementierte private Storage akzeptiert an seiner Lese- und Schreibgrenze
ausschließlich `dataOrigin: private`.

##### Entry-Felder

| Feld | Typ | Regel |
| --- | --- | --- |
| `id` | String | bereits getrimmt, 1 bis 100 Zeichen, innerhalb von `entries` exakt und case-sensitive eindeutig |
| `calendarDate` | String | existierendes gregorianisches Datum im exakten Format `YYYY-MM-DD`, Jahr `0001` bis `9999` |
| `title` | String | bereits getrimmt, 1 bis 120 Zeichen |
| `text` | String | bereits getrimmt, 1 bis 10.000 Zeichen |
| `tags` | Array | dichtes Vertragsarray, 0 bis 8 Strings |
| `tags[]` | String | bereits getrimmt, 1 bis 30 Zeichen, je Eintrag case-insensitive eindeutig |

Alle Zeichenlimits beziehen sich auf JavaScripts `String.length`. Entry-IDs
und die Referenz in `featuredEntryId` sind case-sensitive; zwei IDs, die sich
nur in Groß- und Kleinschreibung unterscheiden, sind daher verschieden. Das
Datum wird rein arithmetisch nach den gregorianischen Schaltjahrregeln geprüft.
Der Validator verwendet dafür weder `Date` noch UTC- oder Zeitzonenumwandlung.
Auch ein gültiges zukünftiges Kalenderdatum ist vertragskonform.

`text` bleibt als Nutzereingabe unverändert. Zeilenumbrüche sowie HTML- oder
Script-ähnliche Zeichenfolgen sind zulässiger Stringinhalt; der Validator
bereinigt, interpretiert oder normalisiert sie nicht. Eine spätere View muss
diesen Inhalt sicher als Text darstellen. Tags verwenden keine Whitelist und
werden nicht an Kommata aufgeteilt. Ihre Eindeutigkeit wird ohne Mutation
case-insensitive geprüft, während die eingegebene Schreibweise erhalten
bleibt.

##### Arraycontainer für `entries` und `tags`

`entries` und jedes `tags`-Feld sind dichte Vertragsarrays. Ihr direkter
Prototyp muss entweder `Array.prototype` oder `null` sein. Ihre Länge muss als
nicht negative sichere Ganzzahl lesbar sein. Neben der eigenen
`length`-Eigenschaft sind ausschließlich kanonische eigene Arraypositionen
zulässig. Eine solche Position ist ein String-Key, der exakt der dezimalen
Darstellung seines Index entspricht und innerhalb der Arraylänge liegt.
Zusätzliche eigene Stringfelder wie `note` oder `01`, nicht enumerierbare
Stringfelder und eigene Symbolfelder sind nicht Teil des Schema-1-Vertrags.

Zusätzliche Arrayfelder erzeugen je betroffenem Container genau einen
redigierten `unknownProperty`-Fehler an `$.entries.*` beziehungsweise
`$.entries[n].tags.*`. Ein benutzerdefinierter direkter Prototyp oder ein nicht
sicher inspizierbarer Container erzeugt stattdessen `invalidEntries` an
`$.entries` beziehungsweise `invalidTags` an `$.entries[n].tags`. Feldnamen,
Symbolbeschreibungen, Werte und fremde Exception-Meldungen werden nicht in das
Fehlerresultat übernommen.

Bei mehr als 1.000 Entries beziehungsweise mehr als acht Tags darf die
vollständige Own-Key-Aufzählung bewusst übersprungen werden, damit die Prüfung
begrenzt bleibt. Die kontrollierte Prototyp- und Längenprüfung findet weiterhin
statt; für die überschrittene Containergrenze reicht der bestehende
`entryLimitExceeded`- beziehungsweise `tagLimitExceeded`-Fehler aus. Dadurch
werden zusätzliche Felder eines überlangen Arrays nicht vertragsgültig: Der
Container ist bereits wegen seiner überschrittenen Grenze ungültig.

Reguläre, mit `JSON.parse` erzeugte und bisher vertragsgültige Snapshots bleiben
kompatibel. Das Array-Hardening ändert weder `schemaVersion: 1` noch den
Storage-Key `goldendawn.lichtwaldLog.content.v1` oder dessen
Persistenznamespace `v1`; eine Migration ist nicht erforderlich.

##### Fokusmodell

`featuredEntryId` ist die einzige Fokusinformation des Vertrags. Der Eintrag
wird weder in einem zweiten Feld kopiert noch durch ein `isFeatured`-Flag
markiert. `null` bedeutet, dass kein Eintrag fokussiert ist. Jeder String muss
exakt auf eine vorhandene Entry-ID verweisen; verwaiste Referenzen sind
ungültig.

Der implementierte Service setzt `featuredEntryId` beim Löschen des aktuell
fokussierten Eintrags innerhalb desselben vollständig validierten Kandidaten auf
`null`. Ein zwischenzeitlich persistierter Zustand mit verwaister Referenz ist
nicht zulässig. Die Contract Foundation definiert diese Invariante; die
Service-Foundation setzt sie atomar in genau einer erfolgreichen Mutation um.

##### Validierungsverhalten und Fehlercodes

`validateLichtwaldLog` ist rein, verändert die Eingabe nicht und liefert
entweder `{ ok: true, errors: [] }` oder `{ ok: false, errors }`. Jeder Fehler
besitzt die Form `{ code, path, message }`. Der Validator sammelt unabhängig
prüfbare Fehler in stabiler Reihenfolge, ohne Rohwerte oder private Inhalte in
Fehlermeldungen aufzunehmen.

Root und einzelne Entries müssen einfache Objekte mit `Object.prototype` oder
ohne Prototyp sein; Arrays, Klasseninstanzen und Objekte mit
benutzerdefiniertem Prototyp werden abgelehnt. Die `entries`- und
`tags`-Container folgen zusätzlich der oben beschriebenen dichten Arrayform.
Fehlende Pflichtfelder, unbekannte String- oder Symbolfelder, ungültige
Arraypositionen und nicht lesbare Strukturen werden kontrolliert als Fehler
gemeldet. Die Prüfung trimmt, sortiert, dedupliziert oder ergänzt keine Werte.

| Code | Bedeutung |
| --- | --- |
| `invalidLichtwaldLog` | Der Root ist kein zulässiges Vertragsobjekt. |
| `unsupportedSchemaVersion` | `schemaVersion` ist nicht exakt `1`. |
| `invalidDataOrigin` | `dataOrigin` ist weder `private` noch `synthetic`. |
| `invalidEntries` | `entries` ist kein Array mit zulässigem direktem Prototyp oder sein Container ist nicht sicher inspizierbar. |
| `entryLimitExceeded` | `entries` enthält mehr als 1.000 Positionen. |
| `invalidEntry` | Eine Entry-Position enthält kein zulässiges Vertragsobjekt. |
| `unknownProperty` | Root, Entry, `entries` oder `tags` enthält ein nicht erlaubtes eigenes String- oder Symbolfeld. |
| `missingProperty` | Ein vorgeschriebenes eigenes Feld fehlt. |
| `invalidId` | Entry-ID oder Fokus-ID ist kein nicht leerer, bereits getrimmter String. |
| `idTooLong` | Entry-ID oder Fokus-ID überschreitet 100 Zeichen. |
| `duplicateEntryId` | Eine exakte, case-sensitive Entry-ID kommt mehrfach vor. |
| `invalidCalendarDate` | Das Kalenderdatum verletzt Format, Jahresbereich oder gregorianische Datumsregeln. |
| `invalidTitle` | Der Titel ist kein nicht leerer, bereits getrimmter String. |
| `titleTooLong` | Der Titel überschreitet 120 Zeichen. |
| `invalidText` | Der Text ist kein nicht leerer, bereits getrimmter String. |
| `textTooLong` | Der Text überschreitet 10.000 Zeichen. |
| `invalidTags` | `tags` ist kein Array mit zulässigem direktem Prototyp oder sein Container ist nicht sicher inspizierbar. |
| `tagLimitExceeded` | Ein Eintrag besitzt mehr als acht Tag-Positionen. |
| `invalidTag` | Eine Tag-Position ist kein nicht leerer, bereits getrimmter String. |
| `tagTooLong` | Ein Tag überschreitet 30 Zeichen. |
| `duplicateTag` | Ein Tag kommt im selben Eintrag case-insensitive mehrfach vor. |
| `featuredEntryNotFound` | Die gültig geformte Fokus-ID referenziert keine gültige vorhandene Entry-ID. |

##### Implementierte LichtwaldLog-Controller-Foundation

Die Controller-Foundation ergänzt den lokalen Pfad, ohne den Schema-1- oder
Persistenzvertrag zu verändern:

```text
LichtwaldLogView
  → LichtwaldLogController
  → LichtwaldLogService
  → LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

Die Factory erhält ausschließlich Service, View-Port und optionalen Scheduler:

```js
createLichtwaldLogController({
  lichtwaldLogService,
  lichtwaldLogView,
  scheduleTask,
})
```

Ihre Rückgabe ist eingefroren und enthält exakt:

```text
open
close
```

Der injizierte View-Port ist ausschließlich auf `render(viewModel, actions)`
und `unmount()` begrenzt. `createLichtwaldLogView(rootElement)` implementiert
ihn als isolierte DOM-Foundation und liefert eine eingefrorene API mit exakt
den eigenen Data-Properties `render` und `unmount`. Jeder Render erhält
dieselbe eingefrorene Action-API mit exakt:

```text
onRetryLoad
onSelectEntry
onBackToOverview
onOpenCreateEntryForm
onOpenUpdateEntryForm
onUpdateFormField
onSubmitForm
onCancelForm
onRequestDeleteEntry
onCancelDeleteEntry
onConfirmDeleteEntry
onSetFeaturedEntry
```

Das View-Modell projiziert ausschließlich die Phasen `loading`, `empty`,
`ready`, `loadError` und `mutating`, die Eintrags- und Fokusprojektion sowie
flüchtige Auswahl-, Formular-, Löschbestätigungs-, Fokusmutations-, Status-,
Fehler- und Fokuszielzustände. Es wird für jeden Render frisch erzeugt, tief
eingefroren und von internen sowie früheren Referenzen entkoppelt. Der rohe
Schema-1-Root, `schemaVersion`, `dataOrigin`, Service-, Storage- und
Adapterresultate sowie Lifecycle- und Operationstokens werden nicht an die View
weitergegeben. Ein ausgewählter Entry wird nicht als zweite Inhaltskopie im
View-Modell gehalten.

Der intern gehaltene LichtwaldLog-Snapshot ist ausschließlich eine flüchtige
UI- und Reconciliation-Projektion. Jeder vom Service gelieferte Snapshot wird
erneut vollständig mit `validateLichtwaldLog` geprüft, tief entkoppelt und nur
mit `dataOrigin: private` akzeptiert. Synthetische oder unvollständige
Snapshots werden kontrolliert abgelehnt. Der Controller konstruiert aus seiner
Projektion niemals einen Persistenzkandidaten. Storage bleibt die einzige
veränderliche Wahrheit; der Service bleibt die autoritative fachliche
Operationsgrenze.

Pro akzeptierter Benutzerintention wird exakt eine passende Servicemethode
aufgerufen:

- Initiales Laden und ein ausdrücklich akzeptierter Retry rufen jeweils einmal
  `loadLog` auf.
- Ein Create- oder Update-Submit ruft einmal `createEntry(input)`
  beziehungsweise `updateEntry(entryId, input)` auf.
- Eine bestätigte Löschung ruft einmal `deleteEntry(entryId)` auf.
- Fokus setzen oder entfernen ruft einmal
  `setFeaturedEntry(entryIdOrNull)` auf.
- Auswahl, Rückkehr zur Übersicht, Öffnen und Ändern eines Formulars,
  Formularabbruch sowie Anfordern und Abbrechen einer Löschbestätigung rufen
  keinen Service auf und bleiben schreibfrei.

Nach Mutationen erfolgt kein zusätzlicher `loadLog`-Aufruf, kein automatischer
Retry und kein Storage-Fallback. Der Controller verändert Inhalte, Delete-Ziele
oder Fokus nicht optimistisch, sondern ersetzt seine Projektion erst mit einem
vollständig akzeptierten Service-Snapshot. Ein scheinbar identisches Update
oder Fokusziel wird nicht controllerseitig abgekürzt; ausschließlich der
Service entscheidet anhand des aktuellen Storagezustands über einen
schreibfreien No-op.

Auswahl-, Update-, Delete- und Fokusziele werden ausschließlich als bereits
getrimmte, exakte und case-sensitive IDs aus dem aktuellen vertrauenswürdigen
Snapshot akzeptiert. `onSetFeaturedEntry` erhält den ausdrücklichen Endzustand
als Entry-ID oder `null`; es existiert weder eine Toggle- noch eine zusätzliche
Clear-Aktion. Akzeptierte Service-Snapshots ersetzen die alte Projektion
vollständig. Ihre Entry- und Tag-Reihenfolge bleibt unverändert.

Serviceergebnisse werden ausschließlich über erlaubte eigene Data-Properties
und dokumentierte Status-Code-Kombinationen geprüft. Controllerfehler,
Feldfehler und Statusmeldungen stammen aus festen Allowlists. Private Werte,
IDs, Tags, fremde Getter-, Proxy-, Service-, Dependency- oder
Exception-Meldungen werden nicht in Feedback, Logs oder Console-Ausgaben
übernommen. Jeder View-Entry, jedes Tag-Array, jeder Formularwert und jedes
Fokusziel ist defensiv entkoppelt.

Gültiger LichtwaldLog-Text bleibt ungeparster, nicht vertrauenswürdiger Plain
Text. Der Controller interpretiert, bereinigt oder interpoliert HTML-, Script-
oder markupähnliche Inhalte nicht. Die isolierte View gibt ihn ausschließlich
über `textContent`, `createTextNode`, Formcontrol-Werte und feste Attribute
sicher aus.

Die Controller-Foundation ändert weder den Read-Preflight noch das
500.000-UTF-16-Codeeinheiten-Limit. Browser-Quota, unverschlüsselter
Same-Origin-Zugriff, TOCTOU- und Multi-Tab-Verhalten bleiben ebenfalls
unverändert.

##### Implementierte isolierte LichtwaldLog-View-Foundation

`createLichtwaldLogView(rootElement)` liest ausschließlich das defensive,
tief eingefrorene Controller-View-Modell und die oben dokumentierte
zwölfteilige Action-API. Sie liest weder `schemaVersion`, `dataOrigin` noch den
rohen Schema-1-Root und führt keine zweite Vertrags-, Service- oder
Storagevalidierung ein. Jeder Render baut einen frischen DOM-Baum auf und
bewahrt Entry- und Tag-Reihenfolge sowie die gespeicherte Schreibweise.

Private Titel, Texte, Tags und Formwerte bleiben ungeparster Plain Text.
Entry-IDs dienen ausschließlich unverändert als Action-Ziele in Closures und
renderlokalen Maps. Sie werden weder angezeigt noch in DOM-/ARIA-IDs,
Selektoren, Klassen, `data-*`-Attribute, URLs oder View-eigene Meldungen
übernommen. Die View verwendet keine dynamische HTML- oder Markup-Auswertung.

Die Create-Submitform ist exakt:

```js
{
  type: 'createEntry',
  calendarDate,
  title,
  text,
  tags,
}
```

Die Update-Submitform ist exakt:

```js
{
  type: 'updateEntry',
  entryId,
  calendarDate,
  title,
  text,
  tags,
}
```

Die Update-ID stammt ausschließlich aus dem gebundenen View-Modell. Tags
werden über getrennte Eingabefelder als jeweils neues dichtes Standard-Array
übergeben. Die View trimmt, splittet, sortiert, dedupliziert oder normalisiert
sie nicht und entfernt insbesondere keine leeren Draftpositionen. Kommas
bleiben regulärer Bestandteil eines einzelnen Tagstrings.

Lade-, Leer-, Busy-, Erfolgs-, Notice-, Validierungs- und Fehlerzustände werden
zugänglich dargestellt. Nach dem vollständigen DOM-Austausch löst die View die
Controller-Fokusziele `heading`, `entry`, `formField`, `formAlert`,
`formTrigger`, `deleteConfirmation`, `deleteAlert`, `featuredAlert` und
`status` kontrolliert auf. Fokusaktionen verwenden ausschließlich den
ausdrücklichen Endzustand als exakte Entry-ID oder `null`; die View projiziert
Inhalt, Löschung und Fokus nicht optimistisch.

`unmount()` entfernt sämtliche privaten Inhalte und `aria-busy` aus dem
dedizierten Root und verwirft nur flüchtige Fokus- und Caret-Metadaten. Die
View bildet keine persistente oder fachlich autoritative Zustandsquelle;
Storage und Service bleiben die autoritativen Grenzen. Das responsive
Modul-CSS besitzt Reduced-Motion-Regeln, ist jedoch ebenso wie die View noch
nicht in `src/main.js` eingebunden. Der bestehende Storage-Key, das
500.000-Codeeinheiten-Limit, Browser-Quota, Read-Preflight, TOCTOU- und
Multi-Tab-Grenzen bleiben unverändert.

##### Implementierte LichtwaldLog-Service-Foundation

Die Service-Foundation führt keine neue Datenquelle ein. Ihr vollständiger
lokaler Pfad lautet:

```text
LichtwaldLogService
  → LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

Die Factory wird ausschließlich mit dem fachlichen Storage und dem optionalen
ID-Generator erzeugt:

```js
createLichtwaldLogService({
  lichtwaldLogStorage,
  generateLichtwaldLogEntryId,
})
```

Ihre Rückgabe ist eingefroren und enthält exakt diese fünf Operationen:

```js
loadLog()
createEntry({ calendarDate, title, text, tags })
updateEntry(entryId, { calendarDate, title, text, tags })
deleteEntry(entryId)
setFeaturedEntry(entryIdOrNull)
```

`setFeaturedEntry(null)` entfernt den Fokus. Eine zusätzliche öffentliche
Clear- oder Toggle-Methode wird nicht angeboten.

###### Autoritativer Zustand und Erfolgsresultate

`LichtwaldLogStorage` bleibt die einzige veränderliche Wahrheit. Der Service
hält keinen langlebigen Cache. Nach erfolgreicher Eingabeprüfung lädt jede
gültige Mutation den aktuellen Zustand an ihrer Dependency-Grenze genau einmal
neu. Akzeptiert werden ausschließlich die dokumentierten Storage-Erfolge
`missing` und `found` mit einem vollständig gültigen privaten
Schema-1-Snapshot. Auch `loadLog` prüft und entkoppelt den erhaltenen Zustand
erneut.

Die Ladeerfolge enthalten keinen Initialisierungsschreibzugriff:

| Storage-Fall | `status` | Weitere Ergebnisfelder |
| --- | --- | --- |
| Key fehlt | `empty` | `ok: true`, `initialized: false`, frischer privater `lichtwaldLog` |
| gültiger privater Bestand | `loaded` | `ok: true`, `initialized: false`, geladener privater `lichtwaldLog` |

Mutationserfolge verwenden exakt diese Status- und Nutzdatenfelder:

| Operation und Fall | `status` | `changed` | Weitere Ergebnisfelder |
| --- | --- | --- | --- |
| Eintrag erstellt | `entryCreated` | `true` | `createdEntry`, `lichtwaldLog` |
| Eintrag tatsächlich oder inhaltlich identisch aktualisiert | `entryUpdated` | `true` oder `false` | `updatedEntry`, `lichtwaldLog` |
| Eintrag gelöscht | `entryDeleted` | `true` | `deletedEntryId`, `focusCleared`, `lichtwaldLog` |
| Fokus tatsächlich oder inhaltlich identisch geändert | `featuredEntryUpdated` | `true` oder `false` | `featuredEntryId`, `lichtwaldLog` |

Alle Snapshots und Einzeleinträge in Rückgaben sowie jedes Save-Argument sind
tief von Formeingaben, Storage-Resultaten, vorherigen Snapshots, internen
Mutationskandidaten, anderen Rückgaben und späteren Serviceaufrufen entkoppelt.
Gültige tief eingefrorene Eingaben und Storage-Zustände werden nicht mutiert.

###### Eingabevalidierung und Normalisierung

Form- und Ziel-ID-Eingaben werden vor dem ersten Storage-Zugriff validiert.
Ungültige Eingaben lösen weder Load noch Save oder ID-Generator aus. Der Service
liest ausschließlich die erwarteten eigenen Formularfelder und konstruiert
persistierte Entries aus einer festen Feld-Allowlist; zusätzliche Felder können
weder ID noch Herkunft oder andere Vertragswerte überschreiben.

Für `calendarDate`, `title` und `text` muss der Eingabewert ein String
sein. Der Service trimmt nur äußere Whitespaces; interne Whitespaces und
Zeilenumbrüche bleiben erhalten. Die Längenprüfung verwendet die exportierten
Vertragsgrenzen. Anschließend wird das Kalenderdatum über die vorhandene
`isValidCalendarDate`-Prüfung rein arithmetisch geprüft. Der Service verwendet
weder `Date`-Parsing noch UTC- oder Zeitzonenumwandlung.

`tags` muss ein dichtes Array mit direktem Prototyp `Array.prototype` oder
`null` sein und darf höchstens acht Positionen enthalten. Jede Position muss
ein String sein, wird außen getrimmt und muss danach die vorhandene
Vertragslänge einhalten. Duplikate werden nach der Normalisierung
case-insensitive abgelehnt. Reihenfolge und Schreibweise gültiger Tags bleiben
erhalten; der Service teilt nicht an Kommata, sortiert nicht, dedupliziert nicht
und entfernt keine Position stillschweigend. Sparse Arrays, zusätzliche eigene
Arrayfelder, geerbte Ersatzpositionen, ungeeignete Prototypen sowie nicht sicher
lesbare Getter-, Proxy- oder Reflection-Strukturen werden kontrolliert
abgelehnt.

Ziel-IDs für Update, Delete und Fokus müssen nicht leer, bereits getrimmt und
höchstens 100 Zeichen lang sein. Sie werden nicht automatisch normalisiert,
sondern exakt und case-sensitive aufgelöst. `null` ist ausschließlich für
`setFeaturedEntry` erlaubt.

###### ID-Erzeugung und Kapazitätsgrenze

Der Produktionsdefault erzeugt
`lichtwald-entry-${crypto.randomUUID()}`. Eine generierte ID muss ein nicht
leerer, bereits getrimmter String von höchstens 100 Zeichen und im aktuellen
`entries`-Array exakt sowie case-sensitive eindeutig sein. Ungültige,
überlange, kollidierende und werfende Generatorresultate teilen sich insgesamt
höchstens fünf Versuche. Danach endet Create kontrolliert mit
`generationFailed` / `lichtwaldLogEntryIdGenerationFailed` und ohne Save.

Der Generator wird erst nach erfolgreicher Formvalidierung, autoritativem Load
und Kapazitätsprüfung aufgerufen. Aus 999 Einträgen darf der 1.000. Eintrag
entstehen. Bei bereits 1.000 Einträgen folgt `limitReached` /
`lichtwaldLogEntryLimitReached`, ohne Generator- oder Save-Aufruf.

###### Mutations- und No-op-Semantik

Jede echte Mutation erzeugt ohne Eingabe- oder Bestandsmutation einen neuen
vollständigen privaten Zustand, validiert ihn mit `validateLichtwaldLog`,
verlangt weiterhin `dataOrigin: private`, ruft an der Servicegrenze genau
einmal `saveLichtwaldLog` auf und gibt den Kandidaten erst nach bestätigtem
`status: saved` als neuen Zustand zurück.

- Create hängt den neuen Entry am Ende des vorhandenen Arrays an, sortiert
  nicht nach Kalenderdatum und verändert `featuredEntryId` nicht.
- Update ersetzt Kalenderdatum, Titel, Text und Tags vollständig. Die ID,
  Arrayposition und eine passende Fokusreferenz bleiben erhalten. Sind alle
  normalisierten fachlichen Werte identisch, bleibt der Erfolgsstatus
  `entryUpdated` bei `changed: false` und ohne Save.
- Delete behandelt ein unbekanntes Ziel als `notFound`, nicht als
  idempotenten Erfolg. Die Reihenfolge der übrigen Entries bleibt erhalten.
  Wird der fokussierte Entry gelöscht, werden Entry und Fokus im selben
  Kandidaten geändert, vollständig validiert und genau einmal gespeichert.
  Ein verwaister Zwischenzustand wird niemals persistiert.
- Ein nicht-null Fokus darf nur auf eine vorhandene exakte Entry-ID gesetzt
  werden. `null` entfernt den Fokus. Ein identischer Fokus oder das erneute
  Entfernen eines bereits leeren Fokus liefert
  `featuredEntryUpdated` / `changed: false` ohne Save. Fokusinformation
  bleibt ausschließlich in `featuredEntryId`; ein `isFeatured`-Feld oder
  eine Inhaltskopie entsteht nicht.

###### Kontrollierte Servicefehler

Fehler aus Mutationsoperationen haben diese gemeinsame Form:

```js
{
  ok: false,
  status,
  changed: false,
  lichtwaldLog: previousTrustedSnapshotOrNull,
  error: {
    code,
    message,
    fieldErrors,
  },
}
```

`fieldErrors` ist ausschließlich bei Eingabefehlern vorhanden. Vor einem
erfolgreichen Load ist `lichtwaldLog: null`. Nach einem erfolgreichen Load
darf ein vollständig entkoppelter Clone des vorherigen vertrauenswürdigen
Snapshots zurückgegeben werden. Nach einem fehlgeschlagenen Save wird niemals
der nicht persistierte Kandidat als autoritativ ausgegeben. Das explizite
`lichtwaldLog`-Nutzdatenfeld bleibt von der redigierten `error`-Struktur
getrennt.

Mindestens diese servicespezifischen Status-Code-Paare sind stabil:

| Fall | `status` | `code` |
| --- | --- | --- |
| ungültige Form- oder Ziel-ID-Eingabe | `validationFailed` | `invalidLichtwaldLogInput` |
| Eintragsgrenze bereits erreicht | `limitReached` | `lichtwaldLogEntryLimitReached` |
| Ziel nicht gefunden | `notFound` | `lichtwaldLogEntryNotFound` |
| ID-Erzeugung nach fünf Versuchen gescheitert | `generationFailed` | `lichtwaldLogEntryIdGenerationFailed` |
| intern erzeugter Gesamtzustand ungültig | `validationFailed` | `invalidLichtwaldLogState` |
| Storage-Abhängigkeit fehlt | `unavailable` | `lichtwaldLogStorageUnavailable` |
| geworfener Lesezugriff | `readFailed` | `lichtwaldLogStorageReadFailed` |
| geworfener Schreibzugriff | `writeFailed` | `lichtwaldLogStorageWriteFailed` |
| unbekanntes oder widersprüchliches Storage-Resultat | `storageFailed` | `unexpectedStorageResult` |

Bekannte dokumentierte Status-Code-Paare des LichtwaldLog-Storage dürfen nur
über eine ausdrückliche Allowlist unterscheidbar bleiben. Der Service verwendet
für jeden Fall eigene statische Meldungen und kopiert niemals fremde Storage-,
Adapter- oder Exception-Meldungen. Formwerte, Entry- und Fokus-IDs, Tags,
Generatorwerte, Getter- oder Proxy-Sentinels und fremde Fehlertexte gelangen
weder in `error` noch in Logs oder Console-Ausgaben.

Der Service serialisiert nicht, prüft nicht selbst die
500.000-UTF-16-Codeeinheiten-Grenze, greift weder auf `StorageAdapter` noch
auf `localStorage` zu und führt keinen zusätzlichen Read-Preflight aus. Der
vorhandene `saveLichtwaldLog`-Pfad behält seinen eigenen Preflight. Deshalb
kann eine echte Mutation trotz genau eines Service-Loads und eines
Service-Saves auf Adapterebene zusätzliche Reads ausführen. Browser-Quota,
unverschlüsselter Same-Origin-Zugriff, TOCTOU- und Multi-Tab-Rennen bleiben
unveränderte Grenzen.

##### Implementierte private LichtwaldLog-Persistenz und Sicherheitsgrenzen

Die private Storage-Foundation verwendet ausschließlich diesen Datenfluss:

```text
LichtwaldLogStorage
  → StorageAdapter
  → localStorage
```

`LICHTWALD_LOG_STORAGE_KEY` ist fest auf
`goldendawn.lichtwaldLog.content.v1` gesetzt. Das `v1` bezeichnet nur den
Persistenznamespace und wird unabhängig vom fachlichen `schemaVersion: 1`
versioniert. Der gespeicherte Wert ist unmittelbar der vollständige
Schema-1-Root. Es gibt weder ein zweites Envelope noch getrennte Keys für
`entries` und `featuredEntryId`. Dadurch bleibt die Fokusreferenz Bestandteil
desselben vollständig validierten JSON-Snapshots.

`LICHTWALD_LOG_MAX_SERIALIZED_LENGTH` ist exakt `500_000`. Gemessen wird die
tatsächliche, vom gemeinsamen `StorageAdapter` erzeugte JSON-Zeichenfolge mit
JavaScripts `String.length`, also in UTF-16-Codeeinheiten einschließlich der
von `JSON.stringify` erzeugten JSON-Escapes. Ein Wert mit exakt 500.000
Codeeinheiten ist erlaubt; jeder größere Wert wird kontrolliert abgelehnt.
Diese Grenze ist eine Anwendungsgrenze und keine Garantie für die
browserabhängige Storage-Quota. Ein `QuotaExceededError` bleibt deshalb ein
getrennter technischer Fehlerfall.

Der gemeinsame Adapter unterstützt dafür rückwärtskompatibel:

```text
readJson(key, options?)
writeJson(key, value, options?)
```

Ohne `options` beziehungsweise mit `undefined` bleibt das bisherige Verhalten
aller bestehenden Aufrufer unverändert. Wird `options` angegeben, muss
`options.maxSerializedLength` eine positive sichere Ganzzahl sein. Eine
ungültige Konfiguration wird vor jedem Storage- oder Serialisierungszugriff als
`invalidLimit` / `invalidStorageLimit` abgelehnt.

Beim Lesen ruft der Adapter `getItem` kontrolliert auf und behandelt einen
fehlenden Key weiterhin als `missing`. Einen vorhandenen String prüft er vor
`JSON.parse` anhand seiner `String.length`. Eine Überschreitung liefert
`sizeLimitExceeded` / `storageSizeLimitExceeded`, ohne den Inhalt zu parsen.
Deshalb hat dieses Ergebnis auch für übergroßes ungültiges JSON Vorrang vor
`invalidJson`.

Beim Schreiben serialisiert der Adapter den Wert exakt einmal mit
`JSON.stringify`. Nach einem kontrollierten Serialisierungsfehler prüft er die
tatsächliche Zeichenfolge vor `setItem`. Eine Überschreitung liefert ebenfalls
`sizeLimitExceeded` / `storageSizeLimitExceeded`; `setItem` wird in diesem Fall
nicht aufgerufen. Erst ein Wert innerhalb des Limits führt zu genau einem
`setItem`-Aufruf. Die JSON-Serialisierung bleibt damit vollständig im
gemeinsamen Adapter und wird im LichtwaldLog-Storage nicht dupliziert.

Die bestehende Semantik von `removeJsonIfUnchanged` bleibt unverändert. Für
`readJson`, `writeJson` und `removeJsonIfUnchanged` gilt zusätzlich: Lässt sich
der `name` eines gefangenen Fehlerobjekts nicht sicher lesen, entkommt keine
Exception. Der Adapter fällt kontrolliert auf den allgemeinen Lese-, Schreib-
beziehungsweise Entfernungsfehler zurück.

`createLichtwaldLogStorage(storageAdapter)` gibt eine eingefrorene API mit
exakt diesen beiden Methoden zurück:

```text
loadLichtwaldLog()
saveLichtwaldLog(lichtwaldLog)
```

Frei wählbare Keys und Methoden für Delete, Clear, Reset, Import, Export,
Migration, Seeding, Append oder Sync werden nicht angeboten. Ein fehlender Key
liefert bei jedem Aufruf ohne Schreibzugriff einen frischen privaten
Leerzustand:

```json
{
  "ok": true,
  "status": "missing",
  "lichtwaldLog": {
    "schemaVersion": 1,
    "dataOrigin": "private",
    "featuredEntryId": null,
    "entries": []
  }
}
```

Ein vorhandener Wert wird mit dem festen Größenlimit geladen, vollständig mit
`validateLichtwaldLog` validiert und zusätzlich auf `dataOrigin: private`
geprüft. Danach wird er defensiv tief geklont, als Clone erneut vollständig
validiert und ausschließlich als detached Clone zurückgegeben. Der Erfolg hat
`status: found` und enthält den Clone in `lichtwaldLog`. Synthetische,
beschädigte, inkompatible oder übergroße Bestände werden dabei weder
umklassifiziert noch repariert, gelöscht oder überschrieben.

`saveLichtwaldLog` validiert zuerst den vollständigen Kandidaten und verlangt
die private Herkunft. Danach wird der Kandidat defensiv tief geklont, als Clone
erneut vollständig validiert und erneut auf private Herkunft geprüft. Erst
danach werden die benötigten Adaptermethoden geprüft und der bestehende feste
Key mit demselben Größenlimit gelesen. Jeder Preflight-Fehler beendet die
Operation ohne Schreibzugriff. Nur ein fehlender Key oder ein vollständig
valider privater Bestand erlaubt den anschließenden Full-Snapshot-Write des
validierten Clones mit festem Key und festem Limit. Ein erfolgreicher Save
liefert `{ ok: true, status: "saved" }`.

Der Read-Preflight schützt erkennbare synthetische, beschädigte, inkompatible,
übergroße oder nicht sicher lesbare Rohwerte vor automatischem Überschreiben.
Er ist keine Transaktion, kein Compare-and-Swap, kein Lock und verhindert
weder TOCTOU- noch Multi-Tab-Rennen. Die Storage-Foundation führt keine
Reparatur, Migration, Demo-Übernahme oder automatische Löschung durch.

Die domänenspezifische Fehlergrenze erkennt nur fest erlaubte
Status-Code-Paare des gemeinsamen Adapters und verwendet eigene statische
Meldungen. Insbesondere gelten:

| Fall | `status` | `code` |
| --- | --- | --- |
| ungültige gespeicherte Vertragsdaten | `invalidStoredData` | `invalidLichtwaldLogData` |
| nicht private gespeicherte Daten | `invalidStoredData` | `privateLichtwaldLogRequired` |
| ungültiger Save-Kandidat | `validationFailed` | `invalidLichtwaldLogData` |
| nicht privater Save-Kandidat | `validationFailed` | `privateLichtwaldLogRequired` |
| fehlende Adaptermethode | `unavailable` | `storageAdapterUnavailable` |
| geworfenes, widersprüchliches, unbekanntes oder formal unbrauchbares Adapterresultat | `storageFailed` | `unexpectedStorageResult` |

Bekannte technische Adapterfehler einschließlich ungültiger Keys oder Limits,
Unavailable-, Read-, Invalid-JSON-, Größen-, Serialisierungs-, Quota- und
Write-Fehlern behalten ihr dokumentiertes Status-Code-Paar, erhalten an der
Domänengrenze aber ausschließlich statische LichtwaldLog-Meldungen. Entry-IDs,
`featuredEntryId`, Titel, Texte, Tags, vollständige JSON-Werte, tatsächliche
gespeicherte Größen, fremde Adapter- oder `DOMException`-Meldungen, Stacktraces
und Validator-Rohwerte werden weder in Fehlern noch in Logs ausgegeben.

`dataOrigin` bleibt eine fachliche Klassifikation und ist weder
Authentifizierung noch Zugriffsschutz oder Verschlüsselung. `localStorage`
liegt unverschlüsselt im aktuellen Browserprofil, kann von JavaScript derselben
Origin gelesen oder verändert werden, besitzt browserabhängige Quoten und kann
durch das Löschen des Browserprofils verloren gehen. Die Foundation bietet
keine Zugriffskontrolle, Integritätsgarantie, Transaktion, Multi-Tab-Sperre,
Cloud-Sicherung oder geräteübergreifende Synchronisierung.

Repository und automatisierte Tests verwenden ausschließlich klar
gekennzeichnete, unabhängig erfundene synthetische Inhalte. Private
Journaltexte dürfen nicht als Fixture, Demo oder Beispieldatensatz in das
Repository gelangen. Bilder und andere Binärdaten sind für `v0.2.2`
vollständig ausgeschlossen; dazu zählen insbesondere Base64-Inhalte,
Dateipfade und Bildmetadaten. Schema 1 enthält außerdem keine Erstellungs- oder
Änderungszeitstempel. `calendarDate` ist nur ein reines Kalenderdatum.
Stimmung, Energie, Gesundheitswerte, Trainingsmetriken, Airtable-IDs,
Sync-Zustände, Agentenmetadaten und KI-Ausgaben sind ebenfalls keine
Vertragsfelder. Jeder Eintrag bleibt flach und eigenständig.

Contract, Controller, Service und Storage kommunizieren nicht extern und führen
weder Webhooks, Airtable, Synchronisierung noch `SyncAgent`, `DataAgent`,
`TestAgent` oder andere KI-Logik ein. Ein späterer Agentenfluss benötigt einen
eigenen minimierten Vertrag; der private lokale Gesamtsnapshot darf nicht
automatisch oder vollständig an Agenten weitergegeben werden. Aus dieser
lokalen Foundation wird weder formale AI-Act- noch allgemeine
Sicherheitskonformität abgeleitet.

## Ziele des Vertrags

Der Vertrag soll:

- alle externen Requests durch einen einheitlichen Umschlag führen;
- Routing ohne frei formulierte Agentenauswahl ermöglichen;
- Eingaben und Antworten an jeder Systemgrenze validierbar machen;
- Fehler, Warnungen und fachliche Ergebnisse eindeutig trennen;
- Wiederholungen von Schreibrequests ohne Duplikate ermöglichen;
- private und öffentliche Datenflüsse unterscheidbar halten;
- spätere Änderungen kontrolliert versionierbar machen.

## Geltungsbereich von Version 1

### Externe Aktionen des Dashboards

Die folgenden Aktionen gehören zum Zielvertrag für spätere Versionen. Sie sind
auch im funktional abgeschlossenen lokalen Stand von `v0.2.1` noch nicht
implementiert.

| Aktion | Zweck | Primärer Handler | Schreibend |
| --- | --- | --- | --- |
| `syncTest` | Verbindung und Vertragsformat prüfen | SyncAgent | nein |
| `learningTest.create` | Lerntest erzeugen und Definition sicher speichern | TestAgent | ja |
| `learningTest.evaluate` | Antworten bewerten und Ergebnis speichern | TestAgent | ja |
| `learningTest.result.get` | Gespeichertes Testergebnis abrufen | DataAgent | nein |

Diese Allowlist ist für Version 1 geschlossen. Externe Clients dürfen keine
`data.*`-Aktionen oder frei gewählten Agentennamen übermitteln.

### Interne Aktionen zwischen Agenten

| Aktion | Quelle | Ziel | Zweck |
| --- | --- | --- | --- |
| `test.generate` | SyncAgent | TestAgent | Test und serverseitige Bewertungskriterien erzeugen |
| `test.evaluate` | SyncAgent | TestAgent | Antworten nach gespeicherten Kriterien bewerten |
| `data.record.create` | SyncAgent | DataAgent | erlaubten Datensatz anlegen |
| `data.record.get` | SyncAgent | DataAgent | erlaubten Datensatz über stabile ID lesen |
| `data.record.list` | SyncAgent | DataAgent | erlaubte Datensätze paginiert lesen |
| `data.record.update` | SyncAgent | DataAgent | erlaubte Felder eines Datensatzes ändern |

`data.record.delete` ist nicht Teil von Version 1. Löschungen werden nicht
autonom durch Agenten ausgeführt.

### Bewusst nicht enthaltene Verträge

- PromptVault-Synchronisation mit Airtable;
- weitere Agentenrollen;
- E-Mail-, Kalender-, GitHub- oder Gesundheitsdaten;
- Datei-Uploads oder binäre Payloads;
- Benutzerkonten und Rollenmodelle;
- öffentliche Schreibzugriffe ohne gesonderte Sicherheitsentscheidung.

PromptVault bleibt in `v0.2.0` ausschließlich lokal. Falls später eine externe
Synchronisation beschlossen wird, läuft sie ebenfalls ausschließlich über
SyncAgent und DataAgent und erhält eigene dokumentierte Aktionen.

## Lokaler PromptVault-Speichervertrag

### Geltungsbereich und Datenfluss

Der lokale Vertrag ist implementiert und verwendet ausschließlich diesen
Datenfluss:

```text
PromptVaultView
  → PromptVaultController
  → PromptService
  → PromptStorage
  → StorageAdapter
  → localStorage
```

View und Controller greifen nicht direkt auf `localStorage`, `PromptStorage`
oder `StorageAdapter` zu. Die vollständige Promptliste aus dem Service ist die
autoritative Datenquelle der Oberfläche. Suchtext, Kategorieauswahl und der
Favoritenfilter sind flüchtige UI-Zustände und nicht Bestandteil des
Speichervertrags.

### Storage-Key und Envelope

PromptVault verwendet genau diesen Storage-Key:

```text
goldendawn.promptVault.v1
```

Neue Schreibvorgänge verwenden den Schema-2-Envelope:

```json
{
  "schemaVersion": 2,
  "prompts": []
}
```

| Feld | Typ | Regel |
| --- | --- | --- |
| `schemaVersion` | Ganzzahl | für den aktuellen Vertrag exakt `2` |
| `prompts` | Array | vollständige Promptliste; darf bewusst leer sein |

Storage-Key und `schemaVersion` erfüllen unterschiedliche Aufgaben. Der Name
des bestehenden Keys bleibt trotz der Schema-2-Migration unverändert.

### Aktueller Promptvertrag

Jeder Prompt im Schema-2-Envelope enthält mindestens folgende Felder:

| Feld | Typ | Regel |
| --- | --- | --- |
| `id` | String | stabil, nicht leer und ohne führende oder abschließende Leerzeichen |
| `title` | String | aktueller Titel, nicht leer; Anwendungslimit 120 Zeichen |
| `category` | String | aktuelle Kategorie oder leer; Anwendungslimit 60 Zeichen |
| `description` | String | aktuelle Beschreibung oder leer; Anwendungslimit 240 Zeichen |
| `content` | String | aktueller vollständiger Prompt-Text, nicht leer; Anwendungslimit 10.000 Zeichen |
| `createdAt` | ISO-8601-String | Erstellungszeitpunkt des Prompts in UTC |
| `updatedAt` | ISO-8601-String | Zeitpunkt der letzten erfolgreichen Promptmutation in UTC; nicht vor `createdAt` |
| `isFavorite` | Boolean | persistenter Favoritenstatus außerhalb der Inhaltsversionen |
| `isDemo` | Boolean | Kennzeichnung synthetischer Beispielprompts |
| `versions` | Array | nicht leere, lückenlos aufsteigende und fachlich unveränderliche Versionshistorie |

`title`, `category`, `description` und `content` auf der Prompt-Ebene bilden den
aktuellen, durchsuchbaren Stand. Diese vier Felder müssen exakt der letzten
gespeicherten Version entsprechen. Suche und Kategorie-Filter verwenden nur
diesen aktuellen Top-Level-Inhalt und durchsuchen nicht die Historie.

### Vertrag einer Promptversion

Jeder Eintrag in `versions` enthält exakt folgende Felder:

| Feld | Typ | Regel |
| --- | --- | --- |
| `versionNumber` | positive Ganzzahl | beginnt bei `1` und steigt lückenlos um eins |
| `title` | String | Titel-Snapshot dieser Fassung, nicht leer |
| `category` | String | Kategorie-Snapshot dieser Fassung oder leer |
| `description` | String | Beschreibungs-Snapshot dieser Fassung oder leer |
| `content` | String | vollständiger Prompt-Text dieser Fassung, nicht leer |
| `createdAt` | ISO-8601-String | Entstehungszeitpunkt dieser Inhaltsversion in UTC |
| `changeType` | String | einer der erlaubten Änderungstypen |
| `restoredFromVersion` | positive Ganzzahl oder `null` | direkte Ursprungsversion einer Wiederherstellung |

Erlaubte Werte für `changeType`:

| Wert | Bedeutung |
| --- | --- |
| `created` | Version 1 eines neu erstellten oder synthetischen Beispielprompts |
| `migrated` | im Arbeitsspeicher erzeugte Ausgangsversion eines gültigen Schema-1-Prompts |
| `edited` | neue Version nach einer tatsächlichen Änderung der vier Inhaltsfelder |
| `restored` | neue Version aus einer ausgewählten früheren Fassung |

Für `created`, `migrated` und `edited` ist `restoredFromVersion` immer `null`.
Bei `restored` enthält das Feld die positive Nummer einer bereits vorhandenen,
kleineren Version. Es verweist auf die direkt ausgewählte Fassung. Wird eine
frühere Restore-Version ausgewählt, verweist die neue Version daher auf deren
eigene `versionNumber` und nicht transitiv auf deren Ursprung.

### Unveränderlichkeit und Mutationen

Das gespeicherte `versions`-Array ist fachlich append-only:

- Versionen bleiben lückenlos aufsteigend gespeichert und werden weder
  umsortiert noch überschrieben oder entfernt.
- Die Oberfläche darf für die absteigende Anzeige eine Kopie verwenden, aber
  nicht das gespeicherte Array verändern.
- Erstellen legt genau Version 1 mit `changeType: "created"` an.
- Eine tatsächliche Änderung an `title`, `category`, `description` oder
  `content` hängt genau eine neue Version mit `changeType: "edited"` an.
- Wiederherstellen übernimmt ausschließlich die vier Inhaltsfelder der
  ausgewählten Version und hängt genau eine neue Version mit
  `changeType: "restored"` an. Identität, Listenposition, Erstellungsmetadaten,
  Demo-Herkunft, Favoritenstatus und frühere Versionen bleiben erhalten.
- Entsprechen die vier Zielwerte bereits dem aktuellen Stand, ist Bearbeiten
  beziehungsweise Wiederherstellen ein No-op. Es entsteht keine Version, kein
  neuer Zeitstempel und kein Storage-Schreibvorgang.
- Eine Favoritenänderung aktualisiert ausschließlich Top-Level-Metadaten. Sie
  erzeugt keine Inhaltsversion und verändert keinen historischen Snapshot.
- Löschen entfernt den vollständigen Prompt einschließlich seiner gesamten
  Versionshistorie.

Nach jeder erfolgreichen Mutation speichert `PromptStorage` die vollständige
Promptliste im Schema-2-Envelope. Schlägt die Validierung, Zeitstempelerzeugung
oder Speicherung fehl, bleibt die zuvor geladene Liste autoritativ; es wird
keine neue Version vorgetäuscht.

### Migration von Schema 1

Ein gültiger Schema-1-Envelope wird beim Laden validiert und ausschließlich im
Arbeitsspeicher normalisiert:

- fehlende boolesche Felder werden kontrolliert auf `false` normalisiert;
- jeder Prompt erhält genau eine Baseline als Version 1;
- diese Baseline übernimmt die vier vorhandenen Top-Level-Inhaltsfelder;
- ihr `createdAt` entspricht dem bisherigen `updatedAt`;
- ihr `changeType` ist `migrated` und `restoredFromVersion` ist `null`;
- frühere, nicht gespeicherte Änderungen werden nicht rekonstruiert.

Das bloße Laden eines vorhandenen Schema-1-Envelopes überschreibt den Rohwert
nicht. Erst eine erfolgreiche Mutation schreibt die vollständige Sammlung als
Schema 2. Ein fehlender Storage-Key ist davon zu unterscheiden: Beim ersten
Laden initialisiert der Service die klar gekennzeichneten synthetischen
Beispielprompts direkt als Schema 2. Eine bewusst gespeicherte leere Liste
bleibt leer.

Beschädigte Daten, ein unbekanntes Schema und fehlgeschlagene Schreibvorgänge
werden nicht durch Fallback- oder Migrationsdaten überschrieben.

### Lokale Grenzen

`localStorage` speichert PromptVault-Daten ausschließlich für den aktuellen
Browser-Origin und das aktuelle Browserprofil. Diese Speicherung ist:

- keine Cloud-Sicherung;
- keine geräte- oder browserübergreifende Synchronisierung;
- kein Import- oder Exportmechanismus;
- kein Backend und keine Airtable-Anbindung.

Das Löschen lokaler Browserdaten kann die PromptVault-Daten entfernen.
Benutzerkonten, automatische Cloud-Sicherung und Wiederherstellung außerhalb
des aktuellen Browserprofils sind nicht implementiert.

## Gemeinsamer Request-Umschlag

Jeder externe und interne Request verwendet dieselbe Grundstruktur:

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "timestamp": "2026-07-11T12:00:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.3.0"
  },
  "payload": {}
}
```

### Felder des Request-Umschlags

| Feld | Typ | Pflicht | Regel |
| --- | --- | --- | --- |
| `version` | String | ja | exakt `1.0` für diesen Vertrag |
| `action` | String | ja | Wert aus der passenden Allowlist |
| `source` | String | ja | erlaubte Quelle, nicht frei vertrauenswürdig |
| `requestId` | String | bedingt | für alle schreibenden Aktionen verpflichtend |
| `timestamp` | ISO-8601-String | ja | UTC mit `Z` |
| `context` | Objekt | nein | nur erlaubte Kontextfelder |
| `payload` | Objekt | ja | aktionsspezifische Struktur |

### Regeln für die Vertragsversion

- Version `1.0` wird als String übertragen.
- Eine nicht unterstützte Hauptversion wird mit `UNSUPPORTED_VERSION`
  abgelehnt.
- Abwärtskompatible optionale Felder dürfen innerhalb von Version 1 ergänzt
  werden.
- Pflichtfelder, Feldbedeutungen und Datentypen werden nicht stillschweigend
  geändert.
- Breaking Changes benötigen eine neue Hauptversion und aktualisierte Beispiele.

### Regeln für Aktionen

- Aktionen sind case-sensitive.
- Externe Aktionen verwenden stabile englische Namen.
- Punktnotation trennt Domäne und Operation, beispielsweise
  `learningTest.evaluate`.
- `syncTest` bleibt aus Kompatibilitätsgründen die einzige Aktion ohne
  Domänenpräfix.
- Der Client wählt keinen Agenten. Der SyncAgent routet ausschließlich anhand
  der validierten Aktion.
- Unbekannte Aktionen erhalten `UNKNOWN_ACTION`.

### Regeln für Quellen

Erlaubte Quellen:

| Kontext | `source` |
| --- | --- |
| Dashboard an SyncAgent | `goldendawn-os` |
| SyncAgent an Fachagent | `SyncAgent` |
| TestAgent an SyncAgent | `TestAgent` |
| DataAgent an SyncAgent | `DataAgent` |

Ein externer Request darf sich nicht durch `source: "SyncAgent"` als interner
Request ausgeben. Die vertrauenswürdige Quelle wird an der Systemgrenze durch
den Workflow-Kontext bestimmt und nicht nur aus dem JSON-Feld abgeleitet.

### Regeln für Request-IDs

- Format: Präfix `req_` plus UUID oder vergleichbar kollisionsarme ID.
- Empfohlene Erzeugung im Browser: `req_${crypto.randomUUID()}`.
- Maximale Länge: 64 Zeichen.
- Eine ID wird im gesamten Agentenfluss beibehalten.
- Schreibende Aktionen ohne `requestId` werden abgelehnt.
- `syncTest` darf während der frühen Entwicklung ohne ID eintreffen; der
  SyncAgent erzeugt dann eine ID und gibt sie in der Antwort zurück.
- Gleiche `requestId` plus gleiche Aktion und gleiche Nutzlast gilt als Retry.
- Gleiche `requestId` mit abweichender Aktion oder Nutzlast ergibt
  `IDEMPOTENCY_CONFLICT`.

### Regeln für Zeitstempel

- Systemübergreifende Zeitstempel verwenden ISO 8601 in UTC.
- Beispiel: `2026-07-11T12:00:00.000Z`.
- Im verbundenen Modus wird eine Abweichung von mehr als fünf Minuten
  standardmäßig abgelehnt, sofern kein dokumentierter Queue-Modus existiert.
- Reine Kalenderdaten verwenden `YYYY-MM-DD`.
- Kalenderdaten werden nicht unnötig über `new Date("YYYY-MM-DD")` geparst.

### Regeln für den Request-Kontext

```json
{
  "mode": "private",
  "locale": "de-DE",
  "clientVersion": "0.3.0"
}
```

| Feld | Typ | Erlaubte Werte |
| --- | --- | --- |
| `mode` | String | `private`, `demo` |
| `locale` | String | für Version 1 primär `de-DE` |
| `clientVersion` | String | gültige Anwendungsversionsangabe |

`mode` ist keine Berechtigung. Die tatsächliche Datenquelle wird serverseitig
durch getrennte Workflows und Konfigurationen bestimmt.

### Größen- und Längenlimits

| Element | Limit für Version 1 |
| --- | --- |
| gesamter JSON-Request | maximal 64 KiB |
| `action` | maximal 64 Zeichen |
| `requestId` | maximal 64 Zeichen |
| kurzer Titel | maximal 160 Zeichen |
| kurze Beschreibung | maximal 500 Zeichen |
| Lernzusammenfassung | maximal 12.000 Zeichen |
| einzelne Nutzerantwort | maximal 4.000 Zeichen |
| Array von Lernzielen | maximal 20 Einträge |
| Array von Antworten | maximal 10 Einträge |
| Fehlermeldung für Clients | maximal 500 Zeichen |

Alle Strings werden als UTF-8 verarbeitet. Eingaben werden validiert und für
fachliche Vergleiche bei Bedarf getrimmt, aber nicht unbemerkt inhaltlich
umgeschrieben.

## Gemeinsamer Response-Umschlag

Jede Antwort an das Dashboard verwendet diese Struktur:

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-07-11T12:00:00.245Z",
  "data": {},
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 245
  }
}
```

### Felder des Response-Umschlags

| Feld | Typ | Regel |
| --- | --- | --- |
| `version` | String | verwendete Vertragsversion |
| `success` | Boolean | Erfolg der primären fachlichen Aktion |
| `requestId` | String | immer vorhanden |
| `action` | String | ursprüngliche externe Aktion |
| `handledBy` | String | Agent des primären fachlichen Ergebnisses |
| `timestamp` | ISO-8601-String | Zeitpunkt der Antwort in UTC |
| `data` | Objekt oder `null` | bei Erfolg aktionsspezifisch |
| `error` | Objekt oder `null` | bei Fehler strukturiert |
| `warnings` | Array | nicht-blockierende Probleme |
| `meta` | Objekt | sichere technische Metadaten |

`success` beschreibt die primäre Aktion. Bei `learningTest.evaluate` kann eine
Bewertung fachlich erfolgreich sein, obwohl die anschließende Speicherung
fehlschlägt. In diesem Fall bleibt `success: true`, während `persistence.status`
und `warnings` den Speicherfehler sichtbar machen.

### Sichere Response-Metadaten

```json
{
  "durationMs": 842,
  "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
}
```

- `durationMs` ist eine nicht-negative Ganzzahl.
- `processedBy` enthält nur Agentennamen, keine Node- oder Workflow-Interna.
- Stacktraces, Credential-IDs und Airtable-interne Details werden nicht an den
  Client zurückgegeben.

## Fehlervertrag

### Struktur eines Fehlers

```json
{
  "version": "1.0",
  "success": false,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "learningTest.evaluate",
  "handledBy": "SyncAgent",
  "timestamp": "2026-07-11T12:00:00.245Z",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Die Anfrage enthält ungültige Felder.",
    "retryable": false,
    "details": [
      {
        "field": "payload.answers",
        "reason": "Mindestens eine Antwort ist erforderlich."
      }
    ]
  },
  "warnings": [],
  "meta": {
    "durationMs": 12
  }
}
```

### Erlaubte Fehlercodes

| Code | Bedeutung | Retry |
| --- | --- | --- |
| `INVALID_JSON` | Body ist kein gültiges JSON | nein |
| `VALIDATION_ERROR` | Umschlag oder Payload ist ungültig | nein |
| `UNSUPPORTED_VERSION` | Vertragsversion wird nicht unterstützt | nein |
| `UNKNOWN_ACTION` | Aktion steht nicht auf der Allowlist | nein |
| `UNAUTHORIZED` | Authentisierung fehlt oder ist ungültig | nein |
| `FORBIDDEN` | Aktion ist in diesem Kontext nicht erlaubt | nein |
| `NOT_FOUND` | Angeforderte Ressource existiert nicht | nein |
| `CONFLICT` | Fachlicher Konflikt | nein |
| `IDEMPOTENCY_CONFLICT` | Request-ID wurde anders verwendet | nein |
| `PAYLOAD_TOO_LARGE` | Request überschreitet das Limit | nein |
| `RATE_LIMITED` | Aufruflimit wurde überschritten | ja, verzögert |
| `TEST_GENERATION_FAILED` | TestAgent konnte keinen gültigen Test erzeugen | bedingt |
| `TEST_EVALUATION_FAILED` | TestAgent konnte nicht valide bewerten | bedingt |
| `DATA_READ_FAILED` | DataAgent konnte nicht lesen | bedingt |
| `DATA_WRITE_FAILED` | DataAgent konnte nicht schreiben | bedingt |
| `UPSTREAM_TIMEOUT` | Externes System antwortet nicht rechtzeitig | ja |
| `SERVICE_UNAVAILABLE` | Benötigter Dienst ist vorübergehend nicht verfügbar | ja |
| `INTERNAL_ERROR` | Unerwarteter interner Fehler | bedingt |

`retryable: true` bedeutet nicht, dass der Client sofort oder unbegrenzt
wiederholen darf. Wiederholungen verwenden dieselbe `requestId` und eine
begrenzte Backoff-Strategie.

### HTTP-Statuszuordnung

| HTTP | Verwendung |
| --- | --- |
| `200` | erfolgreiche Aktion oder erfolgreicher idempotenter Retry |
| `400` | ungültiges JSON, Umschlag oder unbekannte Aktion |
| `401` | fehlende oder ungültige Authentisierung |
| `403` | authentisiert, aber Aktion nicht erlaubt |
| `404` | Ressource nicht gefunden |
| `409` | Fach- oder Idempotenzkonflikt |
| `413` | Payload zu groß |
| `422` | aktionsspezifische Payload fachlich ungültig |
| `429` | Rate Limit erreicht |
| `500` | unerwarteter interner Fehler |
| `502` | ungültige Antwort eines Upstream-Dienstes |
| `503` | Dienst vorübergehend nicht verfügbar |
| `504` | Upstream-Timeout |

## Warnungsvertrag

Warnungen blockieren das primäre fachliche Ergebnis nicht:

```json
{
  "code": "RESULT_NOT_SAVED",
  "message": "Die Bewertung wurde erstellt, aber noch nicht gespeichert."
}
```

Erlaubte Warnungen für Version 1:

| Code | Verwendung |
| --- | --- |
| `RESULT_NOT_SAVED` | Testergebnis konnte nicht gespeichert werden |
| `PARTIAL_CONTEXT_USED` | Test wurde mit reduziertem Lernkontext erstellt |
| `DEMO_MODE` | Ergebnis stammt aus der synthetischen Demo-Umgebung |

Warnungen enthalten keine Secrets, Stacktraces oder vollständigen externen
Fehlermeldungen.

## Vertrag für syncTest

### Request für syncTest

```json
{
  "version": "1.0",
  "action": "syncTest",
  "source": "goldendawn-os",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "timestamp": "2026-07-11T12:00:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.3.0"
  },
  "payload": {
    "message": "GoldenDawn OS connection test"
  }
}
```

`payload.message` ist optional und auf 120 Zeichen begrenzt. Der SyncAgent gibt
nicht die gesamte beliebige Payload zurück.

### Response für syncTest

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "action": "syncTest",
  "handledBy": "SyncAgent",
  "timestamp": "2026-07-11T12:00:00.105Z",
  "data": {
    "status": "ok",
    "agent": "SyncAgent",
    "mode": "private",
    "receivedAt": "2026-07-11T12:00:00.032Z",
    "echo": {
      "message": "GoldenDawn OS connection test"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 105,
    "processedBy": ["SyncAgent"]
  }
}
```

## Vertrag für learningTest.create

### Request zum Erstellen eines Lerntests

```json
{
  "version": "1.0",
  "action": "learningTest.create",
  "source": "goldendawn-os",
  "requestId": "req_0ef9a490-a541-46d6-b8e6-50fd0a156ed7",
  "timestamp": "2026-07-11T12:10:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.5.0"
  },
  "payload": {
    "topicId": "topic_synthetic_patterns_001",
    "title": "Synthetische Musterkarten",
    "learningContext": {
      "summary": "Die unabhängig erfundenen Karten beschreiben neutrale Muster und Blickwinkel.",
      "learningObjectives": [
        "Zwei erfundene Muster vergleichen können",
        "Eine neutrale Beobachtung umformulieren können"
      ],
      "sourceRefs": [
        {
          "id": "demo_node_perspectives",
          "label": "Synthetische Textkarte: Zwei Blickwinkel"
        }
      ]
    },
    "settings": {
      "questionCount": 1,
      "passingScore": 1,
      "language": "de-DE"
    }
  }
}
```

### Validierung der Test-Erstellung

| Feld | Regel |
| --- | --- |
| `topicId` | stabiler String, maximal 80 Zeichen |
| `title` | 1 bis 160 Zeichen |
| `summary` | 1 bis 12.000 Zeichen |
| `learningObjectives` | 1 bis 20 eindeutige Einträge |
| `sourceRefs` | maximal 20 Referenzen, keine Secrets |
| `questionCount` | Ganzzahl von 1 bis 10, Standard 5 |
| `passingScore` | Ganzzahl von 1 bis `questionCount` |
| `language` | für Version 1 `de-DE` |

Der TestAgent erzeugt intern Bewertungskriterien. Diese Kriterien werden über
den SyncAgent vom DataAgent als `learningTestDefinition` gespeichert und nicht
an das Dashboard ausgegeben. Schlägt diese notwendige Speicherung fehl, gilt
`learningTest.create` als fehlgeschlagen, da der Test später nicht zuverlässig
bewertet werden könnte.

### Response mit öffentlicher Testdefinition

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_0ef9a490-a541-46d6-b8e6-50fd0a156ed7",
  "action": "learningTest.create",
  "handledBy": "TestAgent",
  "timestamp": "2026-07-11T12:10:02.400Z",
  "data": {
    "test": {
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "title": "Big Data – Grundlagen",
      "instructions": "Beantworte alle Fragen in eigenen Worten.",
      "settings": {
        "questionCount": 1,
        "maxScore": 1,
        "passingScore": 1,
        "language": "de-DE"
      },
      "questions": [
        {
          "questionId": "qst_1",
          "type": "freeText",
          "prompt": "Welche vier V beschreiben Big Data und was bedeuten sie?",
          "maxPoints": 1
        }
      ],
      "createdAt": "2026-07-11T12:10:02.000Z"
    },
    "persistence": {
      "status": "saved",
      "recordId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 2400,
    "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
  }
}
```

Die Antwort enthält weder Musterlösungen noch Bewertungskriterien.

## Vertrag für learningTest.evaluate

### Request zur Bewertung

```json
{
  "version": "1.0",
  "action": "learningTest.evaluate",
  "source": "goldendawn-os",
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "timestamp": "2026-07-11T12:20:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.5.0"
  },
  "payload": {
    "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
    "answers": [
      {
        "questionId": "qst_1",
        "answer": "Volume, Variety, Velocity und Veracity beschreiben Datenmenge, Vielfalt, Geschwindigkeit und Vertrauenswürdigkeit."
      }
    ]
  }
}
```

### Validierung der Bewertung

- `testId` ist verpflichtend und maximal 64 Zeichen lang.
- Jede erwartete `questionId` darf höchstens einmal vorkommen.
- Unbekannte Fragen werden abgelehnt.
- Eine Antwort ist ein String mit maximal 4.000 Zeichen.
- Die Zahl der Antworten darf die Zahl der Testfragen nicht überschreiten.
- Der Server bestimmt `attemptNumber`; der Client darf sie nicht frei setzen.
- Die gespeicherte Testdefinition bestimmt Maximal- und Bestehenspunktzahl.

### Modell eines Testergebnisses

```json
{
  "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
  "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
  "topicId": "topic_big_data_001",
  "attemptNumber": 1,
  "score": 1,
  "maxScore": 1,
  "passingScore": 1,
  "passed": true,
  "feedback": "Die vier V wurden sicher verstanden und korrekt erklärt.",
  "answerFeedback": [
    {
      "questionId": "qst_1",
      "points": 1,
      "maxPoints": 1,
      "correct": true,
      "feedback": "Alle vier V wurden korrekt erklärt."
    }
  ],
  "completedAt": "2026-07-11T12:20:03.000Z"
}
```

`passed` wird serverseitig aus `score >= passingScore` abgeleitet und nicht vom
Client übernommen.

### Response mit gespeichertem Ergebnis

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "learningTest.evaluate",
  "handledBy": "TestAgent",
  "timestamp": "2026-07-11T12:20:03.400Z",
  "data": {
    "result": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "feedback": "Die Grundlagen sind sicher verstanden.",
      "answerFeedback": [],
      "completedAt": "2026-07-11T12:20:03.000Z"
    },
    "persistence": {
      "status": "saved",
      "recordId": "trs_95058ab2-cdc9-4790-bded-381947949b02"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 3400,
    "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
  }
}
```

### Response bei erfolgreicher Bewertung ohne Speicherung

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "learningTest.evaluate",
  "handledBy": "TestAgent",
  "timestamp": "2026-07-11T12:20:03.400Z",
  "data": {
    "result": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "feedback": "Die Bewertung wurde erstellt.",
      "answerFeedback": [],
      "completedAt": "2026-07-11T12:20:03.000Z"
    },
    "persistence": {
      "status": "failed",
      "recordId": null,
      "errorCode": "DATA_WRITE_FAILED"
    }
  },
  "error": null,
  "warnings": [
    {
      "code": "RESULT_NOT_SAVED",
      "message": "Die Bewertung wurde erstellt, aber noch nicht gespeichert."
    }
  ],
  "meta": {
    "durationMs": 3400,
    "processedBy": ["SyncAgent", "TestAgent", "DataAgent"]
  }
}
```

Der Client darf das Ergebnis anzeigen, muss den Speicherstatus jedoch sichtbar
kennzeichnen und einen späteren kontrollierten Retry ermöglichen.

## Vertrag für learningTest.result.get

### Request zum Abrufen eines Ergebnisses

```json
{
  "version": "1.0",
  "action": "learningTest.result.get",
  "source": "goldendawn-os",
  "requestId": "req_33fdb3f2-dc70-4ca1-b91a-ed5f5d8d77ac",
  "timestamp": "2026-07-11T12:30:00.000Z",
  "context": {
    "mode": "private",
    "locale": "de-DE",
    "clientVersion": "0.5.0"
  },
  "payload": {
    "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02"
  }
}
```

Der SyncAgent übersetzt diese externe Aktion in einen internen
`data.record.get`-Auftrag für die Entität `learningTestResult`.

### Response mit abgerufenem Ergebnis

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_33fdb3f2-dc70-4ca1-b91a-ed5f5d8d77ac",
  "action": "learningTest.result.get",
  "handledBy": "DataAgent",
  "timestamp": "2026-07-11T12:30:00.400Z",
  "data": {
    "result": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "feedback": "Die Grundlagen sind sicher verstanden.",
      "answerFeedback": [],
      "completedAt": "2026-07-11T12:20:03.000Z"
    }
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 400,
    "processedBy": ["SyncAgent", "DataAgent"]
  }
}
```

## Interner DataAgent-Vertrag

### Erlaubte Entitäten

| Entität | Zweck | Erste Verwendung |
| --- | --- | --- |
| `systemEvent` | sichere technische Ereignisse ohne vollständige Payload | v0.4.0 |
| `learningTestDefinition` | Testfragen und serverseitige Bewertungskriterien | v0.5.0 |
| `learningTestResult` | bewertetes und angezeigtes Testergebnis | v0.5.0 |

Der DataAgent ordnet diese Entitäten serverseitig Airtable-Tabellen zu.
Base-IDs, Tabellen-IDs und frei gewählte Feldnamen sind kein Bestandteil des
Requests.

### Interner Request zum Erstellen eines Datensatzes

```json
{
  "version": "1.0",
  "action": "data.record.create",
  "source": "SyncAgent",
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "timestamp": "2026-07-11T12:20:03.100Z",
  "context": {
    "mode": "private"
  },
  "payload": {
    "entity": "learningTestResult",
    "record": {
      "resultId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
      "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
      "topicId": "topic_big_data_001",
      "attemptNumber": 1,
      "score": 1,
      "maxScore": 1,
      "passingScore": 1,
      "passed": true,
      "completedAt": "2026-07-11T12:20:03.000Z"
    }
  }
}
```

### Interne Response des DataAgent

```json
{
  "version": "1.0",
  "success": true,
  "requestId": "req_d28bd3c9-3218-498d-a4af-88327fd2dc5a",
  "action": "data.record.create",
  "handledBy": "DataAgent",
  "timestamp": "2026-07-11T12:20:03.350Z",
  "data": {
    "entity": "learningTestResult",
    "recordId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
    "operation": "created"
  },
  "error": null,
  "warnings": [],
  "meta": {
    "durationMs": 250
  }
}
```

### Regeln für Datenoperationen

- Nur der SyncAgent darf interne `data.*`-Requests erzeugen.
- `entity` muss auf der internen Allowlist stehen.
- Jede Entität besitzt eine feste Feld-Allowlist.
- Unbekannte Felder werden abgelehnt und nicht stillschweigend gespeichert.
- `create` benötigt eine stabile fachliche ID und `requestId`.
- `get` benötigt genau eine fachliche ID.
- `list` verwendet Cursor-Pagination.
- `update` erlaubt nur ausdrücklich veränderbare Felder.
- Base-, Tabellen- und Credential-IDs bleiben interne Konfiguration.
- Airtable-Antworten werden in Domänenobjekte übersetzt.

### Cursor-Pagination für interne Listen

Request-Payload:

```json
{
  "entity": "systemEvent",
  "pageSize": 20,
  "cursor": null,
  "filters": {
    "eventType": "syncTest.completed"
  }
}
```

Response-Daten:

```json
{
  "records": [],
  "page": {
    "pageSize": 20,
    "nextCursor": null,
    "hasMore": false
  }
}
```

- Standardgröße: 20 Datensätze.
- Maximum: 100 Datensätze.
- Cursor sind opak und werden vom Client nicht interpretiert.
- Filterfelder und Filterwerte werden pro Entität erlaubt und validiert.
- Freie Airtable-Formeln aus Requests sind nicht erlaubt.

## Domänenmodelle

### Modell eines Systemereignisses

```json
{
  "eventId": "evt_adf8f916-19f7-4344-bc16-87ab1aebef04",
  "eventType": "syncTest.completed",
  "requestId": "req_2f78d95e-9096-4a76-8a2f-6ed149dc53b9",
  "source": "SyncAgent",
  "success": true,
  "occurredAt": "2026-07-11T12:00:00.105Z",
  "metadata": {
    "durationMs": 105,
    "mode": "private"
  }
}
```

`metadata` verwendet eine feste Allowlist und enthält keine vollständigen
Requests, Tokens oder privaten Lerninhalte.

### Modell einer serverseitigen Testdefinition

```json
{
  "testId": "tst_e39339ff-6cb0-4ff0-a4a2-a8e675b185ea",
  "topicId": "topic_big_data_001",
  "title": "Big Data – Grundlagen",
  "settings": {
    "questionCount": 1,
    "maxScore": 1,
    "passingScore": 1,
    "language": "de-DE"
  },
  "questions": [
    {
      "questionId": "qst_1",
      "prompt": "Welche vier V beschreiben Big Data?",
      "maxPoints": 1,
      "criteria": [
        {
          "criterion": "Nennt und erklärt Volume, Variety, Velocity und Veracity.",
          "maxPoints": 1
        }
      ]
    }
  ],
  "createdAt": "2026-07-11T12:10:02.000Z"
}
```

`criteria` sind serverseitig und werden nicht an das Dashboard ausgeliefert.

### Modell des Speicherstatus

```json
{
  "status": "saved",
  "recordId": "trs_95058ab2-cdc9-4790-bded-381947949b02",
  "errorCode": null
}
```

Erlaubte Statuswerte:

| Status | Bedeutung |
| --- | --- |
| `saved` | Daten wurden bestätigt gespeichert |
| `pending` | Speicherung ist geplant, aber noch nicht bestätigt |
| `failed` | Speicherung ist fehlgeschlagen |
| `notRequired` | Aktion benötigt keine Speicherung |

Ein `pending`-Status darf nicht dauerhaft als erfolgreich gespeichert gelten.

## Idempotenz und Wiederholungen

### Regeln für schreibende Aktionen

- Der erste erfolgreiche Request speichert `requestId`, Aktion und einen
  stabilen Fingerprint der validierten Nutzlast.
- Ein Retry mit identischen Werten liefert das bereits vorhandene Ergebnis.
- Ein Retry erzeugt keinen weiteren Versuchszähler und keinen zweiten Datensatz.
- Eine bekannte `requestId` mit abweichendem Fingerprint wird abgelehnt.
- Timeouts werden nicht automatisch als fehlgeschlagener Schreibvorgang
  interpretiert; zuerst wird der Status anhand der `requestId` geprüft.
- Der Client verwendet begrenztes exponentielles Backoff.

### Fachliche Wiederholung eines Lerntests

Eine neue fachliche Prüfung ist kein technischer Retry. Sie erhält:

- eine neue `requestId`;
- einen serverseitig erhöhten `attemptNumber`;
- ein neues `resultId`;
- weiterhin dieselbe `testId`, wenn derselbe Test erneut beantwortet wird.

## Validierungsreihenfolge im SyncAgent

Der SyncAgent validiert in dieser Reihenfolge:

1. HTTP-Methode und Content-Type;
2. Payload-Größe und gültiges JSON;
3. gemeinsamer Request-Umschlag;
4. unterstützte Vertragsversion;
5. vertrauenswürdiger Workflow-Kontext und erlaubte Quelle;
6. Zeitstempel und `requestId`;
7. Aktions-Allowlist;
8. aktionsspezifische Payload;
9. Modus und serverseitige Datenquellenzuordnung;
10. Idempotenzstatus vor schreibenden Aktionen.

Erst danach wird an TestAgent oder DataAgent geroutet.

## Datenschutz- und Sicherheitsregeln

- Verträge enthalten keine Tokens, Passwörter oder Credential-IDs.
- Externe Clients dürfen keine Agenten-, Base- oder Tabellenziele bestimmen.
- Agentenoutput wird vor Weitergabe und Speicherung validiert.
- Lernkontext wird als Dateninhalt behandelt, nicht als Systemanweisung.
- Bewertungskriterien bleiben serverseitig.
- Demo- und private Requests verwenden getrennte serverseitige Workflows und
  Datenquellen.
- Fehlermeldungen enthalten keine vollständigen Upstream-Antworten.
- Logs verwenden bevorzugt `requestId`, Aktion, Status und Dauer statt
  vollständiger Payloads.

## Kompatibilitäts- und Änderungsregeln

### Abwärtskompatible Änderungen

- neues optionales Response-Feld;
- neuer optionaler Warning-Code;
- neue Aktion innerhalb derselben Hauptversion, wenn alte Clients unverändert
  funktionieren;
- Erweiterung einer Enum nur, wenn Clients unbekannte Werte sicher behandeln.

### Breaking Changes

- Umbenennung oder Entfernung eines Pflichtfelds;
- Änderung eines Datentyps;
- Änderung der Bedeutung von `success`;
- neue Pflichtfelder;
- Änderung der ID- oder Zeitsemantik;
- Freigabe zuvor interner Aktionen für externe Clients.

Breaking Changes benötigen:

1. neue Hauptversion;
2. aktualisierte Beispiele und Validierung;
3. Migrationsnotiz;
4. Abgleich mit Architektur, Sicherheit, Roadmap und AGENTS.md;
5. manuellen Pull Request und Review.

## Implementierungsartefakte

Wenn die Verträge implementiert werden, sollen daraus kleine prüfbare Module
entstehen:

```text
src/
└── contracts/
    ├── contractConstants.js
    ├── requestValidation.js
    ├── responseValidation.js
    └── actionSchemas.js
```

Für Version 1 werden zunächst Browser- und JavaScript-Funktionen verwendet.
Eine Schema-Bibliothek wird nur nach dokumentierter Entscheidung eingeführt.

## Vertrags-Testmatrix

| Fall | Erwartung |
| --- | --- |
| gültiger `syncTest` | `200`, `success: true`, Request-ID vorhanden |
| fehlende Version | `400`, `VALIDATION_ERROR` |
| Version `2.0` | `400`, `UNSUPPORTED_VERSION` |
| unbekannte Aktion | `400`, `UNKNOWN_ACTION` |
| übergroße Payload | `413`, `PAYLOAD_TOO_LARGE` |
| ungültiger Zeitstempel | `400`, `VALIDATION_ERROR` |
| Schreibrequest ohne `requestId` | `400`, `VALIDATION_ERROR` |
| externer `data.record.create` | `403`, `FORBIDDEN` |
| Test mit unbekannter Frage | `422`, `VALIDATION_ERROR` |
| identischer Retry | bestehendes Ergebnis, kein Duplikat |
| Request-ID mit anderer Payload | `409`, `IDEMPOTENCY_CONFLICT` |
| erfolgreiche Bewertung, Speicherfehler | `success: true`, Warning und `failed`-Status |
| Airtable-Timeout beim Lesen | `504`, `UPSTREAM_TIMEOUT` |

## Contract Definition of Done

Eine Vertragsaktion gilt erst als implementiert, wenn:

- Request und Response diesem Dokument entsprechen;
- Pflichtfelder, Typen, Längen und Enums validiert werden;
- unbekannte Felder gemäß Aktionsschema kontrolliert behandelt werden;
- positive, negative und Retry-Fälle geprüft sind;
- Fehlercode und HTTP-Status zusammenpassen;
- keine Secrets oder internen Daten offengelegt werden;
- Idempotenz für schreibende Aktionen nachgewiesen ist;
- README und Roadmap den tatsächlichen Implementierungsstatus zeigen;
- der Produktions-Build erfolgreich ist.

## Offene Vertragsentscheidungen

Vor der jeweiligen Implementierung werden noch konkret entschieden:

- exakte Fingerprint-Bildung für Idempotenz;
- technische Ablage von Idempotenzschlüsseln;
- konkrete Timeout- und Backoff-Werte;
- Validierungsstrategie ohne oder mit Schema-Bibliothek;
- maximale Aufbewahrung serverseitiger Testdefinitionen;
- Retry-UI für nicht gespeicherte Testergebnisse;
- ob `learningTest.result.list` für Version 1 benötigt wird.

Diese Punkte ändern nicht den Grundvertrag und werden nicht stillschweigend
implementiert.
