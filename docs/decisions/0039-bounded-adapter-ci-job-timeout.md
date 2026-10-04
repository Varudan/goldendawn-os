# ADR 0039 – Begrenzte Anhebung des Adapter-CI-Joblimits

## Status

Angenommen – 2026-10-04

Jan hat nach dem unabhängigen Dokumentreview mit technischem `PASS` für die
sieben gebundenen Vorannahmefassungen ausdrücklich entschieden:
„ADR 0039 wird in der geprüften Fassung angenommen.“ Der Review gilt für
die damaligen Dokumentbytes, nicht für diese Statusnachführung oder die
geänderte Workflowdatei.

Dieser ADR ergänzt ausschließlich die CI-Zeitbudgetentscheidung aus
[ADR 0038](0038-isolated-ci-test-grouping-for-diagnostic-adapter.md#10-keine-vorweggenommene-dimensionierung);
ADR 0038 bleibt unverändert. Im bestehenden Workflow ist nur
`jobs.adapter.timeout-minutes` von `10` auf `30` geändert; `verify` und
`aggregate` bleiben bei `10`. Die tatsächliche Ubuntu-CI-Abnahme auf Node
`20.19.0` und `22.12.0` steht aus. Der neue Workflowhash macht frühere
lokale Ergebnisartefakte für diesen Stand nicht übertragbar.

Der Hauptteil ab `## Kontext` bleibt bytegleich zur geprüften
Vorannahmefassung. Seine Aussagen über den „bestehenden“ Zehn-Minuten-Workflow,
den „aktuellen Arbeitsbaum“ und die noch ausstehende Umsetzung beschreiben
jenen damaligen Stand. Maßgeblich für den jetzigen Status ist diese
Annahmenachführung. Runtime- und Evidenzgrenzen bleiben geschlossen.

## Kontext

Die sechs isolierten Adaptergruppen sind auf Branch
`codex/docs/adr-0038-ci-isolation` in Commit
`5f5304e53c0519513f703856c29a7c3a94914fa9` enthalten. Die lokale
Neubindung besteht; ein getrennter Implementierungs-Re-Review der damals
uncommitteten zwölf Dateifassungen schloss technisch mit `PASS`. Nach dem
Commit stimmen die zwölf Commitblobs mit den damaligen Review-SHA-256-Werten
überein. Im aktuellen Arbeitsbaum bleiben nur die sechs Implementierungs-/
Workflowdateien bytegleich. Die sechs nachgeführten Statusdokumente und
dieser ADR haben neue Bytes; der Implementierungs-Re-Review gilt nicht für
diese Fassungen. Der frühere Review mit `FAIL` bleibt historisch.
Eine tatsächliche Ubuntu-CI-Abnahme liegt noch nicht vor.

Der bestehende [Workflow](../../.github/workflows/ci.yml) setzt für `verify`,
`adapter` und `aggregate` jeweils `timeout-minutes: 10`. Die Adaptermatrix
enthält je eine eigene Jobinstanz für jede der sechs Gruppen auf Node
`20.19.0` und `22.12.0`, also zwölf Jobs. Ein Job umfasst Checkout,
Node-Einrichtung, `npm ci`, Gruppentest und Ergebnis-Upload. Ein Push des
Featurebranches löst den bestehenden Workflow nicht aus; er reagiert auf
Pull Requests gegen `main` und Pushes auf `main`.

Die vollständige lokale Neubindung vom 2026-10-03 wurde unter Windows und
Node `24.19.0` gemessen. Allein die nativen Testaufrufe dauerten für `source`
`1141.081` Sekunden und für `parser` `1255.706` Sekunden. CI-Einrichtung und
Artefakttransfer waren darin nicht enthalten. Diese Werte begründen ein
konkretes Risiko für das bestehende Zehn-Minuten-Joblimit, beweisen aber weder
einen Ubuntu-Timeout noch eine Ubuntu-Laufzeit. Die Messmethode und Grenzen
stehen im [Changelog](../../CHANGELOG.md#adr-0038-lokale-neubindung--2026-10-03).

ADR 0038 hat die zehn Minuten ausdrücklich nur als damaligen Ausgangspunkt
behandelt und keine Timeoutänderung vorgeschlagen. Deshalb benötigt eine
Anhebung eine eigene, eng begrenzte Entscheidung.

## Entscheidung bei Annahme

Im bestehenden Workflow wird ausschließlich `jobs.adapter.timeout-minutes`
von `10` auf **`30`** erhöht. Der Wert gilt einheitlich für alle zwölf
Adaptermatrixjobs und begrenzt jeweils den gesamten Job einschließlich
Einrichtung, Test und Artefakt-Upload. `jobs.verify.timeout-minutes` und
`jobs.aggregate.timeout-minutes` bleiben jeweils bei `10`.

Die 30 Minuten sind ein vorläufiges, endliches Ausführungsbudget für die
erste tatsächliche Ubuntu-CI-Abnahme, keine Zusage, dass jede Gruppe es
einhält. Weder Test- oder Harnessfristen noch Node-Versionen, Runner,
Gruppenzahl und -zuschnitt, Quell- und Planbindungen, Serialität,
Kopielebenszyklen, Ergebnisformat, Artefaktbindung oder Aggregation werden
geändert. Es werden keine Wiederholungen, zusätzlichen Trigger,
`continue-on-error`-Pfade oder Ausnahmen für unvollständige Resultate
eingeführt.

Ein Timeout, Abbruch, fehlendes oder unvollständiges Artefakt bleibt ein
CI-Fehler. Die bestehende Aggregation darf aus Teilresultaten keinen
Gesamterfolg ableiten. Die zehnminütigen `verify`- und `aggregate`-Jobs
bleiben ebenfalls für den CI-Erfolg erforderlich.

## Begründung und Alternativen

Die langsamste lokale Gruppe brauchte knapp 21 Minuten für ihren Testaufruf.
Ein 30-Minuten-Jobbudget lässt gegenüber diesem lokalen Wert rund neun
Minuten für Unterschiede und Jobschritte, ohne die tatsächlichen Ubuntu-Zeiten
vorwegzunehmen. Das bisherige Zehn-Minuten-Limit würde nach diesen lokalen
Werten einen vollständigen Lauf der beiden langsamsten Gruppen nicht zulassen;
es wird dennoch kein Ubuntu-Fehlschlag behauptet.

Ein feinerer Zuschnitt von `source` oder `parser` wäre ein eigener Eingriff in
den festen Gruppenplan und dessen Nachweise. Er würde neue Bindungen,
Tests und einen erneuten Review verlangen. Eine pauschale Erhöhung aller
Jobs wäre durch die vorliegenden Messungen nicht begründet. Ein unbegrenzter
Job kommt wegen der erforderlichen endlichen Fehlergrenze nicht in Betracht.

## Umsetzung und Abnahme

Erst nach unabhängigem Dokumentreview und Jans Annahme wird die einzelne
Workflow-Zeile in einem gesonderten Umsetzungsschritt geändert und statisch
gegen die unveränderten übrigen Joblimits und Verträge geprüft. Die
Implementierungs- und Testbytes des ADR-0038-Commits bleiben dabei erhalten.

Die Abnahme verlangt anschließend einen tatsächlichen CI-Lauf auf Ubuntu mit
Node `20.19.0` und `22.12.0`: alle zwölf Adapterjobs müssen innerhalb ihres
Joblimits erfolgreich und nativ abgeschlossen sein, alle erwarteten
Artefakte derselben Lauf-/Versuchsbindung vorliegen, beide `verify`-Jobs
bestehen und `aggregate` die vollständigen Ergebnisse beider Versionen
akzeptieren. Gesamte Job- und relevante Schrittzeiten einschließlich
Einrichtung und Upload werden von den lokalen Testaufrufzeiten getrennt
ausgewiesen. Ein lokaler Lauf ersetzt diese Abnahme nicht.

Falls 30 Minuten nicht reichen, bleibt CI fehlgeschlagen. Ein weiterer
Limit- oder Gruppierungswechsel benötigt eine neue, anhand der tatsächlichen
CI-Ergebnisse begründete Entscheidung und eigene Nachweise.

## Unveränderte Grenzen

Dieser ADR erteilt keine Runtime-, Browser-, E2E-, Writer- oder
Persistenzfreigabe. `overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`,
Foundation und Testkopien als `NOT_EVIDENCE` sowie `runtimeRecord:null`
bleiben unverändert. Ein erfolgreicher CI-Lauf belegt kein authentisches
Runtime-`A_obs`.
