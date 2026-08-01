# ADR 0015: Getrennte synthetische LichtwaldLog-Demo-Runtime

## Status

Angenommen – 2026-08-01

## Kontext

Der private LichtwaldLog-Pfad aus ADR 0014 speichert ausschließlich
`dataOrigin: private` als begrenzten Full-Snapshot unter
`goldendawn.lichtwaldLog.content.v1`. Für den Portfolio-Nachweis von
`v0.2.2` wird zusätzlich ein vollständig bedienbarer Beispieldatensatz benötigt.
Öffentlich eingecheckte Beispieldaten dürfen weder private Einträge ableiten
noch in den privaten Storage-, Service- oder Browserdatenfluss gelangen.
[ADR 0004](0004-private-demo-separation.md) legt die fachliche Trennung
privater und öffentlicher Daten unabhängig von der eingesetzten Technologie
fest; ADR 0015 konkretisiert diese Grundentscheidung für die beiden lokalen
LichtwaldLog-Runtime-Stacks und ersetzt sie nicht.

Eine bloße Kennzeichnung einzelner Einträge genügt nicht: Eine gemeinsame
veränderliche Wahrheit, ein Herkunftswechsel oder ein Fallback könnte
synthetische und private Daten trotz sichtbarer Labels technisch vermischen.
Die Demo muss außerdem während der aktuellen Seitensitzung editierbar bleiben,
ohne einen neuen Browser-Storage-Key oder eine versteckte Persistenz
einzuführen.

## Entscheidung

LichtwaldLog erhält zwei ausdrücklich komponierte und vollständig getrennte
Laufzeitstapel:

```text
Private LichtwaldLogView
  → LichtwaldLogController(expectedDataOrigin: private)
  → LichtwaldLogService
  → LichtwaldLogStorage
  → StorageAdapter
  → localStorage

Synthetische LichtwaldLogView
  → LichtwaldLogController(expectedDataOrigin: synthetic)
  → LichtwaldLogDemoService
  → LichtwaldLogDemoStorage
  → In-Memory-Full-Snapshot
  → kanonische LichtwaldLog-Demo-Factory
```

`dataOrigin` ist in beiden Stacks ausschließlich eine fachliche
Herkunftsklassifikation und keine technische Zugriffskontrolle. Die technische
Trennung entsteht durch getrennte Storage-, Service-, View-, Controller- und
ID-Generator-Instanzen sowie dadurch, dass nur der private Stack den
`StorageAdapter` und `localStorage` erreichen kann.

Die kanonische Demoquelle ist statisch tief eingefroren, vollständig
synthetisch und deterministisch. Jeder Factory-Aufruf liefert einen frischen,
vollständig entkoppelten Schema-1-Snapshot mit `dataOrigin: synthetic`. Die
Quelle enthält genau fünf erfundene Einträge und eine gültige Fokusreferenz.

Jede Instanz von `LichtwaldLogDemoStorage` erzeugt ihren Seed einmal und hält
danach ausschließlich einen defensiv validierten synthetischen Full-Snapshot im
Arbeitsspeicher. Sie verwendet weder `localStorage`, `sessionStorage`,
`StorageAdapter` noch einen Browser-Key. Mutationen überleben deshalb das
Schließen und erneute Öffnen der Demo innerhalb desselben Dokuments. Ein
Reload oder eine neue Anwendungskomposition erzeugt eine neue Storage-Instanz
und damit wieder den kanonischen Seed. Es gibt keine öffentliche Reset-,
Import-, Export-, Debug- oder Migrationsoperation.

`LichtwaldLogDemoService` ist eine eigenständige synthetische
Fachimplementierung. Er importiert weder privaten Service noch privaten
Storage, hält keinen Cache und lädt für jede gültige Operation den aktuellen
Demo-Snapshot. Seine fünfteilige API und fachlichen CRUD-, Fokus-, No-op-,
Validierungs-, Reihenfolge-, Kapazitäts- und ID-Versuchsregeln entsprechen dem
privaten Service, bleiben aber vollständig auf `dataOrigin: synthetic` und die
Demo-Storage-Grenze beschränkt.

Der wiederverwendete Controller erhält beim Erzeugen optional
`expectedDataOrigin`. Fehlend oder `undefined` bedeutet aus
Rückwärtskompatibilität exakt `private`; ausschließlich `private` und
`synthetic` sind gültig. Die Entscheidung bleibt für den gesamten Lifecycle
fest. Jeder Service-Snapshot wird vollständig validiert und muss exakt dieser
Herkunft entsprechen. Aus der Konfiguration wird nur der flüchtige
Darstellungswert `runtimeMode: private` beziehungsweise
`runtimeMode: syntheticDemo` projiziert; er wird niemals aus einem Snapshot
abgeleitet und ist kein Vertragsfeld.

`src/main.js` erzeugt beide Stacks mit eigenen Storage-, Service-, View-,
Controller- und ID-Generator-Lebenszyklen. Die Navigation wechselt nur nach
erfolgreichem `close()` der aktiven Instanz. Private und synthetische Views
werden niemals gleichzeitig montiert. Es gibt keinen automatischen Fallback,
keine Konvertierung, kein Seeding des privaten Stores und keinen Datentransfer
zwischen den Stacks.

Die Demo-View ist dauerhaft und nicht nur farblich als synthetische,
vollständig erfundene Sitzung gekennzeichnet. Sie erklärt sichtbar, dass
Änderungen nur bis zum Neuladen der Seite bestehen. Private Speicherhinweise
und Aussagen über dauerhaftes Löschen werden im Demo-Modus nicht verwendet.
Auswahl, Formulare, Filter, Feedback sowie Fokus- und Caretmetadaten bleiben
flüchtige UI-Zustände und werden beim erfolgreichen Schließen verworfen.

## Konsequenzen

- Private Browserdaten und der private Storage-Key bleiben bytegenau außerhalb
  des Demo-Datenflusses.
- Die Demo benötigt keinen neuen Browser-Key, keine Netzwerkverbindung, keine
  Abhängigkeit und keine Migration.
- Navigation innerhalb eines Dokuments demonstriert echte Mutationen; Reload
  und neue Komposition stellen reproduzierbar den kanonischen Seed her.
- Beide Stacks nutzen denselben Schema-1-Vertrag, dieselbe reine Suchableitung
  und dieselbe sichere View-/Controller-Grenze, ohne eine veränderliche
  Datenquelle zu teilen.
- Herkunftsfehler schließen kontrolliert fehl. Weder private noch synthetische
  Daten werden umklassifiziert, repariert oder als Fallback übernommen.
- Das 500.000-Codeeinheiten-Limit gilt auch für den tatsächlich serialisierten
  In-Memory-Demo-Snapshot. Es ist dort eine kontrollierte Anwendungsgrenze,
  keine Browser-Quota-Aussage.
- `v0.2.2` bleibt lokal, in Arbeit und unveröffentlicht. Externe
  Kommunikation, Webhooks, Airtable, Agentenlogik und Weekly Review werden
  nicht eingeführt.

## Erwogene Alternativen

### LearningHub-artigen Seed als private Arbeitskopie speichern

Verworfen. Anders als beim ausdrücklich begrenzten LearningHub-Erststart würde
dies Demo- und Privatbestand im selben LichtwaldLog-Key und Lebenszyklus
vermischen und könnte private Daten ergänzen oder überschreiben.

### Gemeinsamen privaten Key mit Demo-Flag verwenden

Verworfen. Ein Demo-Flag innerhalb
`goldendawn.lichtwaldLog.content.v1` wäre nur eine fachliche Markierung
in derselben veränderlichen Wahrheit. Ein falscher Filter oder Modus könnte
beide Herkünfte lesen oder überschreiben; der private Key bleibt deshalb
ausschließlich dem privaten Schema-1-Root vorbehalten.

### Zweiten Demo-`localStorage`-Key verwenden

Verworfen. Ein weiterer Browser-Key wäre unnötige Persistenz, erschwerte die
vollständige Trennung und widerspräche der sichtbaren Reload-Semantik.
`sessionStorage` wäre aus denselben Gründen keine Alternative.

### Bei privatem Loadfehler automatisch die Demo laden

Verworfen. Ein privater Ladefehler muss im privaten Stack als kontrollierter
Fehler sichtbar bleiben. Ein automatischer Wechsel zur Demo würde den
angeforderten Bestand verschleiern und Herkunft sowie Runtime-Modus implizit
ändern.

### Anonymisierte oder umformulierte private Daten als Demo verwenden

Verworfen. Auch abgewandelte reale Inhalte können Rückschlüsse auf private
Themen und Strukturen zulassen. In Übereinstimmung mit ADR 0004 stammen alle
Demo-Einträge ausschließlich aus unabhängig neu erfundenen Inhalten.

### Statische Read-only-Demo ohne CRUD anbieten

Verworfen. Der Portfolio-Nachweis soll denselben lokalen CRUD- und Fokusfluss
einschließlich Mutationsgrenzen zeigen. Eine unveränderliche Beispielsicht
würde diese fachlichen und technischen Eigenschaften nicht nachweisen.

### Modus in derselben Serviceinstanz wechseln

Verworfen. Eine umschaltbare Serviceinstanz müsste private und synthetische
Dependencies oder Ports zugleich kennen und könnte Zustand, IDs oder
Fehlerpfade zwischen beiden Modi teilen. Der Modus bleibt daher
konstruktionsgebunden und jeder Stack besitzt eine eigene Serviceinstanz.

### Privaten Service oder privaten Storage intern wiederverwenden

Verworfen. Gemeinsame Fach- oder Persistenzinstanzen würden die Herkunfts- und
Portgrenze aufweichen. Gemeinsame reine Vertrags-, Such- und
Darstellungskomponenten reichen für konsistentes Verhalten aus.

### Runtime-Modus aus `dataOrigin` des geladenen Snapshots ableiten

Verworfen. Ein nicht vertrauenswürdiger oder fehlerhafter Dependency-Snapshot
dürfte damit Darstellung und erwartete Herkunft selbst bestimmen. Der Modus
wird ausschließlich bei der Komposition festgelegt.

### Bei Demo-Fehlern auf private Daten zurückfallen

Verworfen. Jeder Fallback oder Crossover könnte private Inhalte in der
öffentlichen Demo anzeigen. Fehler bleiben innerhalb des aktiven Stacks.

### Einen Reset-Button für die Demo anbieten

Verworfen. Reload beziehungsweise eine neue Komposition besitzt bereits eine
eindeutige Seed-Semantik. Eine zusätzliche öffentliche Operation würde die
kleine Storage-API und die Controller-Action-API unnötig erweitern.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn eine Demo über einen Reload hinweg
persistieren soll, ein Import oder Export eingeführt wird, mehrere
gleichzeitige Demo-Sitzungen unterstützt werden sollen oder ab `v0.3.0` ein
externer minimierter LichtwaldLog-Vertrag entsteht. Jede solche Änderung
benötigt eine neue Datenherkunfts-, Sicherheits-, Persistenz- und
Migrationsentscheidung; ein stiller Fallback auf private Daten bleibt
ausgeschlossen.
