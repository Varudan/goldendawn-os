# ADR 0009: Separater Lernfortschritt als append-only Ereignislog

## Status

Angenommen – 2026-07-18

## Kontext

[ADR 0007](0007-user-configured-learning-modules.md) trennt die fachliche
LearningHub-Hierarchie von Kapitelabschluss, Modulfortschritt und
Testkompetenz. [ADR 0008](0008-learning-hub-local-content-persistence.md)
speichert den Schema-2-Inhaltsvertrag deshalb ausschließlich unter
`goldendawn.learningHub.content.v1`.

Kapitelabschluss besitzt einen anderen Lebenszyklus als Module, Kapitel und
LearningNodes. Ein veränderliches `completed`-Feld im Inhaltsvertrag würde
Inhaltsänderungen und Fortschrittszustände koppeln, frühere Zustandswechsel
verlieren und für eine reine Fortschrittsänderung den gesamten Inhaltsvertrag
fachlich verändern. Zugleich muss der aktuelle Fortschritt reproduzierbar aus
einer klaren, lokal validierbaren Quelle ableitbar sein.

Die Progress-Foundation von `v0.2.1` benötigt daher einen eigenen Vertrag,
Storage-Key, Service und eine reine Projektion. Sie bleibt in diesem
Arbeitspaket ohne View, Controller und Verdrahtung in `src/main.js`.

## Entscheidung

### Getrennter Fortschrittsvertrag

LearningHub-Inhalte bleiben unverändert bei `schemaVersion: 2` und unter dem
Storage-Key `goldendawn.learningHub.content.v1`. Fortschritt verwendet davon
getrennt diesen Vertrag:

```json
{
  "schemaVersion": 1,
  "dataOrigin": "private",
  "events": [
    {
      "id": "learning-progress-event-example",
      "type": "chapter.completed",
      "moduleId": "learning-module-example",
      "chapterId": "learning-chapter-example",
      "occurredAt": "2026-07-18T12:00:00.000Z"
    }
  ]
}
```

Schema 1 unterstützt ausschließlich `chapter.completed` und
`chapter.reopened`. `chapter.started` ist bewusst nicht enthalten. Seine
spätere Einführung würde eine versionierte Vertragsänderung mit aktualisierter
Validierung, Projektion, Persistenzdokumentation und Tests erfordern.

Ereignis-IDs sind innerhalb des vollständigen Logs eindeutig. IDs und
Referenzen sind nicht leer und bereits getrimmt. `occurredAt` ist ein gültiger,
kanonischer ISO-8601-UTC-Zeitstempel. Zeitstempel müssen weder eindeutig noch
monoton sein. Die Reihenfolge im `events`-Array ist autoritativ; `occurredAt`
wird nicht zum Sortieren verwendet.

Die strukturelle Vertragsvalidierung sammelt stabile Fehler im Format
`{ code, path, message }`, verändert ihre Eingabe nicht und prüft keine
Existenz von Modulen oder Kapiteln. Diese referenzielle Integrität benötigt den
aktuellen Inhaltsstand und liegt deshalb im `LearningProgressService`.

### Datenfluss und Verantwortlichkeiten

Der lokale Datenfluss der Progress-Foundation lautet:

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

`LearningProgressService` verwendet `LearningHubService` ausschließlich, um
den aktuellen validen Inhaltsstand zu laden und Modul-, Kapitel- sowie
Eigentumsreferenzen zu prüfen. `LearningHubService` kennt den
`LearningProgressService` nicht; eine gegenseitige oder zirkuläre
Service-Abhängigkeit ist ausgeschlossen.

Vor jeder Progress-Mutation lädt der Service Hub und Fortschrittslog neu,
validiert beide Gesamtzustände und prüft alle gespeicherten
Ereignisreferenzen. Verwaiste Kapitelreferenzen und Kapitel, die nicht zum
angegebenen Modul gehören, führen zu einem kontrollierten Fehler. Ungültige
Zustände werden nicht repariert, gelöscht oder überschrieben.

`completeChapter` hängt nur für ein offenes Kapitel genau ein
`chapter.completed`-Ereignis an. `reopenChapter` hängt nur für ein
abgeschlossenes Kapitel genau ein `chapter.reopened`-Ereignis an. Bereits
erreichte Zielzustände sind erfolgreiche, schreibfreie No-ops mit
`changed: false`; sie erzeugen weder ID noch Zeitstempel. Bei einer echten
Änderung wird der vollständige neue Log validiert und genau einmal gespeichert.
Es gibt keine öffentlichen Operationen zum Bearbeiten, Entfernen oder
Umsortieren vorhandener Ereignisse.

### Projektion

Eine reine, deterministische Projektion verbindet den aktuellen validen
LearningHub mit dem validen Fortschrittslog. Für jedes aktuell vorhandene
Modul liefert sie Kapitelstatus, Zahl abgeschlossener und aller Kapitel,
ganzzahligen Prozentfortschritt sowie Modulabschluss. Modul- und
Kapitelreihenfolge folgen dem Inhaltsvertrag; Titel und LearningNode-Inhalte
werden nicht kopiert.

Das jeweils letzte Array-Ereignis eines Kapitels gewinnt:
`chapter.completed` setzt es auf abgeschlossen, `chapter.reopened` wieder auf
offen. Ein Modul ist nur abgeschlossen, wenn es mindestens ein Kapitel besitzt
und alle Kapitel abgeschlossen sind. Ein leerer Hub ergibt eine leere
Modulprojektion. Module mit 100 Prozent bleiben vollständig erhalten und
werden nicht ausgefiltert. Fortschritt bleibt von späterer Testkompetenz
getrennt.

### Lokale Speicherung

Der feste Progress-Key lautet:

```text
goldendawn.learningHub.progress.v1
```

Das `v1` im Key bezeichnet den Persistenz-Namespace; `schemaVersion: 1`
versioniert unabhängig davon den gespeicherten Vertrag. Der private
Storage-Pfad akzeptiert ausschließlich `dataOrigin: private`. Ein fehlender Key
liefert einen frischen privaten, leeren Log im Arbeitsspeicher und schreibt ihn
nicht sofort. Laden und Speichern validieren den vollständigen Vertrag und
verwenden ausschließlich den gemeinsamen `StorageAdapter`.

Synthetische, beschädigte oder nicht unterstützte gespeicherte Werte werden
weder überschrieben noch gelöscht. Rückgaben und Schreibwerte werden defensiv
geklont. Adapter- und Quota-Fehler werden kontrolliert weitergegeben, ohne
private Titel, LearningNode-Inhalte oder Rohdaten in Fehlermeldungen aufzunehmen.
Es gibt keinen Demo-Import und keinen Netzwerkzugriff.

### Bedeutung und Grenzen von append-only

Append-only ist eine fachliche Anwendungsregel des
`LearningProgressService`. Technisch schreibt jede erfolgreiche Mutation den
vollständigen JSON-Log als neuen Snapshot in `localStorage`. Daraus folgen
ausdrücklich keine kryptografische Verkettung, Signatur, Unveränderlichkeit des
Speichermediums oder Manipulationssperre. Andere Skripte derselben Origin
könnten den Wert lesen oder verändern.

GoldenDawn OS beansprucht mit diesem Modell kein vollständiges Event Sourcing.
Der Ereignislog ist xAPI-inspiriert, aber nicht xAPI-konform; es gibt kein
Learning Record Store (LRS). Fehlende Verschlüsselung, Browser-Quota,
Multi-Tab-Rennen, fehlende Transaktionssperren und fehlende Synchronisierung
bleiben bekannte Grenzen lokaler Browserpersistenz.

### Spätere Inhaltslebenszyklen

Archivierung und dauerhaftes Löschen sind nicht Bestandteil dieser
Entscheidung. Eine spätere Archivierung von Modulen oder Kapiteln muss ihre
Fortschrittsereignisse erhalten und die Sichtbarkeit archivierter Referenzen in
der Projektion ausdrücklich festlegen. Dauerhaftes Löschen benötigt zuvor eine
gesonderte Referenz- und Löschrichtlinie, die mindestens den Umgang mit
verknüpften Ereignissen, möglichen Tombstones und nachvollziehbarer Historie
entscheidet. Weder verwaiste Ereignisse noch stilles kaskadierendes Löschen
werden vorweggenommen.

## Konsequenzen

Positive Auswirkungen:

- Inhaltsstruktur und Fortschrittszustand können unabhängig versioniert und
  gespeichert werden;
- Kapitelzustände und Modulfortschritt sind deterministisch reproduzierbar;
- No-ops vermeiden unnötige IDs, Zeitstempel und Schreibzugriffe;
- die referenzielle Prüfung bleibt in der Schicht mit Zugriff auf den aktuellen
  Inhaltsstand;
- abgeschlossene Module bleiben für spätere Lern- und Testflüsse erhalten;
- Dependency Injection für ID-Generator und Uhr ermöglicht deterministische
  Tests.

Kosten und Einschränkungen:

- jede Mutation lädt und validiert Hub und vollständigen Fortschrittslog;
- der vollständige Log wird bei jeder echten Änderung erneut als Snapshot
  geschrieben und wächst ohne Kompaktion;
- Änderungen am Inhaltslebenszyklus benötigen eine explizite Strategie für
  bestehende Ereignisreferenzen;
- lokale Browserpersistenz bietet keine Integritätsgarantie, Verschlüsselung,
  Transaktion oder tabübergreifende Konsistenz;
- die Foundation ist ohne UI- und Controller-Verdrahtung noch nicht direkt
  bedienbar, und `v0.2.1` bleibt in Arbeit.

## Erwogene Alternativen

### Veränderliches completed-Feld in Modulen oder Kapiteln

Diese Variante würde den unveränderten Schema-2-Inhaltsvertrag um einen
Fortschrittslebenszyklus erweitern, Zustandswechsel überschreiben und
Inhaltsmutationen mit Fortschrittsmutationen vermischen.

### Separater veränderlicher Status pro Kapitel

Eine Statusmap wäre getrennt vom Inhalt, würde aber frühere Abschlüsse und
Wiederöffnungen verlieren. Der kleine Ereignislog hält die benötigte
Zustandsfolge nachvollziehbar, ohne ein allgemeines Event-Sourcing-System
einzuführen.

### Zeitstempel als Sortierreihenfolge

Uhren können gleiche oder nicht monotone Werte liefern. Persistierte
Arrayreihenfolge ist eindeutig, lokal verfügbar und entspricht der
Append-Operation; `occurredAt` bleibt deshalb nur beschreibend.

### xAPI, LRS oder vollständiges Event Sourcing einführen

Diese Systeme würden Standards, Infrastruktur und Betriebsanforderungen
einführen, die der lokale MVP nicht benötigt. Das begrenzte Domänenmodell wird
deshalb nicht als standardkonform oder manipulationssicher dargestellt.

### Inhalt und Fortschritt unter demselben Storage-Key speichern

Ein gemeinsamer Snapshot würde getrennte Verträge und Lebenszyklen wieder
koppeln. Eigene Namespaces halten Fehler, Migrationen und spätere
Weiterentwicklung voneinander getrennt.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- ein zusätzlicher Ereignistyp wie `chapter.started` benötigt wird;
- Archivierung oder dauerhaftes Löschen von Modulen oder Kapiteln eingeführt
  wird;
- Loggröße oder Schreibfrequenz Kompaktion oder eine andere Speichertechnik
  erfordern;
- Multi-Tab-Koordination, Synchronisierung oder geräteübergreifende
  Konfliktauflösung benötigt wird;
- kryptografische Integrität, Audit-Anforderungen, xAPI-Konformität oder ein
  echtes LRS gefordert werden;
- ein neuer Fortschrittsvertrag eine dokumentierte Migration benötigt.

## Verwandte Dokumente

- [`ADR 0004`](0004-private-demo-separation.md)
- [`ADR 0007`](0007-user-configured-learning-modules.md)
- [`ADR 0008`](0008-learning-hub-local-content-persistence.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
