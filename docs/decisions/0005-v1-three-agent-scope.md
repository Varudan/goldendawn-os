# ADR 0005: Version 1 bleibt auf drei Agenten begrenzt

## Status

Angenommen – 2026-07-11

## Kontext

GoldenDawn OS besitzt langfristig viele mögliche Anwendungsbereiche. Zu viele
Agenten in der ersten Version würden jedoch Verträge, Workflows, Tests,
Fehlerbilder und Datenmodelle gleichzeitig vervielfachen. Der Portfolio-Wert
entsteht nicht durch eine hohe Agentenzahl, sondern durch nachvollziehbare
Orchestrierung und klare Verantwortung.

## Entscheidung

Version 1 verwendet ausschließlich:

- SyncAgent für Kommunikation, Validierung und Routing;
- TestAgent für Erstellung und Bewertung von Lerntests;
- DatenAgent für strukturierte Datenoperationen und Airtable.

Weitere Agenten werden weder implementiert noch in Version 1 nebenbei
vorbereitet. Neue Rollen werden erst nach dem Portfolio-Release anhand eines
konkreten Problems bewertet.

## Konsequenzen

Positive Auswirkungen:

- überschaubarer und testbarer Systemumfang;
- klare Demonstration von Orchestrierung, Fachlogik und Datenkapselung;
- weniger Prompt-, Workflow- und Berechtigungskomplexität;
- höhere Wahrscheinlichkeit, Version 1 vollständig abzuschließen.

Kosten und Einschränkungen:

- weitere Ideen wie Wochenreview, E-Mail oder Lichtwald-Prozesse bleiben
  zunächst manuell oder lokal;
- der DatenAgent verarbeitet mehrere erlaubte Entitätstypen;
- neue Funktionen müssen sich in die drei Rollen einordnen oder warten.

## Erwogene Alternativen

### Ein einzelner universeller Agent

Ein Agent wäre anfangs einfacher, würde aber Fachlogik, Datenzugriff und Routing
vermischen und den Multi-Agenten-Lernwert reduzieren.

### Viele spezialisierte Agenten ab Version 1

Dies würde die Vision früher sichtbar machen, aber Scope, Fehlerflächen und
Dokumentationsaufwand unverhältnismäßig erhöhen.

## Bedingungen für eine Neubewertung

Ein neuer Agent wird erst erwogen, wenn:

- Version 1 stabil und dokumentiert veröffentlicht wurde;
- ein konkretes Problem keiner bestehenden Rolle sauber zugeordnet werden kann;
- Ein- und Ausgabevertrag, Datenzugriffe und Sicherheitsgrenzen definiert sind;
- Nutzen und zusätzlicher Betriebsaufwand nachvollziehbar abgewogen wurden.

## Verwandte Dokumente

- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/roadmap.md`](../roadmap.md)
