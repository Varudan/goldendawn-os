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

Der Workflow prüft Mergekonflikte und den gestagten Diff, führt npm test und
npm run build aus und kontrolliert danach erneut den Arbeitsbaum. Vor einer
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
