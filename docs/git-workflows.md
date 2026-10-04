# Sichere lokale Git-Workflows

## Zweck und Sicherheitsgrenzen

Die PowerShell-Helfer unterstützen Jans manuelle Git-Arbeit:

- Invoke-CommitWorkflow.ps1 prüft manuell gestagte Änderungen, führt Tests und
  Build aus und erstellt erst nach Bestätigung einen lokalen Commit.
- Remove-MergedLocalBranch.ps1 löscht einen exakt benannten lokalen Branch nur,
  wenn dessen Integration in den lokalen Basis-Branch nachgewiesen ist.

Beide Skripte unterstützen -WhatIf, fragen wegen ConfirmImpact = High vor ihrer
Mutation ausdrücklich nach und führen keine Netzwerkoperationen aus. Sie
automatisieren weder Staging, Push, Pull, Fetch, Branchwechsel, Pull Requests,
Merges noch Remote-Löschungen. Git-Entscheidungen und Ausführung bleiben bei Jan.

## Voraussetzungen

- Windows PowerShell 5.1 oder PowerShell 7
- Git im PATH
- Node.js und npm für den Commit-Workflow
- Ausführung innerhalb des betreffenden Git-Repositorys

Für den Commit-Workflow:

- ein ausgecheckter Feature- oder Tooling-Branch;
- `main`, `master` und Detached HEAD sind gesperrt;
- keine laufenden Merge-, Rebase-, Cherry-pick-, Revert- oder Sequencer-Vorgänge;
- ausschließlich gestagte Änderungen, keine unstaged oder untracked Dateien.

Für das Cleanup:

- ein sauberer Arbeitsbaum einschließlich untracked Dateien;
- der angegebene lokale `BaseBranch` ist ausgecheckt, typischerweise `main`.

## Manueller Commit mit gebundenen Prüfnachweisen

Ein erforderlicher Test- oder Buildlauf wird nach den fertiggestellten
Änderungen vollständig abgeschlossen. Sein passend gebundener Erfolg darf
beim anschließenden unveränderten Commit wiederverwendet werden. Der Commit
allein löst keinen weiteren vollständigen Testlauf oder Build aus. Die
Buildpflicht nach Änderungen und alle bestehenden Testpflichten gelten weiter;
es gibt keine pauschale Dokumentations- oder Testausnahme, keinen Schnellmodus
und keine zusätzliche lokale Parallelität.

Dieser Ablauf verwendet den vorhandenen Commithelfer vorerst nicht.
`Invoke-CommitWorkflow.ps1` startet weiterhin bei jedem zulässigen Aufruf
Tests und Build, auch mit `-WhatIf`. Skript, Paketbefehle und CI bleiben
unverändert.

### Wann ein Erfolg wiederverwendbar ist

Der Vermerk muss den Prüfumfang vor der Ausführung eindeutig abgrenzen und
den damaligen Stand nachvollziehbar binden:

- relevante Quellen, Tests, Fixtures, Harness, Prüfkonfiguration und Auswahl
  mit Dateiliste, Rohbytegrößen und SHA-256; bei Adaptergruppen zusätzlich die
  vorhandene vollständige Plan-, Fall- und Variantenbindung;
- ursprünglicher HEAD, Branch, Arbeitsbaumstatus, vollständiger Index und
  nachvollziehbare Zuordnung der tatsächlich geprüften Dateien;
- Arbeitsverzeichnis, exakter Befehl samt Argumenten/Flags, Paket- und
  Lockdateihashes sowie tatsächlich verwendete Abhängigkeitsstände;
- relevante Umgebung: Betriebssystem/Architektur, Node-/npm-Versionen,
  ausführbare Programme, relevante Umgebungsoptionen und gegebenenfalls
  CI-Lauf, Versuch, Job, Node-Version und Gruppe; keine Secrets erfassen;
- unveränderte vollständige Originalausgaben und native Abschlussdaten:
  Beginn, Ende, Exitcode und gegebenenfalls Signal/Abbruch, erwarteter
  vollständiger Abschluss samt Footer, Fall-/Variantenabdeckung und
  erforderlichen Cleanupnachweisen. Fehlende Resultate, Fehlschläge,
  Cancellations, Skips oder Todos ergeben keinen vollständigen Testerfolg.

Vergleiche diese Angaben mit dem vorgesehenen Commitstand. Testzahlen,
Anzeigenamen, ein grüner Ausschnitt oder Exitcode 0 allein genügen nicht.
Nachträgliche Hashes beschreiben nur die dann vorliegenden Bytes; sie
rekonstruieren keine fehlende ursprüngliche Bindung. Fehlende Angaben bleiben
als Lücke benannt. Eine spätere Zuordnung wird mit eigenem Zeitpunkt ergänzt,
ohne Originalbelege umzuschreiben oder frühere Angaben zu erfinden.

Neue vollständige passende Suites und Regressionen sind erforderlich, wenn
betroffene Quellen, Tests, Fixtures, Harness, Auswahl, Befehle/Flags,
Abhängigkeiten oder relevante Umgebung verändert wurden oder die
Erfolgs-/Standbindung fehlt. Auswirkungen müssen aus Diff und Abhängigkeiten
begründet abgrenzbar sein; andernfalls wird der Prüfumfang erweitert,
erforderlichenfalls bis zur Gesamtsuite. Nach fertiggestellten Änderungen
bleibt `npm run build` erforderlich. Test-, Build-, Bundlecheck-, Review- und
CI-Nachweise gelten jeweils nur für ihren eigenen Umfang und ihre Umgebung;
ein lokaler Build ersetzt weder Tests noch Ubuntu-CI oder unabhängigen Review.

### Besondere Adapterbindung

[`bindSources()`](../scripts/ci/runAdapterGroups.js) bindet HEAD,
`uncommitted`, Konfiguration und die Rohbytes aller erfassten Dateien:
versionierte Dateien sowie Dateien aus `src`, `tests` und `scripts/ci`,
abzüglich der ausdrücklich im Code benannten sechs Statusdokumente.
`AGENTS.md` ist eine dieser Ausnahmen; `docs/git-workflows.md` ist es nicht.
Auch diese Workflowdokumentation verändert somit die Adapterbindung. Die
Ausnahme von `AGENTS.md` ersetzt nicht seine eigene Bindung im Prüfvermerk.

Ein Commit verändert HEAD und gegebenenfalls `uncommitted`; frühere
Gruppenartefakte werden dadurch nicht zu Artefakten des neuen Stands.
Ein manueller Zuordnungsbeleg kann den ursprünglichen Prüfarbeitsbaum dem
Commitinhalt zuordnen, erzeugt aber keinen neu ausgeführten Aggregations-PASS
und ersetzt keine fehlende technische Bindung. Originalartefakte behalten
ihre ursprünglichen Angaben. Quellenbindungen, Aggregationsregeln und
Artefakte werden nicht geändert; alte und neue Gruppenresultate sowie
verschiedene Läufe oder Versuche werden nicht vermischt.

[ADR 0038](decisions/0038-isolated-ci-test-grouping-for-diagnostic-adapter.md)
und [ADR 0039](decisions/0039-bounded-adapter-ci-job-timeout.md) gelten fort:
sechs isolierte CI-Gruppen, serielle Tests und vollständige Kopielebenszyklen
je Gruppe, vollständige Aggregation für Node `20.19.0` und `22.12.0`;
30 Minuten nur für Adapterjobs, je zehn für `verify` und `aggregate`.
Ein PR-CI-Erfolg bleibt an den geprüften PR-Stand gebunden; ein späterer
Squash-Merge übernimmt ihn nicht als neu ausgeführten Lauf am Mergecommit.
Ältere datierte Prüf- und Statuspassagen behalten ihren historischen Bezug.

### Ablauf und unmittelbarer Commitabgleich

1. **Umfang festlegen:** Änderungen einschließlich Dokumentation fertigstellen,
   Diff und relevante Abhängigkeiten lesen, erforderliche Suites, Regressionen
   und Build bestimmen und begründen. Vorhandene Erfolgsbelege anhand der
   obigen Bedingungen prüfen; Lücken und notwendige neue Läufe festhalten.
   Noch erforderliche, nicht freigegebene Prüfungen
   bleiben offen und werden nicht als Erfolg behandelt.
2. **Stand festhalten:** Jan stellt einen Feature-/Dokumentationsbranch
   bereit; `main`, `master` und Detached HEAD sind ausgeschlossen.
   Branch, HEAD, vollständigen Index (`git ls-files --stage`), Status
   (`git status --porcelain=v1 --untracked-files=all --ignore-submodules=none`)
   und Rohbytebindungen vor den Läufen festhalten. Keine laufenden Merge-,
   Rebase-, Cherry-pick-, Revert- oder Sequencer-Vorgänge und keine Konflikte.
   Die Marker lassen sich mit `git rev-parse --git-path <Marker>` lokalisieren;
   maßgeblich sind `MERGE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`,
   `rebase-merge`, `rebase-apply` und `sequencer`. Sachfremde Änderungen
   weder mitstagen noch löschen; bei ihnen den Commitweg anhalten und Jan die
   getrennte Behandlung überlassen.
3. **Vollständig prüfen:** Den fertigen Stand statisch prüfen und alle
   erforderlichen freigegebenen Läufe vollständig abschließen. Native
   Abschlussdaten und Originalausgaben aufbewahren, den Stand danach erneut
   vergleichen und den Prüfvermerk erstellen. Ein Abbruch oder eine ungeklärte
   Drift erlaubt keine Wiederverwendung. Lokale Läufe bleiben seriell.
4. **Index zuordnen:** Jan wählt die vorgesehenen Dateien einzeln und staggt
   ihren vollständigen Inhalt. Falls erst nach den Läufen gestagt wird, die
   Zuordnung ausdrücklich festhalten. Vollständigen Index, gestagten Diff
   (`git diff --cached`) und Rohbytes mit dem Prüfstand vergleichen;
   `git diff --cached --check` muss bestehen. Keine unstaged oder untracked
   Dateien, kein Teil-Staging mit zurückbleibenden Änderungen und keine
   sachfremden Indexeinträge. Vor dem Commit ist der Arbeitsbaum gegenüber
   dem vorgesehenen vollständigen Index sauber; dieser enthält die Änderung.
5. **Unmittelbar vor Jans Commit:** Branch und HEAD, vollständigen Index
   einschließlich Pfaden/Modi/Blob-IDs, Rohbytebindungen, Status, Konfliktfreiheit
   und fehlende Git-Vorgänge nochmals gegen den festgehaltenen Stand prüfen.
   Bei Abweichung anhalten und Umfang/Bindung neu beurteilen. Danach führt Jan
   den lokalen Commit selbst aus. Zwischen Vergleich und Commit sind keine
   weiteren Änderungen zulässig; der manuelle Vergleich ist keine atomare
   Sperre. Hooks können Inhalte ändern und gehören daher auch zum Nachabgleich.
6. **Tatsächlichen Commit abgleichen:** Jan erfasst Commit-ID und Elterncommit,
   prüft den vollständigen Commitbaum mit `git ls-tree -r --full-tree HEAD`
   gegen den vorgesehenen Index und die zugeordneten Prüfbytes sowie den
   tatsächlichen Diff mit `git diff HEAD^ HEAD --`. Elterncommit muss der
   zuvor festgehaltene HEAD sein; Branch und Arbeitsbaum müssen danach sauber
   und erwartungsgemäß sein. Abweichungen bleiben offen und verlangen eine
   neue Bewertung statt einer behaupteten Zuordnung. Den Nachabgleich als
   datierte Ergänzung zum Vermerk aufbewahren.

Rohbytehashes des Prüfarbeitsbaums und Git-Blob-IDs sind unterschiedliche
Bindungen. `.gitattributes` und Git-Einstellungen können Zeilenenden beim
Staging normalisieren. Mit `git ls-files --eol`, den relevanten Attributen/
Einstellungen und dem Vergleich der tatsächlichen Blobinhalte die Zuordnung
belegen; erwartete LF-/CRLF-Unterschiede ausdrücklich ausweisen. Bloße
Textähnlichkeit oder ein normalisierter Hash ersetzt keine ursprüngliche
Rohbytebindung; weitere Inhaltsunterschiede sind neu zu beurteilen.

### Kurzer Prüfvermerk und Belegablage

Je Prüfvorgang einen neuen eindeutig benannten Unterordner in
`C:\Users\jslom\Documents\Projekte\GoldenDawn-Pruefnachweise` anlegen,
etwa `YYYY-MM-DDTHHmmssZ-local-commit-<eindeutige-ID>`. Bestehende Belege
nicht überschreiben. Der Ordner liegt außerhalb von Repository und Vault;
daraus folgt keine nachgewiesene Verschlüsselung oder besondere
Zugriffssicherung. Keine Secrets oder unnötigen persönlichen Daten ablegen.

Der kurze Vermerk enthält die folgenden Felder; umfangreiche Dateilisten und
Originaldaten dürfen über genaue Pfade und Rohbytehashes referenziert werden:

~~~text
Herkunft: Auftrag/Prüfer, Erfassungszeitpunkt; eigene Ausführung oder übernommener Beleg
Geprüfter Stand: Repository, Branch, ursprünglicher HEAD, Status, vollständiger Index,
  relevante Dateiliste mit Rohbytegrößen/SHA-256 und Erfassungszeit vor/nach dem Lauf
Umfang: erforderliche Suites/Regressionen/Build, Auswahl und begründete Grenzen
Befehle: Arbeitsverzeichnis, vollständige Befehle, Argumente und Flags
Umgebung: OS/Architektur, Node/npm, Programme, Abhängigkeiten, Paket-/Lockhashes,
  relevante Optionen; bei CI ursprüngliche Lauf-/Versuchs-/Jobbindung
Originalbelege: unveränderte Logs/Artefakte, Pfade, Größen und SHA-256
Ergebnis: Beginn/Ende, native Exitcodes/Signale, vollständige Abschlüsse,
  Fehler oder Lücken; Wiederverwendung nur für den belegten Umfang
Commitzuordnung: vorgesehener Branch/Elterncommit, vollständiger Index, Prüfbytes/
  Blobvergleich einschließlich EOL; unmittelbarer Zustandsabgleich
Nachtrag durch Jan: tatsächlicher Commit, Elterncommit, vollständiger Baumvergleich,
  sauberer Status, Zeitpunkt und verbleibende Abweichungen
~~~

Originalbelege bleiben unverändert; neue Zuordnungen werden getrennt datiert.
Test- und CI-Erfolge liefern kein authentisches Runtime-`A_obs`.
`overallGate: FAIL`, `causeStatus: CAUSE_NOT_PROVEN`, `NOT_EVIDENCE` und
`runtimeRecord:null` bleiben bestehen. Reale Diagnose, Browserkomposition,
Browser-E2E, Writer, Persistenz und Provider erhalten keine Freigabe.

## Vollständiger Commit-Ablauf

Dateien werden bewusst einzeln und manuell ausgewählt. Das Skript führt niemals
git add aus und verweigert zusätzliche unstaged oder untracked Dateien.

~~~powershell
git status --short
git add scripts/git/Invoke-CommitWorkflow.ps1
git add scripts/git/Remove-MergedLocalBranch.ps1
git add docs/git-workflows.md
git add README.md

.\scripts\git\Invoke-CommitWorkflow.ps1 `
  -Message "chore: sichere PowerShell-Git-Workflows ergänzen" `
  -WhatIf

.\scripts\git\Invoke-CommitWorkflow.ps1 `
  -Message "chore: sichere PowerShell-Git-Workflows ergänzen"
~~~

Der Workflow prüft Mergekonflikte und den gestagten Diff, führt
`npm test -- --experimental-vm-modules --no-warnings --test-concurrency=1` und
`npm run build` aus und kontrolliert danach erneut den Arbeitsbaum. Die
netzwerkfreien Adaptertests benötigen `vm.SourceTextModule` im selben Realm;
der VM-Schalter ist für diesen Testload erforderlich. `--no-warnings`
unterdrückt die experimentelle VM-Warnung, und `--test-concurrency=1` hält die
Gesamtsuite seriell. Diese Testargumente erweitern nicht das geschlossene
Runtimeprofil eines späteren Adapterlaufs. Vor einer
Bestätigung zeigt er Branch, Status, Dateistatus, Diff-Statistik und
Commit-Message an.

`-WhatIf` verhindert beim Commit-Workflow nur das Erstellen des Commits. Tests
und Build werden trotzdem ausgeführt. npm-Skripte und Git-Hooks sind lokaler
ausführbarer Code; vor der Ausführung müssen sie deshalb vertrauenswürdig sein.
Für native Prozessausgaben verwendet das Skript nur während seiner Laufzeit
UTF-8 und stellt die ursprünglichen PowerShell- und Konsolenwerte anschließend
auch auf Fehlerpfaden wieder her.

## Vollständiger Cleanup-Ablauf

Remote-Informationen werden separat und bewusst aktualisiert. Erst danach wird
der lokale Branch geprüft:

~~~powershell
git switch main
git pull --ff-only
git fetch --prune

.\scripts\git\Remove-MergedLocalBranch.ps1 `
  -BranchName "chore/powershell-git-workflows" `
  -BaseBranch main `
  -WhatIf

.\scripts\git\Remove-MergedLocalBranch.ps1 `
  -BranchName "chore/powershell-git-workflows" `
  -BaseBranch main
~~~

Das Cleanup-Skript selbst wechselt keinen Branch, führt weder Fetch noch Pull
aus und berührt keine Remote-Branches.

## Normaler Merge und Squash-Merge

Bei einem normalen Merge weist git merge-base --is-ancestor nach, dass der
Ziel-Branch vollständig im Basis-Branch enthalten ist. Das Skript verwendet
dann ausschließlich git branch -d.

Nach einem Squash-Merge besteht diese Vorfahrbeziehung normalerweise nicht. Das
Skript akzeptiert als alternative technische Löschbedingung ausschließlich
exakt identische Tree-Hashes beider lokalen Branches. Diese
`SQUASH-TREE-PRÜFUNG` ist ausdrücklich kein Beweis für einen gemergten Pull
Request oder dessen Status. Das Skript kennt keinen PR-Status und führt keine
Netzwerkabfrage durch. Gleichen sich die Trees nicht, bricht es ohne
Force-Option ab.

Ein Branchname allein gilt niemals als Nachweis für einen gemergten Pull
Request.

Nach der Bestätigung werden Arbeitsbaum, ausgecheckter Base-Branch, beide
exakten Refs, Commit-OIDs und Löschbedingung nochmals geprüft. Zwischen dieser
letzten Prüfung und `git branch` verbleibt ein minimales Rennen, weil Git für
diese Kombination keine atomare Prüfen-und-Löschen-Operation anbietet.
