# ADR 0008: Lokale LearningHub-Inhaltsverwaltung und -Persistenz

## Status

Angenommen – 2026-07-18

## Kontext

[ADR 0007](0007-user-configured-learning-modules.md) definiert den
Schema-2-Inhaltsvertrag des LearningHub mit der Hierarchie LearningHub,
LearningModule, LearningChapter und LearningNode. Die Foundation validiert
mehrere nutzerkonfigurierte Module, legt aber bewusst keine lokale
Anwendungsschicht oder Persistenz fest.

Für den nächsten Teil von `v0.2.1` müssen private LearningHub-Inhalte lokal
geladen und verändert werden können. Dabei dürfen UI-Komponenten nicht direkt
auf `localStorage` zugreifen. Ein persistierbares LearningModule benötigt
mindestens ein Kapitel, beschädigte Browserdaten dürfen nicht als leerer Hub
ausgegeben werden und die synthetische Repository-Demo darf nicht unbemerkt in
den privaten Speicher gelangen.

Inhalt, Fortschritt, Notizen und Testversuche besitzen unterschiedliche
Lebenszyklen. Eine gemeinsame persistierte Struktur würde diese Grenzen
vermischen und spätere Änderungen unnötig koppeln.

## Entscheidung

Der vollständige Zielpfad für lokale LearningHub-Inhalte lautet:

```text
LearningHubView
  → LearningHubController
  → LearningHubService
  → LearningHubStorage
  → StorageAdapter
  → localStorage
```

In diesem Arbeitspaket werden ausschließlich `createLearningHubService` und
`createLearningHubStorage` implementiert. `LearningHubView` und
`LearningHubController` folgen später und dürfen den Zielpfad noch nicht als
vollständig implementierten UI-Fluss darstellen.

### Fester Persistenznamespace

LearningHub-Inhalte verwenden ausschließlich diesen festen, nicht
nutzergesteuerten Storage-Key:

```text
goldendawn.learningHub.content.v1
```

Das `v1` im Key versioniert den Persistenz-Namespace. Der darin gespeicherte
Inhaltsvertrag verwendet weiterhin `schemaVersion: 2`. Der Schema-2-Hub wird
unmittelbar gespeichert; ein zusätzlicher Storage-Envelope oder eine zweite
JSON-Serialisierungslogik wird nicht eingeführt.

Kapitelabschluss und Fortschritt, Notizen und Zusammenfassungen sowie spätere
Testversuche erhalten eigene Verträge und eigene Storage-Keys. Ihre konkreten
Persistenzformate werden in dieser Entscheidung nicht vorweggenommen.

### LearningHubStorage

`createLearningHubStorage` erhält den gemeinsamen `StorageAdapter` per
Dependency Injection und stellt `loadLearningHub` sowie `saveLearningHub`
bereit. Es verwendet ausschließlich den festen LearningHub-Key. Die technische
JSON-Serialisierung und der Zugriff auf die Browser-Implementierung bleiben im
gemeinsamen `StorageAdapter`.

Geladene und zu speichernde Werte werden vollständig mit
`validateLearningHub` geprüft. Für diesen privaten Persistenzpfad ist nur
`dataOrigin: 'private'` zulässig. Ein fehlender Key wird von ungültigem JSON,
ungültigen Schema-Daten, einer falschen Herkunft und technischen Adapterfehlern
unterschieden.

Beschädigte oder ungültige gespeicherte Daten werden nicht automatisch
gelöscht, überschrieben, repariert oder durch einen leeren Hub ersetzt. Es wird
keine Migration für nicht vorhandene Schema-1-Nutzerdaten erfunden. Adapter-
und Browserfehler werden in kontrollierte Ergebnisse mit stabilen Fehlercodes
übersetzt; rohe `DOMException`- oder Storage-Objekte und private Inhalte werden
nicht an höhere Schichten oder Logs weitergereicht.

### Privater leerer Initialzustand

Ein fehlender Storage-Key liefert ausschließlich im Arbeitsspeicher diesen
frischen privaten Hub:

```json
{
  "schemaVersion": 2,
  "dataOrigin": "private",
  "modules": []
}
```

Das reine Laden dieses Zustands löst keinen Schreibzugriff aus. Erst eine
erfolgreiche fachliche Mutation speichert den vollständigen Hub. Die
synthetischen Daten aus `learningHubDemo.js` werden weder automatisch importiert
noch als privater Initialzustand persistiert.

### LearningHubService und Zustandsübergänge

`createLearningHubService` stellt `loadHub`, `createModule`, `renameModule`,
`addChapter`, `renameChapter`, `addLearningNode` und `updateLearningNode`
bereit. Der Service verwendet den Storage als autoritative Quelle und hält
keine zweite dauerhaft veränderliche In-Memory-Wahrheit.

Jede Mutation:

1. lädt den aktuellen Hub;
2. prüft Zielzuordnung und Eingaben;
3. erzeugt einen neuen Zustand, ohne den geladenen Hub oder das Eingabeobjekt
   zu verändern;
4. validiert den vollständigen neuen Hub mit `validateLearningHub`;
5. speichert genau einmal über `saveLearningHub`;
6. gibt den aktualisierten Zustand erst nach erfolgreicher Speicherung zurück.

`createModule` erstellt ein LearningModule und sein erstes LearningChapter
atomar. Ein ungültiges leeres Modul wird zu keinem Zeitpunkt gespeichert.
Leere Titel und leere LearningNode-Inhalte werden vor jedem Schreibzugriff
abgelehnt. Falsch zugeordnete oder nicht gefundene Modul-, Kapitel- und
LearningNode-IDs führen zu kontrollierten Fehlern ohne Teilzustand.

Der `LearningHubService` trimmt Eingabetexte vor der Längenprüfung. Seine
Eingabegrenzen betragen maximal 120 Zeichen für Modul-, Kapitel- und
LearningNode-Titel sowie maximal 10.000 Zeichen für LearningNode-Inhalte. Diese
Grenzen reduzieren versehentlich übergroße einzelne Eingaben, ersetzen aber
weder die kontrollierte Quota-Behandlung noch eine allgemeine
Größenbegrenzung des vollständigen LearningHubs. Sie erweitern den
persistierten Inhaltsvertrag nicht: Er bleibt bei `schemaVersion: 2`, und es
wird kein Schema 3 eingeführt.

Neue IDs entstehen ausschließlich im Service über einen injizierbaren
Generator. Sie müssen getrimmt, nicht leer und über den gesamten Hub eindeutig
sein. Kollisionen und fehlerhafte Generatoren werden mit einer begrenzten Zahl
von Versuchen behandelt, damit keine Endlosschleife entsteht. Bestehende IDs
werden bei Aktualisierungen nicht verändert.

Neue Module, Kapitel und LearningNodes werden am Ende ihrer Geschwisterliste
eingefügt. Ihre Position wird robust aus der höchsten vorhandenen
Geschwisterposition abgeleitet und nicht nur aus der Array-Länge.

### Bewusste Grenzen

Diese Entscheidung führt keine Lösch- oder Archivierungsoperationen, kein
Umsortieren, keine Schema-Migration, keine Fortschritts- oder Notizpersistenz
und keine Testversuche ein. Sie garantiert außerdem weder
Multi-Tab-Konsistenz noch eine Transaktionssperre; gleichzeitige Schreibvorgänge
verschiedener Tabs können sich überholen.

`localStorage` ist unverschlüsselt und für JavaScript derselben Origin lesbar.
`dataOrigin: 'private'` ist nur eine fachliche Klassifikation und keine
Verschlüsselungs-, Authentifizierungs- oder Sicherheitsfunktion. Die spätere UI
muss LearningNode-Titel und -Inhalte als nicht vertrauenswürdigen Klartext über
`textContent` oder sichere DOM-Erzeugung ausgeben und darf dafür kein
unbereinigtes `innerHTML` verwenden.

## Konsequenzen

Positive Auswirkungen:

- UI, Anwendungslogik, fachliche Persistenz und technische JSON-Speicherung
  bleiben getrennt;
- ein fehlender Speicher startet ohne unnötigen Schreibzugriff mit einem klaren
  privaten Leerzustand;
- synthetische Demo-Inhalte gelangen nicht automatisch in den privaten
  Speicher;
- atomare, immutable Mutationen verhindern vertragswidrige Zwischenstände;
- Dependency Injection macht Storage und ID-Erzeugung deterministisch testbar;
- getrennte Persistenzgrenzen halten Inhalt, Fortschritt, Notizen und
  Testversuche unabhängig.

Kosten und Einschränkungen:

- jede Mutation lädt und validiert den vollständigen Hub und speichert ihn als
  Ganzes;
- `localStorage` bietet keine Verschlüsselung, Transaktionen oder garantierte
  tabübergreifende Konsistenz;
- Löschen, Umordnen und spätere Inhaltsmigrationen benötigen eigene
  Entscheidungen und Tests;
- View und Controller müssen noch ergänzt werden, bevor ein vollständiger
  LearningHub-UI-Fluss existiert.

## Erwogene Alternativen

### Direkter localStorage-Zugriff aus Service, Controller oder View

Direkte Zugriffe würden Serialisierung, Fehlerbehandlung und feste Keys über
mehrere Schichten verteilen. Sie werden zugunsten von `LearningHubStorage` und
dem gemeinsamen `StorageAdapter` verworfen.

### Langlebiger Service-Cache als zweite Wahrheit

Ein unabhängig veränderlicher In-Memory-Cache könnte vom gespeicherten Hub
abweichen und Fehler bei mehreren Service-Instanzen verdecken. Der Service lädt
daher vor jeder Mutation aus dem Storage.

### Automatisches Seeding mit der synthetischen Demo

Demo-Seeding würde öffentliche Beispieldaten mit dem privaten Initialzustand
vermischen und bereits beim ersten Laden einen Schreibzugriff erfordern. Ein
neuer privater Hub bleibt stattdessen leer.

### Modul und erstes Kapitel in getrennten Schreibvorgängen anlegen

Ein Zwischenzustand mit einem Modul ohne Kapitel verletzt Schema 2. Beide
Entitäten werden deshalb in einer einzigen Mutation erzeugt und gemeinsam
gespeichert.

### Beschädigte Daten automatisch ersetzen oder implizit migrieren

Automatische Reparatur könnte private Inhalte unwiederbringlich überschreiben
und würde einen nicht belegten Altvertrag erfinden. Ungültige Daten bleiben
unangetastet und werden als kontrollierter Fehler gemeldet.

## Bedingungen für eine Neubewertung

Die Entscheidung wird überprüft, wenn:

- ein neuer Inhaltsvertrag oder nachweislich persistierte Altdaten eine echte
  Migration erfordern;
- Fortschritt, Notizen, Zusammenfassungen oder Testversuche ihre eigenen
  Persistenzverträge erhalten;
- gleichzeitige Bearbeitung in mehreren Tabs, Import/Export oder
  geräteübergreifende Synchronisierung benötigt wird;
- Datenmenge oder Schreibfrequenz eine andere lokale Speichertechnik verlangt;
- Authentifizierung, ein Backend oder verschlüsselte Ablage eingeführt werden.

## Verwandte Dokumente

- [`ADR 0004`](0004-private-demo-separation.md)
- [`ADR 0007`](0007-user-configured-learning-modules.md)
- [`docs/architecture.md`](../architecture.md)
- [`docs/data-contracts.md`](../data-contracts.md)
- [`docs/security.md`](../security.md)
- [`docs/roadmap.md`](../roadmap.md)
