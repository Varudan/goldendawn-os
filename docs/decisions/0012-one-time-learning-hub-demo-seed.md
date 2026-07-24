# ADR 0012: Einmaliger koordinierter LearningHub-Demo-Erststart

## Status

Angenommen – 2026-07-22

## Kontext

Die LearningHub-Foundations trennten Repository-Demos bisher vollständig von
den privaten lokalen Inhalts-, Artifact- und LearningTest-Stores. Das schützt
vor einer Vermischung mit Nutzerdaten, führt bei einem frischen Browserprofil
aber zu einer leeren Oberfläche, obwohl Inhaltsverwaltung, Notizen,
Zusammenfassungen und der lokale Mock-Test gemeinsam demonstriert werden
sollen.

Ein LearningHub-Demo besteht nicht aus einem einzelnen Wert. Modulstruktur,
LearningArtifacts und Testfragen liegen absichtlich in drei getrennten
Fachstores. Unabhängiges Lazy-Seeding durch diese Dienste könnte Teilzustände,
verwaiste Referenzen oder spätere Wiederherstellungen eines bewusst gelöschten
Demos erzeugen. `localStorage` bietet zugleich keine Transaktion über mehrere
Keys.

Diese Entscheidung ergänzt ADR 0004, 0008, 0010 und 0011 gezielt für den
einmaligen lokalen Erststart. Die allgemeine Trennung privater Inhalte von
synthetischen Repository-Daten und die getrennten Fachverträge bleiben
erhalten.

## Entscheidung

- Das Repository besitzt genau eine kanonische, tief eingefrorene
  Seed-Definition für einen vollständig synthetischen LearningHub mit einem
  klar als `[Demo]` markierten Modul, seinen acht LearningArtifacts und sieben
  Single-Choice-Fragen. IDs und erforderliche Zeitstempel sind fest und
  laufzeitunabhängig.
- `src/main.js` ruft vor der Erstellung des nutzbaren LearningHub-Flusses einen
  kleinen synchronen Initialisierungskoordinator auf. Er ist weder ein eigener
  Modus noch ein Import- oder Netzwerkpfad.
- Ein Seed ist nur erlaubt, wenn Inhaltsstore, Artifact-Store, Testbank und der
  Initialisierungsmarker sämtlich fehlen. Bereits ein vorhandener Key – auch
  ein gültiger leerer oder nicht auswertbarer Wert – verhindert jede
  Ergänzung und jedes Überschreiben.
- Die kanonische Repository-Quelle trägt `dataOrigin: synthetic`. Vor der
  Speicherung entsteht daraus eine defensive Arbeitskopie mit
  `dataOrigin: private`, weil die drei bestehenden lokalen Fachstorages
  ausschließlich private Arbeitszustände akzeptieren. Die sichtbare
  `[Demo]`-Kennzeichnung bleibt erhalten; private Nutzerinhalte werden nicht
  in die Seed-Quelle übernommen.
- Hub, Artifact-Store und Testbank werden vor dem ersten Write vollständig mit
  ihren Produktionsvalidatoren sowie gemeinsam auf ihre Modul-, Kapitel- und
  LearningNode-Referenzen geprüft. Anschließend schreibt der Koordinator
  sequenziell über die bestehenden Fachstorages. Er legt weder Progress noch
  Attempts, Antworten, Ergebnisse oder Historieneinträge an.
- Ein eigener stabiler Marker unter
  `goldendawn.learningHub.demoInitialization.v1` speichert zuletzt die
  abgeschlossene Entscheidung `seeded` oder `skippedExistingData`. Ein
  vorhandener Marker gilt unabhängig von seinem auswertbaren Inhalt als
  abgeschlossen.
- Bei einem Schreibfehler wird jeder möglicherweise geschriebene Seed-Wert in
  umgekehrter Reihenfolge nur dann entfernt, wenn sein serialisierter Inhalt
  noch bytegenau dem vorbereiteten Seed entspricht. Fehlende Werte sind ein
  sicherer No-op; abweichende oder zwischenzeitlich geänderte Werte werden
  niemals entfernt.
- Wiederholte Aufrufe sind schreibfrei. Bearbeitungen bleiben erhalten. Bleibt
  der Marker nach einem späteren regulären Löschen bestehen, kehrt das Demo
  nicht zurück. Nur das vollständige Löschen des lokalen Anwendungsspeichers
  einschließlich Marker eröffnet einen neuen Erststart.
- Der gesamte Ablauf bleibt lokal und deterministisch. Er führt keine
  Netzwerk-, KI-, Agenten- oder Telemetrieaufrufe aus.

## Konsequenzen

- Ein frisches Browserprofil zeigt sofort einen zusammenhängenden lokalen
  Lernablauf mit Modul, Notizen, Zusammenfassungen und startbarem Mock-Test.
- Vorhandene Nutzerdaten werden weder ergänzt noch überschrieben oder mit
  Demo-IDs vermischt. Auch ein bewusst leer angelegter Fachstore bleibt
  autoritativ.
- Die drei Fachverträge und ihre Storage-Keys bleiben unverändert. Der Marker
  enthält keine Lerninhalte und ersetzt keinen Fachstore.
- Die kanonische Seed-Quelle bleibt synthetisch und unveränderlich; die lokal
  editierbare Kopie folgt weiterhin den privaten Produktionsgrenzen.
- Der bedingte Rollback reduziert das Risiko eines Teilzustands, ist aber keine
  echte Multi-Key-Transaktion oder Multi-Tab-Sperre. Kann ein Browser selbst
  den sicheren Rollback nicht mehr ausführen, wird dies als eigener Fehler
  gemeldet und kein fremder Wert gelöscht.
- Das bestehende schreibfreie Verhalten der einzelnen `load*`-Operationen
  bleibt erhalten. Nur der vorgelagerte Erststartkoordinator darf die drei
  fehlenden Stores gemeinsam initialisieren.

## Erwogene Alternativen

- **Demo nur im Arbeitsspeicher anzeigen:** würde Bearbeitung und den
  vollständigen lokalen Testfluss nicht realistisch demonstrieren.
- **Manueller Import-Button:** widerspricht dem gewünschten unmittelbaren
  Erststart und verlagert die Konsistenzentscheidung in die UI.
- **Jeden Store unabhängig beim ersten Load säen:** kann Teilzustände und
  verwaiste Referenzen erzeugen und würde Löschungen später unbeabsichtigt
  rückgängig machen.
- **Demo zu vorhandenen Daten hinzufügen:** verletzt die Nichtvermischung und
  könnte IDs, Positionen oder Nutzerentscheidungen überschreiben.
- **Alle Demo-Domänen in einen neuen Sammelstore verschieben:** würde die
  akzeptierten Inhalts-, Artifact- und LearningTest-Grenzen aufweichen und die
  produktiven Dienste umgehen.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- ein regulärer Lösch- oder Reset-Workflow den Marker ausdrücklich verwalten
  soll;
- eine transaktionale Persistenzschicht `localStorage` ersetzt;
- Multi-Tab-Koordination verbindlich unterstützt werden muss;
- der Demo-Datensatz versioniert oder migriert werden soll;
- private und öffentliche Deployments eine andere Initialisierungspolitik
  benötigen;
- LearningHub-Verträge oder Storage-Namespaces versioniert werden.
