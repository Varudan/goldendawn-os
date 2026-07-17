# ADR 0006: Feste LearningHub-Hierarchie mit normalisierten LearningNodes

## Status

Angenommen – 2026-07-17

## Kontext

Der LearningHub benötigt für `v0.2.1` einen kleinen, stabilen Katalogvertrag.
Die sichtbare Struktur soll verständlich bleiben, während Units Inhalte mit
unterschiedlichen Gliederungstiefen abbilden können. Rekursive Bäume oder
mehrere verschieden tiefe Arrays würden Verarbeitung und Validierung unnötig
erschweren. Reale Kursinhalte dürfen zudem nicht in die öffentliche
Portfolio-Demo gelangen.

## Entscheidung

Die sichtbare LearningHub-Haupthierarchie bleibt verbindlich:

```text
Course → Module → Unit → Chapter
```

Innerhalb jeder Unit bildet eine flache Liste normalisierter `LearningNode`-
Objekte die Gliederung ab. Schema 1 unterstützt `chapter`, `section` und
`subsection`. Stabile `parentId`-Verweise bilden `section → chapter` und
`subsection → section` innerhalb derselben Unit ab. Kapitel besitzen keinen
Elternknoten. Nur Kapitel sind in Schema 1 mit `isTrackable: true` für einen
späteren Fortschrittsvertrag vorgesehen.

Der Envelope kennzeichnet seine Herkunft mit `dataOrigin: "synthetic"` oder
`dataOrigin: "private"`. Öffentliche Demo-Kataloge enthalten ausschließlich
neu erfundene synthetische Inhalte. Private Laufzeitkataloge werden nicht aus
Demo-Daten abgeleitet und nicht als Repository-Seeds eingecheckt. Die
Herkunftskennzeichnung ersetzt keine getrennten Datenquellen.

## Konsequenzen

Positive Auswirkungen:

- die sichtbare Fachhierarchie bleibt verständlich;
- eine flache Knotenliste unterstützt mehrere Gliederungstiefen;
- globale IDs und lokale Elternregeln sind deterministisch validierbar;
- synthetische Demo-Daten bleiben fachlich von privaten Inhalten getrennt.

Kosten und Einschränkungen:

- Konsumenten müssen Elternverweise für eine Baumdarstellung auflösen;
- neue Knotentypen oder Trackable-Ebenen erfordern eine Vertragsänderung;
- `dataOrigin` allein ist keine Sicherheitsgrenze;
- Fortschritt, Notizen, Tests und Persistenz benötigen spätere Verträge.

Ein späteres append-only Lernereignisprotokoll darf xAPI-inspiriert entworfen
werden. Diese Entscheidung behauptet weder xAPI-Konformität noch ein LRS oder
Event Sourcing und führt kein solches Protokoll ein.

## Erwogene Alternativen

### Vollständig rekursiver Inhaltsbaum

Ein rekursiver Baum erschwert globale Eindeutigkeits-, Eltern- und
Zyklusprüfungen sowie spätere Referenzen.

### Eigene Arrays für jede Gliederungsebene

Getrennte Arrays koppeln den Vertrag stärker an die derzeitige Tiefe und
erschweren eine einheitliche Verarbeitung.

### Demo aus bereinigten privaten Inhalten

Auch bereinigte reale Inhalte können Rückschlüsse erlauben. Die Demo verwendet
daher ausschließlich unabhängig erstellte synthetische Daten.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn weitere Knotentypen fachlich nötig sind,
andere Ebenen trackbar werden, mehrere Kurse wesentlich andere Hierarchien
benötigen oder ein späterer Persistenzvertrag andere Grenzen verlangt.

## Verwandte Dokumente

- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`ADR 0004`](0004-private-demo-separation.md)
