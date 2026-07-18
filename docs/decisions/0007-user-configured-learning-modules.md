# ADR 0007: Nutzerkonfigurierte LearningModules mit trackbaren Kapiteln und LearningNodes

## Status

Angenommen – 2026-07-18

Ersetzt [ADR 0006](0006-learning-catalog-hierarchy-and-nodes.md).

## Kontext

ADR 0006 legte eine feste Hierarchie aus Course, Module, Unit und Chapter sowie
normalisierte, typisierte LearningNodes fest. Diese Struktur entspricht nicht
mehr dem nutzerkonfigurierten LearningHub: Nutzer sollen mehrere Module direkt
im Hub anlegen und deren Inhalte als Kapitel mit selbst erstellten Textkarten
strukturieren können.

Der Inhaltsvertrag soll ausschließlich die fachliche Gliederung beschreiben.
Kapitelabschluss, Fortschritt, Testkompetenz und UI-Aktionen besitzen andere
Lebenszyklen und dürfen nicht mit Inhaltsdaten vermischt werden. Private
Lerninhalte dürfen weiterhin nicht in synthetische Portfolio-Daten einfließen.

## Entscheidung

Die verbindliche Hierarchie des LearningHub lautet ab Schema 2:

```text
LearningHub
  → LearningModule
  → LearningChapter
  → LearningNode
```

Der LearningHub enthält mehrere LearningModules direkt in seinem `modules`-
Array. Eine Course- oder Unit-Ebene ist nicht Teil des Vertrags. Ein neuer Hub
darf noch keine Module enthalten; jedes vertragsgültige persistierbare Modul
enthält jedoch mindestens ein Kapitel.

Alle Kapitel sind implizit trackbar. Der Inhaltsvertrag speichert deshalb kein
`isTrackable`-Feld. Ein Kapitel darf noch keine LearningNodes enthalten.
LearningNodes sind selbst erstellte Textkarten innerhalb genau eines Kapitels
und besitzen Titel und Textinhalt. Sie benötigen keine Knotentypen,
`parentId`- oder Rekursionsfelder.

Kapitelabschluss und Fortschritt werden später in einem separaten Vertrag
modelliert. Dieser soll Kapitelzustandswechsel append-only als unveränderliche
Lernereignisse wie `chapter.started`, `chapter.completed` und
`chapter.reopened` erfassen. Die Ereignisse gehören nicht zum
Schema-2-Inhaltsvertrag; Schema 2 implementiert noch kein Ereignisprotokoll.
Das spätere Modell darf xAPI-inspiriert sein, beansprucht aber keine
xAPI-Konformität, verwendet noch kein LRS und behauptet kein vollständiges
Event Sourcing.

Aktueller Kapitelstatus und Modulfortschritt werden später aus den
Lernereignissen abgeleitet oder als überprüfbare Projektion bereitgestellt. Ein
zu 100 Prozent abgeschlossenes Modul bleibt erhalten und soll weiterhin für
spätere Tests auswählbar sein. Testkompetenz bleibt davon getrennt: Sie geht
erst aus späteren Lerntests hervor und verändert den Fortschritt nicht
automatisch.

Aktionen auf LearningNodes, etwa Erstellen, Bearbeiten, Löschen oder
Umsortieren, sind Fähigkeiten von Controller und UI. Sie werden nicht als
Buttons, Aktionsdefinitionen oder Zustandsfelder im Datenvertrag gespeichert.

Schema 2 kennzeichnet Daten als `synthetic` oder `private`. Synthetische
Demo-Daten werden unabhängig erfunden. Private Nutzerdaten verwenden getrennte
Datenquellen und werden weder aus Demo-Daten abgeleitet noch in
Repository-Demos übernommen. `dataOrigin` dokumentiert die Herkunft, ersetzt
aber keine technische Trennung.

Schema 1 und unbekannte Schemaversionen werden abgelehnt. Eine Migration ist
nicht erforderlich, weil keine LearningHub-Nutzerdaten nach Schema 1
persistiert wurden.

## Konsequenzen

Positive Auswirkungen:

- mehrere nutzerkonfigurierte Module werden unmittelbar unterstützt;
- die Hierarchie enthält nur aktuell benötigte Fachebenen;
- Inhaltsstruktur, Fortschritt, Kompetenz und UI-Zustand bleiben getrennt;
- abgeschlossene Module bleiben als Lern- und Testinhalt erhalten;
- synthetische Demo-Daten und private Nutzerdaten bleiben klar getrennt;
- der verschachtelte Vertrag kommt ohne Knotentypen und Elternverweise aus.

Kosten und Einschränkungen:

- Schema-1-Konsumenten müssen vollständig auf Schema 2 umgestellt werden;
- alte Kompatibilitäts-Exporte werden nicht beibehalten;
- Kapitelabschluss, Fortschritt und Testkompetenz benötigen spätere eigene
  Verträge;
- der Vertrag definiert weder Persistenz noch Storage-, Controller- oder
  UI-Verhalten;
- `dataOrigin` allein bildet keine Sicherheitsgrenze.

## Erwogene Alternativen

### Course- und Unit-Ebene beibehalten

Diese Ebenen bilden keinen benötigten Bestandteil des nutzerkonfigurierten
LearningHub ab und würden den Vertrag an die abgelöste feste Kurshierarchie
binden.

### Normalisierte typisierte LearningNodes beibehalten

Kapitel, Sections und Subsections mit `parentId` wären für selbst erstellte
Textkarten unnötig komplex. Die verschachtelte Struktur bildet Eigentum und
Reihenfolge unmittelbar ab.

### Fortschritt und Aktionen im Inhaltsvertrag speichern

Abschlusswerte, Kompetenz, Auswahlzustände und Aktionen ändern sich unabhängig
vom Lerninhalt oder gehören zur Controller- beziehungsweise UI-Schicht. Ihre
Aufnahme würde unterschiedliche Verantwortlichkeiten vermischen.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn mehrere Kurse eine eigene Course-Ebene
benötigen, LearningNodes andere Inhaltstypen oder Beziehungen abbilden müssen,
persistierte Daten eine Migration erfordern oder spätere Fortschritts- und
Testverträge andere fachliche Grenzen nachweisen.

## Verwandte Dokumente

- [`ADR 0006`](0006-learning-catalog-hierarchy-and-nodes.md)
- [`ADR 0004`](0004-private-demo-separation.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
