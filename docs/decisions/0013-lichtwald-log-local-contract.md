# ADR 0013: Lokaler LichtwaldLog-Vertrag mit einzelner Fokusreferenz

## Status

Angenommen – 2026-07-26

## Kontext

`v0.2.2` führt das LichtwaldLog als lokales Journal-Modul ein. Bevor Storage,
Service, Controller oder View entstehen, benötigt die Domäne einen kleinen,
vollständig validierbaren Vertrag für Einträge aus Titel, reinem
Kalenderdatum, Text und Tags. Private Laufzeitdaten und synthetische
Repository-Beispiele müssen fachlich unterscheidbar bleiben, ohne eine
Verschlüsselung oder Zugriffskontrolle vorzutäuschen.

Das Command Center soll später höchstens einen „Besonderen Lichtwald-Moment“
beziehungsweise Lichtwald-Fokus anzeigen. Würde dieser Eintrag kopiert oder
mit einem `isFeatured`-Feld an jedem Datensatz markiert, könnten Fokuszustand
und Eintragsinhalt auseinanderlaufen. Auch technische Zeitstempel, Bilddaten,
Sync-Metadaten oder bereits auf Airtable zugeschnittene Felder würden
Lebenszyklen und spätere Phasen vorzeitig in den lokalen Inhaltsvertrag
einbauen.

Der erste Slice benötigt deshalb ausschließlich die Vertragsgrundlage mit
Validator und synthetischen Contract-Tests. Persistenz, Mutationen und UI
folgen in getrennten Arbeitspaketen.

## Entscheidung

### Schema 1 und exakte Struktur

Das LichtwaldLog verwendet `schemaVersion: 1`. Der Root besitzt ausschließlich
diese vier eigenen Pflichtfelder.

```json
{
  "schemaVersion": 1,
  "dataOrigin": "synthetic",
  "featuredEntryId": "lichtwald-entry-prisma",
  "entries": [
    {
      "id": "lichtwald-entry-prisma",
      "calendarDate": "2026-07-26",
      "title": "Vollständig synthetischer Prismamoment",
      "text": "Dieser Inhalt wurde ausschließlich als Beispiel erfunden.",
      "tags": ["Prisma", "Ruhe"]
    }
  ]
}
```

Jeder Eintrag besitzt ausschließlich die eigenen Pflichtfelder `id`,
`calendarDate`, `title`, `text` und `tags`. Unbekannte Root- und Entry-Felder,
fehlende Pflichtfelder, ungeeignete Objekt-Prototypen und Sparse Arrays sind
ungültig. Der Validator normalisiert oder verändert persistierte Werte nicht,
sammelt strukturell und fachlich auffindbare Fehler deterministisch und gibt
nur stabile `{ code, path, message }`-Einträge ohne private Rohwerte zurück.

Es gelten diese Grenzen:

| Feld | Regel |
| --- | --- |
| `schemaVersion` | exakt die Zahl `1` |
| `dataOrigin` | exakt `private` oder `synthetic` |
| `featuredEntryId` | immer vorhanden; `null` oder bereits getrimmte ID |
| `entries` | dichtes Array mit höchstens 1.000 Einträgen |
| `entries[].id` | bereits getrimmter String mit 1 bis 100 Zeichen; im Array exakt und case-sensitive eindeutig |
| `entries[].calendarDate` | existierendes gregorianisches Kalenderdatum im exakten Format `YYYY-MM-DD`, Jahr `0001` bis `9999` |
| `entries[].title` | bereits getrimmter String mit 1 bis 120 Zeichen |
| `entries[].text` | bereits getrimmter String mit 1 bis 10.000 Zeichen |
| `entries[].tags` | dichtes Array mit 0 bis 8 Tags |
| `entries[].tags[]` | bereits getrimmter String mit 1 bis 30 Zeichen; je Eintrag ohne Beachtung der Groß-/Kleinschreibung eindeutig |

Die Längenprüfung verwendet wie die bestehenden JavaScript-Verträge
`String.length`. Eine eigene Unicode-Codepoint- oder Graphemzählung wird nicht
eingeführt. Tag-Schreibweisen bleiben erhalten. Schema 1 führt weder eine
Zeichen-Whitelist noch eine Komma-Parsing-Regel ein.

### Reines Kalenderdatum

`calendarDate` beschreibt ausschließlich ein Kalenderdatum und keinen
Zeitpunkt. Die Validierung prüft Format, Jahr, Monat, tatsächliche Monatslänge
und gregorianische Schaltjahre arithmetisch. Sie verwendet kein potenziell
normalisierendes `Date`-Parsing und führt keine UTC- oder
Zeitzonenumwandlung aus. Gültige zukünftige Kalenderdaten sind erlaubt.

Schema 1 enthält bewusst weder `createdAt` noch `updatedAt`. Technische
Zeitstempel werden erst mit einem nachgewiesenen fachlichen Bedarf und einer
versionierten Vertragsentscheidung erwogen.

### Einzelne Fokusreferenz

`featuredEntryId` ist die einzige Fokusquelle. Der Wert ist `null` oder eine
gültige ID, die exakt und case-sensitive auf einen vorhandenen Eintrag
verweist. Ein leerer Eintragsbestand erfordert daher `null`. Es gibt weder ein
`isFeatured`-Feld pro Eintrag noch eine Kopie von Titel, Text, Datum oder Tags
auf Root-Ebene. Eine verwaiste Fokusreferenz ist ein ungültiger persistierter
Zustand.

Das spätere Löschen des hervorgehobenen Eintrags muss in derselben fachlichen
Mutation `featuredEntryId` auf `null` setzen und den vollständigen neuen
Snapshot gemeinsam validieren und speichern. Diese atomische Service-Regel
wird hier festgelegt, aber in diesem Contract-Slice noch nicht implementiert.

### Geplante lokale Persistenz und ihre Grenzen

Der spätere Storage-Slice soll bei jeder erfolgreichen Mutation den
vollständigen validierten LichtwaldLog-Zustand als JSON-Snapshot hinter einer
fachlichen Storage-Schicht und dem gemeinsamen `StorageAdapter` speichern.
Der endgültige Storage-Key und ein Preflight für die serialisierte Gesamtgröße
werden bewusst erst dort festgelegt. Diese Entscheidung erfindet weder einen
Key noch eine pauschale Grenze wie eine Million Zeichen.

`localStorage` bleibt ein späterer unverschlüsselter lokaler Speicher für das
aktuelle Browserprofil und die aktuelle Origin. Er ist weder Secret-Store noch
Cloud-Sicherung oder geräteübergreifende Synchronisierung. Browser-Quota, das
Löschen des Browserprofils, verlorene Daten und überholte Änderungen zwischen
mehreren Tabs bleiben bekannte Grenzen. Eine Full-Snapshot-Schreiboperation
ist keine Transaktion und garantiert keine Multi-Tab-Konsistenz.

`dataOrigin` klassifiziert ausschließlich die fachliche Herkunft als
`private` oder `synthetic`. Das Feld verschlüsselt nichts, authentifiziert
keine Person und bildet keine technische Zugriffssperre. Ein späterer privater
Storage wird ausschließlich `private` akzeptieren; diese Storage-Regel gehört
nicht zum aktuellen Slice.

### Datenschutz, Binärdaten und Phasengrenzen

Tests, Dokumentationsbeispiele und spätere Repository-Demos verwenden nur neu
erfundene synthetische Daten. Private Reflexionen, reale Erlebnisse,
Gesundheits- oder Trainingsdaten gelangen nicht in das Repository oder in
Fehlermeldungen.

Bilder und andere Binärdaten sind aus `v0.2.2` vollständig ausgeschlossen.
Schema 1 enthält weder Base64-Daten noch Bildpfade, EXIF-Metadaten oder andere
Bildreferenzen. Stimmung, Energie, Gesundheitswerte, Trainingsmetriken,
Airtable-IDs, Sync-Zustände, Agentenmetadaten und KI-Ausgaben sind ebenfalls
keine Vertragsfelder.

Der Slice führt keine externe Kommunikation, Webhooks, Airtable-Anbindung,
Agenten- oder KI-Logik ein. Aus dem rein lokalen Datenvertrag wird keine
formale Konformität mit dem EU AI Act oder einem anderen KI-Regelwerk
abgeleitet oder behauptet.

## Konsequenzen

Positive Auswirkungen:

- ein kleiner, geschlossener Vertrag bildet den bekannten lokalen
  Journalinhalt ohne spätere Infrastrukturfelder ab;
- Kalenderdaten bleiben frei von Zeitzonenverschiebungen;
- eine einzige referenzielle Fokusquelle verhindert widersprüchliche
  Hervorhebungen und Inhaltsduplikate;
- vollständige Fehlerakkumulation, feste Limits und Rohwert-Redaktion schaffen
  eine belastbare Grenze für spätere Storage- und Service-Slices;
- flache, eigenständige Einträge lassen sich später fachlich einem externen
  Record zuordnen, ohne jetzt Airtable-Felder einzuführen.

Kosten und Einschränkungen:

- jeder spätere Full-Snapshot-Save validiert und serialisiert den gesamten
  Zustand;
- Schema 1 besitzt keine technischen Änderungszeitpunkte, Bilder oder
  Versionshistorie;
- eine Fokusänderung und das Löschen des fokussierten Eintrags benötigen eine
  gemeinsame Service-Mutation;
- Storage-Key, Gesamtgrößen-Preflight, Quota-Behandlung und Multi-Tab-Verhalten
  bleiben bis zu ihren jeweiligen Slices offen;
- der Contract allein macht das LichtwaldLog noch nicht persistent oder
  bedienbar.

## Erwogene Alternativen

### `isFeatured` an jedem Eintrag

Mehrere Einträge könnten gleichzeitig als hervorgehoben persistiert werden.
Eine einzelne Root-Referenz bildet die fachliche Kardinalität direkt ab.

### Kopie des Fokus-Eintrags auf Root-Ebene

Eine Kopie von Titel, Text, Datum oder Tags könnte nach einer Bearbeitung vom
autoritativen Eintrag abweichen und private Inhalte unnötig duplizieren.

### Technische Zeitstempel in Schema 1

Für den aktuellen lokalen CRUD-Vertrag sind keine fachlichen Regeln für
Erstellungs- oder Änderungszeiten beschlossen. Platzhalterfelder würden eine
spätere Semantik vorwegnehmen.

### Kalenderdatum über `Date` parsen

JavaScript-Datumsparsing kann Werte normalisieren oder Zeitzonenbedeutung
einführen. Eine direkte gregorianische Kalenderprüfung ist für `YYYY-MM-DD`
eindeutiger.

### Bilder als Base64 oder Pfad speichern

Base64 würde Browser-Quota und Snapshot-Größe stark belasten; lokale Pfade
sind nicht portabel und bilden keine belastbare Berechtigung. Bilder bleiben
für den gesamten Meilenstein ausgeschlossen.

### Storage-Key und Gesamtgrößenlimit bereits festlegen

Beides benötigt den konkreten Storage-Datenfluss, Serialisierungs-Preflight und
Fehlervertrag des nächsten Slices. Vorzeitige Zahlen oder Namespaces würden
ohne Implementierung eine Scheinsicherheit erzeugen.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- Storage, Service und Löschoperationen eingeführt werden;
- ein serialisiertes Gesamtgrößenlimit fachlich bestimmt werden kann;
- technische Zeitstempel, Versionshistorie oder Import/Export benötigt werden;
- Bilder in einem späteren Meilenstein mit einer geeigneten Binärspeicher- und
  Datenschutzarchitektur beschlossen werden;
- Multi-Tab-Koordination, Synchronisierung oder ein Backend eingeführt wird;
- eine neue Vertragsversion eine dokumentierte Migration benötigt.

## Verwandte Dokumente

- [`ADR 0004`](0004-private-demo-separation.md)
- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
