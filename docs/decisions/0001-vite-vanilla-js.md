# ADR 0001: Vite und Vanilla JavaScript als Frontend-Grundlage

## Status

Angenommen – 2026-07-11

## Kontext

GoldenDawn OS beginnt als persönliches Dashboard und Portfolio-Projekt. Die
erste Version benötigt eine schnelle lokale Entwicklungsumgebung, klare
Browserstandards und möglichst wenig technische Komplexität. Der vorherige
Prototyp hat gezeigt, dass Vite, HTML, CSS und Vanilla JavaScript für die ersten
Module ausreichen.

Ein Framework oder eigenes Backend würde bereits zu Projektbeginn zusätzliche
Abhängigkeiten, Konzepte und Wartungsaufwand einführen, ohne einen aktuell
nachgewiesenen Nutzen zu liefern.

## Entscheidung

Das Frontend von Version 1 verwendet:

- Vite als Entwicklungs- und Build-Werkzeug;
- Vanilla JavaScript mit ES-Modulen;
- semantisches HTML;
- natives CSS;
- Browser-APIs, sofern sie die Anforderung zuverlässig erfüllen.

React oder ein anderes Frontend-Framework sowie ein eigenes Backend werden
nicht eingeführt, solange keine dokumentierte Anforderung dies rechtfertigt.

## Konsequenzen

Positive Auswirkungen:

- kleine und verständliche technische Grundlage;
- schneller Start und kurze Build-Zeiten;
- direkter Lernwert für Webstandards und JavaScript;
- wenig Abhängigkeits- und Updateaufwand;
- gute Eignung für ein lokal-first MVP.

Kosten und Einschränkungen:

- Komponenten-, Routing- und Zustandsmuster müssen bewusst selbst strukturiert
  werden;
- sehr komplexe UI-Zustände könnten später mehr eigenen Code erfordern;
- Framework-spezifische Ökosystemfunktionen stehen nicht automatisch bereit.

## Erwogene Alternativen

### React

React wäre für große Komponentenbäume und komplexe Zustände geeignet, erhöht
aber für den aktuellen Umfang Abhängigkeiten und Abstraktion.

### Eigenes Backend ab Projektbeginn

Ein Backend könnte Secrets und Authentifizierung kapseln, ist für das lokale
MVP jedoch noch nicht erforderlich. Externe Orchestrierung erfolgt zunächst in
n8n. Vor einem öffentlichen verbundenen Deployment wird diese Grenze neu
bewertet.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn mindestens eines zutrifft:

- UI-Zustände lassen sich mit der bestehenden Struktur nicht mehr sicher
  beherrschen;
- serverseitige Authentifizierung wird benötigt;
- mehrere Benutzer oder Rollen werden eingeführt;
- serverseitiges Rendering wird zu einer echten Anforderung;
- wiederkehrende Eigenlösungen verursachen mehr Aufwand als ein Framework.

## Verwandte Dokumente

- [`AGENTS.md`](../../AGENTS.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/roadmap.md`](../roadmap.md)
