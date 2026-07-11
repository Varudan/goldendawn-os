# ADR 0004: Private und öffentliche Daten strikt trennen

## Status

Angenommen – 2026-07-11

## Kontext

GoldenDawn OS ist gleichzeitig ein persönliches System und ein öffentlich
vorzeigbares Portfolio-Projekt. Reale Lern-, Reflexions- oder spätere
Gesundheitsdaten dürfen nicht versehentlich in einer Demo, in Logs oder im
Repository erscheinen.

Eine reine UI-Kennzeichnung reicht als Trennung nicht aus, weil ein falsch
konfigurierter Workflow weiterhin auf private Daten zugreifen könnte.

## Entscheidung

Private Umgebung und öffentliche Demo verwenden getrennte:

- Datenquellen beziehungsweise Airtable-Bases;
- Tokens und n8n-Credentials;
- Workflows und Konfigurationen;
- Deployments und Zugriffsgrenzen;
- Logs und Ausführungsdaten.

Die öffentliche Demo verwendet ausschließlich neu erstellte synthetische
Daten. Es gibt keinen automatischen Fallback von der Demo auf private
Datenquellen.

## Konsequenzen

Positive Auswirkungen:

- deutlich geringeres Risiko einer privaten Datenoffenlegung;
- Demo-Tokens können minimal berechtigt und getrennt rotiert werden;
- öffentliche Tests beeinflussen keine persönlichen Daten;
- die Trennung ist im Portfolio klar erklärbar.

Kosten und Einschränkungen:

- Workflows und Konfigurationen müssen teilweise doppelt gepflegt werden;
- Demo-Daten benötigen eigene Seed- und Bereinigungsprozesse;
- Deployments brauchen sichtbare und überprüfbare Umgebungskennzeichnung.

## Erwogene Alternativen

### Gemeinsame Base mit Demo-Kennzeichen

Ein Feld wie `isDemo` reduziert den organisatorischen Aufwand, verhindert aber
keinen Fehlzugriff und ist deshalb als alleinige Grenze ungeeignet.

### Anonymisierte Kopie privater Daten

Auch veränderte reale Inhalte können Rückschlüsse erlauben. Die Demo verwendet
daher synthetische, neu erstellte Daten.

## Bedingungen für eine Neubewertung

Die Entscheidung wird nur überprüft, wenn eine spätere Plattform nachweislich
starke Mandanten-, Rollen- und Umgebungsisolation bietet. Die fachliche Trennung
privater und öffentlicher Daten bleibt unabhängig von der Technologie bestehen.

## Verwandte Dokumente

- [`docs/security.md`](../security.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/roadmap.md`](../roadmap.md)
