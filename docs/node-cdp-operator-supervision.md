# Begrenzte Betriebsbeobachtung der Node-CDP-Operatorsitzung

## Vor Implementierung festgelegter Bedien- und Zeitvertrag

Festgelegt am 14.11.2026 vor der ersten Änderung am neuen JavaScript-Code.
Die Ausgangsbindung liegt im getrennten Prüfverzeichnis
`node-cdp-supervision-2026-11-14-7a9c63e1/baseline.json`: Branch
`codex/node-cdp-operator-supervision`, HEAD
`d7e18f5c2d9ae393914df5be809afff4562a8e2a`, vollständiger Index und die
Rohbytes aller 187 Bestandsdateien. Diese Dokumentation ist eine der drei
zugelassenen neuen Dateien; bestehende Komponenten bleiben unverändert.

| Gegenstand | Feste Grenze |
| --- | --- |
| Eingabe | UTF-8-JSONL; genau ein Objekt je Zeile, ausschließlich die je Aktion festgelegten Felder |
| Eingabegröße | Höchstens 8.192 Bytes je Chunk, Zeile und noch nicht verarbeiteter Puffer |
| Bedienmenge | Höchstens 128 Befehle insgesamt; ungültige Eingaben zählen mit |
| Regelmäßige Beobachtung | Eigener Timer mit 1.000 ms Abstand; am absoluten Ende entsprechend kürzer, ohne parallele Zyklen oder Nachholschleifen |
| Beobachtungsdauer | Höchstens 30 Minuten ab ausdrücklich aufgerufenem Einstieg; keine Verlängerung durch Bedienung |
| Übernahmeangebote | Höchstens 32 insgesamt, höchstens ein aktives Angebot |
| Angebotsgültigkeit | 15.000 ms ab eigener Beobachtungszeit, nur bei unverändert gültiger Identität und Restlage |
| Annahme und Veröffentlichung | Je Vorgang höchstens 1.000 ms; Fristprüfung vor Annahme und unmittelbar vor wirksamer Veröffentlichung |
| Neue Betriebsbelege | Höchstens 2.048 Datensätze, höchstens 16 KiB je Datensatz und 8 MiB insgesamt |

Innerhalb dieser Gesamtgrenzen ist genau ein negativer Abschluss-/Verlustbeleg
mit höchstens 1.024 Bytes reserviert. Normale Beobachtungen verwenden daher
höchstens 2.047 Datensätze und insgesamt höchstens `8 MiB - 1.024 Bytes`.
Die Reserve vergrößert kein Gesamtbudget.

Alle Fristen verwenden monotone Zeit. Gleichheit mit der jeweiligen Grenze
ist bereits verspätet. Rückwärtslauf, ungültige Zeit oder widersprüchliche
Identitäten entwerten die gesamte betroffene neue Auskunft. Frühere eingefrorene
Ausgaben bleiben historische Beobachtungen. Erschöpfte Grenzen sind ein
ausdrücklich auszuweisender Verlust der weiteren Beobachtbarkeit oder
Belegsicherung und niemals ein erfolgreicher Ressourcenabschluss.

Die feste bestehende Dienstnachlauffrist von **120.000 ms** bleibt unverändert.
Der neue Beobachtungsweg verlängert weder diese Sessionfrist noch Kontroll-,
Vorbereitungs- oder Fensterhelferfristen. Ein nach der Sessionfrist laufender
Dienst behält seinen ursprünglichen FAIL-/UNPROVEN-Befund, auch wenn spätere
Beobachtungen seinen tatsächlichen Abschluss bestätigen.

Die Zeitgrenzen sind Bewertungsfristen. Synchrone Ein-/Ausgabe und eine
blockierte Ereignisschleife können ihren Ablauf nicht zuverlässig selbst
unterbrechen. Eine erst danach ausgeführte Prüfung darf keine rechtzeitige
Antwort behaupten. Der Timerabstand garantiert keinen von außen beobachtbaren
exakten Takt.

## Kompositionsgrenze

Import und Factory bleiben wirkungsfrei. Erst ein ausdrücklich aufgerufener
Einstieg darf Eingaben registrieren, Beobachtung starten oder den bestehenden
Sessioneinstieg aufrufen. Produktionskomposition und vollständig injizierte
Testkomposition sind getrennt; ein fehlender Testport darf niemals native
Effekte ersetzen.

Der Aufsatz hält dieselbe Session und dadurch denselben Host und Owner über
den Sessionabschluss hinweg. Keine Wiederaufnahme, Rekonstruktion anhand von
Kennungen, Prozesssuche, Ersatzinstanz oder Wiederverbindung ist Teil des
Vertrags. Bereitstellung und Kontrollentscheidung bleiben getrennt; höchstens
ein Kontrolllauf bleibt möglich. Abbruch wird phasengerecht an die bestehende
Session delegiert.

Der Aufsatz besitzt eine eigene Eingabe- und Signalregistrierung. Die Session
bekommt getrennte lokale Eingabe- und Signal-Proxys. Ihr eigener Listenerabbau
und das Pausieren ihrer Eingabe dürfen den äußeren Beobachtungsweg nicht
beenden. Nach FINAL wird keine neue Bedienung an Bereitstellung oder Kontrolle
weitergeleitet; abgemeldete Sessionlistener werden nicht wieder aktiviert.
Registrierungsversuche, Abmeldungen, eigene Timer und deren bestätigter Abbau
sind gesondert zu bilanzieren. Erst beim Schließen des Aufsatzes wird die echte
Eingabe einmalig pausiert; `inputPauseAttempts` bilanziert diesen Versuch.
Eine fehlende Bestätigung bleibt `possible`. Das Pausieren der Session-Proxys
bei FINAL pausiert die echte Eingabe ausdrücklich noch nicht.

Die unveränderten Sessionausgaben behalten ihren bestehenden Ausgabekanal und
ihre vollständigen Inhalte. Dazu gehört genau einmal der erste eingefrorene
terminal gelieferte Bericht. Neue Betriebsbeobachtungen müssen ausdrücklich
als solche erkennbar sein. Sie ergänzen weder den ursprünglichen Bericht noch
das abgeschlossene Sessionarchiv rückwirkend.

## Übernahme und Aussagegrenzen

Ein Übernahmeangebot benennt die aktuelle Sitzungs- und Dienstgeneration,
verbleibende Ressourcen samt Beobachtungsstatus, eigene Angebotskennung,
Beobachtungszeit und Ablaufzeit. Es benennt Jan als Verantwortlichen und den
weiteren Beobachtungsweg. Eine ausdrückliche lokale Bestätigung gilt genau
diesem zuvor ausgegebenen Angebot. Sie ist keine Authentifizierung gegenüber
beliebigem Code im selben Prozess.

Unmittelbar vor Annahme und Veröffentlichung werden Zeit, Identität und Zustand
erneut gegen dieselbe gehaltene Session geprüft. Veraltete, fremde, kopierte,
widersprüchliche, wiederholte oder reentrant eingehende Bestätigungen erzeugen
keine neue wirksame Übernahme. Eine Ausgabe vor Abschluss der zugehörigen
Ein-/Ausgabeprüfung ist vorläufig; erst die anschließend bestätigte lokale
Annahme darf als wirksam gelten. Aus bereits ausgegebenen vorläufigen Bytes
darf keine nachträgliche positive Zustandsaussage abgeleitet werden.

Vier Aussagen bleiben getrennt:

1. Jans bestätigte Verantwortungsübernahme für die benannten Positionen.
2. Die zu diesem Zeitpunkt tatsächlich bestätigte Dienstbeobachtung.
3. Jans Klärungsverantwortung für ausdrücklich unbeobachtbare Reste.
4. Der unabhängig beobachtete tatsächliche Abschluss einzelner Ressourcen.

Eine Übernahme verbessert keine Beobachtung, keinen FAIL-/UNPROVEN-Befund und
keine Startsperre. `processObservation.referenceObservedAtMonotonic` des Hosts
ist kein aktueller Abfragezeitpunkt; jede neue Auskunft benötigt ihre eigene
Beobachtungszeit. PID und gespeicherte Kennungen sind keine ersetzende
Identitätsquelle. Für einen vollständigen Ressourcenabschluss reichen allein
die Dienstprozessfelder nicht aus: eigene Registrierungen, Timer, Belege und
mögliche Helferreste müssen ebenfalls ausgewiesen werden.

Das Angebot enthält außerdem die eigenen Bedien-, Timer-, Ausgabe- und
Belegsicherungspositionen unter `binding.supervisionResources`. Verbleibende
Vorbereitungs- und Kontrollpositionen aus den eingefrorenen Berichten sind als
`preparation.*` und `control.*` mit `HISTORICAL_NOT_REOBSERVED` ausgewiesen;
eine fehlende neue Beobachtung wird nicht zum Ressourcenabschluss umgedeutet.
`serviceResourcesClosed` bewertet ausschließlich den Dienst. Noch offene
Helfer bleiben eigene Positionen. Ein reguläres Prozess-exit vor späterem
Prozess-/Pipe-close ist eine beobachtete Abschlussphase und allein kein
Identitätsverlust.

## Öffentliche Bedienoberfläche

Die Produktionsfactory heißt `createNodeCdpOperatorSupervision(options)`. Die
ausdrückliche Testfactory
`createNodeCdpOperatorSupervisionForTest(options, ports, sessionPorts, hostPorts)`
verlangt vollständig injizierte Effekte. Die eigenen Zeit-/ID-/Timerports sind
genau `now`, `utc`, `uuid`, `schedule` und `cancel`. Die bestehenden Session-
und Host-Testports behalten ihre eigenen vollständigen Verträge.

Die Aufsatz-API stellt `begin(io)`, `inspect()`, `offer()`,
`confirm(offer, decision)`, `close()` und `completed()` bereit. `completed()`
betrifft den ursprünglichen Sessionabschluss, nicht den Abschluss des weiter
laufenden Betriebsbeobachters. `begin(io)` erhält genau `input`, `signals`,
`output`, `observe` und `save`. `output` empfängt die unveränderten
Sessionstrings. `observe` und `save` erhalten die neuen Betriebsbeobachtungen
als JSONL. Alle drei Ausgabeports müssen die jeweilige Annahme synchron mit
`true` bestätigen. Bereits beim Einstieg wird eine initiale Betriebsbeobachtung
ausgegeben und gesichert; ein fehlender Portbeleg verhindert positive Annahmen.
Der Rückgabewert bestätigt nur den jeweiligen lokalen Portvertrag.

Die bestehende Sessionbedienung bleibt innerhalb ihrer Phasen verfügbar:
`prepare`, `control`, `window` und `abort` mit genau den vorhandenen
`{ "action": ..., "value": ... }`-Schemas. Der Aufsatz ergänzt:

| Aktion | `value` | Wirkung |
| --- | --- | --- |
| `inspect` | `null` | Neue minimierte Auskunft derselben Session |
| `offer` | `null` | Neues begrenztes Angebot nach FINAL und Ausgabe des Originalabschlussberichts |
| `confirm` | Genau die unten genannten Felder | Einmalige ausdrückliche Annahme des aktiven Angebots |
| `close` | `null` | Beendet den eigenen Bedien-/Beobachtungsweg; kein Dienst- oder Prozessabschluss |

Die Drahtbestätigung enthält genau `operator: "Jan"`,
`decision: "ACCEPT_RESPONSIBILITY"`, `offerId`, `sessionId`,
`sessionGeneration`, `serviceId` und `serviceGeneration`. Alle Kennungen müssen
zum aktuellen unverbrauchten Angebot gehören. Über die direkte lokale API
verlangt `confirm()` zusätzlich exakt das von `offer()` zurückgegebene
Objekt; ein kopiertes Objekt ist kein Angebot dieser Instanz. Dort enthält
`decision` ausschließlich `operator` und `decision` mit den genannten Werten.

JSONL transportiert Werte und keine JavaScript-Objektidentität. Die erste
bitidentische Kopie einer gültigen Drahtbestätigung lässt sich ohne zusätzliche
Authentifizierung nicht von Jans Eingabe unterscheiden. Die Grenze ist die
einmalige lokale Bedienentscheidung zum aktiven Angebot; Wiederholungen und
Bestätigungen verbrauchter oder fremder Angebote erzeugen keine neue Wirkung.

Normale transportierte Beobachtungen und Annahmevorschläge tragen ausdrücklich
die Rolle `PRELIMINARY`. Die wirksame lokale Annahme entsteht erst nach den
anschließenden Zeit-, Identitäts- und Zustandsprüfungen und ist über eine neue
API-Auskunft erkennbar. Ein gespeicherter oder angezeigter Annahmevorschlag
allein belegt diese spätere Wirksamkeit nicht. Bereits ausgelieferte Bytes
werden nicht rückwirkend verändert.

Eine bestätigte Verantwortungsübernahme bleibt als historische Entscheidung
erhalten. Die zu einer neuen Auskunft gehörenden Aussagen über aktuelle
Dienstbeobachtung und Ressourcenabschluss werden erneut aus deren Beobachtung
projiziert. Die gespeicherte Vorstufe enthält ausdrücklich keinen nachträglich
behaupteten finalen Annahmebeleg (`PROPOSAL_SAVED_FINAL_RECEIPT_NOT_PERSISTED`).
SIGINT/SIGTERM und ein ausdrückliches `abort` verwerfen ein aktives Angebot
beziehungsweise einen gleichzeitig laufenden Annahmeversuch. Nach FINAL
reaktivieren sie keine Sessionbedienung.

## Späterer CLI-Betrieb und getrennte Belege

Der CLI-Einstieg darf nur bei ausdrücklichem `--run` Betriebsaktionen beginnen.
Er benötigt die sechs bestehenden Session-Argumentpaare und zusätzlich
`--journal-prefix` mit einem absoluten Dateipräfix. Das Elternverzeichnis muss
bereits vorhanden und gesondert für den Betrieb vorbereitet sein. Der Aufsatz
erstellt keine Verzeichnisse und übernimmt kein vorhandenes Journal.

Originalausgaben einschließlich des terminalen Sessionberichts bleiben auf
stdout. Neue, ausdrücklich gekennzeichnete Betriebsbeobachtungen verwenden
stderr. Der native Einstieg verwendet vollständige synchrone `writeSync`-
Schreibvorgänge; ein kurzer oder fehlgeschlagener Write ist ein Ausgabefehler.
Ein solcher Aufruf kann selbst blockieren. Die äußere Betreuung bleibt deshalb
auch bei bestätigten früheren Ausgaben erforderlich.

Die Weitergabe ursprünglicher Sessionstrings ist zusätzlich auf höchstens
64 Ausgaben, 256 KiB je Ausgabe und 1 MiB insgesamt begrenzt. Eine Überschreitung
wird als Ausgabeverlust bilanziert; es gibt keine stille Kürzung oder Änderung
des ursprünglichen Berichtsinhalts.

Neue Betriebsbelege werden getrennt als fortlaufend nummerierte Dateien
`<Präfix>-0001.json` usw. ausschließlich mit exklusivem `wx+` erstellt. Voller
Write, fsync, Stat, Readback und bestätigter Close gehören zum lokalen
Belegvertrag. Ein unbestätigter Close bleibt eine offene eigene Position;
kein Wiederholungsversuch darf daraus nachträglich einen ursprünglichen Erfolg
machen. Die festgelegten Mengen- und Größenlimits gelten gemeinsam für diese
neuen Datensätze. Die eigene Handle-Bilanz weist bei fehlendem Sicherungsbeleg
konservativ `possible` aus; sie behauptet damit weder ein nachgewiesenes Leck
noch einen bestätigten Close.

Der Aufsatz schreibt niemals nachträglich in das abgeschlossene
Sessionarchiv. Eine externe Belegdatei bestätigt weder einen physischen
Dienstabschluss noch eine Betriebsfreigabe. Die in diesem Implementierungs-
und Testauftrag verwendete Prüfablage bereitet keinen realen Betrieb vor.

## Beobachtungsverlust und äußere Betreuung

Bei Beobachtungs-, Eingabe- oder Ausgabeausfall gibt es keine neue positive
Übernahme. Letzte belastbare Identität und offene Positionen bleiben erhalten.
Beobachtungsverlust und fehlende Belegsicherung sind getrennte Befunde.
Für Ausfall, Erschöpfung oder ausdrückliches Schließen ist der einmalige
reservierte Datensatz mit Rolle `NEGATIVE_TERMINAL` vorgesehen. Er meldet
`UNPROVEN` beziehungsweise `OBSERVATION_STOPPED`, niemals einen erfolgreichen
Ressourcenabschluss. Er darf auch nach Ablauf der Bewertungsfrist ausschließlich
über die noch gesunden Kanäle versucht werden und behauptet selbst weder
aktuelle Beobachtung noch bestätigte eigene Zustellung. Ein ausgefallener
Kanal wird nicht erneut versucht. Die tatsächlichen lokalen Rückgabebefunde
stehen nur in der anschließend erreichbaren API-Auskunft; eine nicht
auslieferbare Verlustmeldung bleibt möglich.

Vorhandene Referenzen und noch erreichbare Drain-Beobachter dürfen nicht
verworfen werden, um einen Abschluss herzustellen. Es gibt keine automatische
Prozessbeendigung, Profil-/Markenbereinigung, Entsperrung oder neue Session.

Jan muss den beobachtenden Prozess von außen betreuen. Insbesondere kann ein
Prozess seinen eigenen Absturz, einen abrupten Maschinenverlust oder eine
blockierte Ereignisschleife nicht zuverlässig selbst melden. Ausbleibende
Ausgaben sind kein Abschlussbeleg. Jan muss den vereinbarten Rhythmus extern
verfolgen und bei Ausfall die letzte gesicherte Identität sowie die offenen
Positionen zur Klärung übernehmen. Diese externe Betreuung ist keine hier
implementierte Watchdog-Fähigkeit.

## Prüfung und Betriebsfreigabe

Die neue Komposition wird mit den echten bestehenden Session-, Host-, Owner-
und Kontrollbausteinen sowie vollständig simulierten Effekten geprüft. Browser,
CDP, Windows-Helfer und Betriebsprozesse werden dabei nicht gestartet. Native
Node-Kindprozesse sind ausschließlich für begrenzte Import-/CLI-Prüfungen mit
wirksamen Effektwachen vorgesehen; Dateifälle verwenden eigene temporäre
Verzeichnisse und portable Pfadabbildung.

Die vorgesehenen vollständigen seriellen Prüfungen umfassen die vier
Bestandssuiten und die neue Suite unter den bereits vorhandenen Node-Versionen
24.19.0, 20.19.0 und 22.12.0. Alle bisherigen 555 Fallidentitäten müssen erhalten
bleiben. Fehlende Werkzeuge werden als Lücke ausgewiesen; keine Downloads oder
Paketinstallationen. Nach den finalen Tests folgt ein tatsächlicher
Produktions-Build mit vorab gebundener npm-/Vite-Auswahl und unmittelbar davor
sowie danach direkt geprüften vier Production-Env-Dateien.

Vollständige TAP-Originalstreams, native Abschlussdaten, Buildausgaben,
Quell-/Werkzeug-/Umgebungsbindungen und neue Belegmanifestdaten gehören
ausschließlich in das eindeutige neue Prüfverzeichnis außerhalb des
Repositories. Dieses Verzeichnis ist keine reale Betriebsablage. Diese
Dokumentation nimmt keine Test- oder Buildergebnisse vorweg.

Die Selbstprüfung ersetzt weder unabhängigen Review noch reale
Fähigkeitsprüfung oder Betriebsfreigabe. Es findet keine produktive
Übernahmebestätigung statt. SAC bleibt aktiv; `overallGate: FAIL`,
`causeStatus: CAUSE_NOT_PROVEN`, fehlendes authentisches `A_obs`,
`NOT_EVIDENCE` und `runtimeRecord:null` bleiben unverändert.
