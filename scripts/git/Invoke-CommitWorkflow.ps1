<#
.SYNOPSIS
Prüft gestagte Änderungen und erstellt nach Bestätigung einen lokalen Commit.

.DESCRIPTION
Führt Sicherheitsprüfungen, Tests und den Produktions-Build aus. Das Skript
verändert den Index nicht und führt keine Netzwerkoperationen aus. npm-Skripte
und Git-Hooks sind lokaler ausführbarer Code. -WhatIf verhindert nur den Commit.

.PARAMETER Message
Die nicht leere Commit-Message.

.EXAMPLE
.\scripts\git\Invoke-CommitWorkflow.ps1 -Message "chore: Workflow ergänzen" -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)]
    [string]$Message
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [int[]]$AllowedExitCodes = @(0)
    )

    $commandOutput = @(& $Command @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
    if ($AllowedExitCodes -notcontains $exitCode) {
        $details = ($commandOutput | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine
        throw "Befehl '$Command $($Arguments -join ' ')' ist mit Exitcode $exitCode fehlgeschlagen.$([Environment]::NewLine)$details"
    }
    [pscustomobject]@{
        ExitCode = $exitCode
        Output = @($commandOutput | ForEach-Object { $_.ToString() })
    }
}

function Assert-CleanUnstagedState {
    $status = (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none')).Output
    $unexpected = @($status | Where-Object { $_.Length -lt 2 -or $_[1] -ne ' ' })
    if ($unexpected.Count -gt 0) {
        throw 'Es sind unstaged oder untracked Dateien vorhanden. Stage oder entferne sie manuell, damit getesteter Arbeitsbaum und Commit-Inhalt identisch sind.'
    }
}

function Assert-NoGitOperation {
    foreach ($marker in @('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer')) {
        $path = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--git-path', $marker)).Output -join '').Trim()
        if (Test-Path -LiteralPath $path) { throw "Laufender Git-Vorgang erkannt ($marker). Commit wird verweigert." }
    }
}

function Assert-WorkflowState {
    param([string]$ExpectedBranch, [string]$ExpectedHeadOid, [string]$ExpectedIndex)
    Assert-NoGitOperation
    $branch = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('symbolic-ref', '--quiet', '--short', 'HEAD') -AllowedExitCodes @(0, 1)
    if ($branch.ExitCode -ne 0) { throw 'Detached HEAD erkannt. Commit wird verweigert.' }
    $branchName = ($branch.Output -join '').Trim()
    if ($branchName -cne $ExpectedBranch -or $branchName -in @('main', 'master')) { throw 'Der Branch ist nicht mehr der unveränderte Feature-/Tooling-Branch.' }
    $headOid = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', 'HEAD^{commit}')).Output -join '').Trim()
    if ($headOid -cne $ExpectedHeadOid) { throw 'HEAD hat sich geändert. Commit wird verweigert.' }
    $index = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('ls-files', '--stage')).Output -join "`n")
    if ($index -cne $ExpectedIndex) { throw 'Der vollständige Indexzustand hat sich geändert. Commit wird verweigert.' }
    $conflicts = (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--name-only', '--diff-filter=U')).Output
    if ($conflicts.Count -gt 0) { throw 'Es bestehen Konflikte. Commit wird verweigert.' }
    $staged = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--cached', '--quiet', '--exit-code') -AllowedExitCodes @(0, 1)
    if ($staged.ExitCode -eq 0) { throw 'Es sind keine Änderungen mehr gestagt.' }
    Assert-CleanUnstagedState
    [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--cached', '--check'))
}

$originalOutputEncoding = $OutputEncoding
$originalConsoleInputEncoding = [Console]::InputEncoding
$originalConsoleOutputEncoding = [Console]::OutputEncoding
$utf8Encoding = New-Object System.Text.UTF8Encoding($false)

try {
$OutputEncoding = $utf8Encoding
[Console]::InputEncoding = $utf8Encoding
[Console]::OutputEncoding = $utf8Encoding

$trimmedMessage = $Message.Trim()
if ([string]::IsNullOrWhiteSpace($trimmedMessage)) {
    throw 'Die Commit-Message darf nicht leer sein.'
}

$gitApplication = Get-Command -Name 'git' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $gitApplication) {
    throw 'Git wurde nicht gefunden. Stelle sicher, dass git über PATH verfügbar ist.'
}
$script:GitCommand = $gitApplication.Source

$repositoryCheck = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--is-inside-work-tree')
if (($repositoryCheck.Output -join '').Trim() -ne 'true') {
    throw 'Das aktuelle Verzeichnis liegt nicht innerhalb eines Git-Repositorys.'
}
$repositoryRoot = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--show-toplevel')).Output -join '').Trim()
if ([string]::IsNullOrWhiteSpace($repositoryRoot)) {
    throw 'Der Repository-Root konnte nicht bestimmt werden.'
}

Push-Location -LiteralPath $repositoryRoot
try {
    $branchResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('symbolic-ref', '--quiet', '--short', 'HEAD') -AllowedExitCodes @(0, 1)
    if ($branchResult.ExitCode -ne 0) {
        throw 'Ein Commit bei Detached HEAD wird verweigert.'
    }
    $currentBranch = ($branchResult.Output -join '').Trim()
    if ($currentBranch -in @('main', 'master')) {
        throw "Direkte Commits auf dem geschützten Branch '$currentBranch' werden verweigert."
    }
    Assert-NoGitOperation
    $initialHeadOid = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', 'HEAD^{commit}')).Output -join '').Trim()
    $initialIndex = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('ls-files', '--stage')).Output -join "`n")

    $conflicts = (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--name-only', '--diff-filter=U')).Output
    if ($conflicts.Count -gt 0) {
        throw "Es bestehen Mergekonflikte. Löse sie vor dem Commit: $($conflicts -join ', ')"
    }

    $stagedResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--cached', '--quiet', '--exit-code') -AllowedExitCodes @(0, 1)
    if ($stagedResult.ExitCode -eq 0) {
        throw 'Es sind keine Änderungen gestagt. Wähle die Commit-Dateien manuell mit git add aus.'
    }

    Assert-CleanUnstagedState
    [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--cached', '--check'))
    Assert-WorkflowState -ExpectedBranch $currentBranch -ExpectedHeadOid $initialHeadOid -ExpectedIndex $initialIndex

    $npmApplication = Get-Command -Name 'npm.cmd' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $npmApplication) {
        $npmApplication = Get-Command -Name 'npm' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    if ($null -eq $npmApplication) {
        throw 'npm wurde nicht gefunden. Tests und Build können nicht ausgeführt werden.'
    }

    Write-Host 'Führe automatisierte Tests aus ...'
    $testResult = Invoke-NativeCommand -Command $npmApplication.Source -Arguments @('test')
    $testResult.Output | ForEach-Object { Write-Host $_ }
    Assert-WorkflowState -ExpectedBranch $currentBranch -ExpectedHeadOid $initialHeadOid -ExpectedIndex $initialIndex
    Write-Host 'Erstelle den Produktions-Build ...'
    $buildResult = Invoke-NativeCommand -Command $npmApplication.Source -Arguments @('run', 'build')
    $buildResult.Output | ForEach-Object { Write-Host $_ }
    Assert-WorkflowState -ExpectedBranch $currentBranch -ExpectedHeadOid $initialHeadOid -ExpectedIndex $initialIndex

    Write-Host "`nBranch: $currentBranch"
    Write-Host 'Status:'
    (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('status', '--short')).Output | ForEach-Object { Write-Host $_ }
    Write-Host "`nGestagte Dateien:"
    (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--cached', '--name-status')).Output | ForEach-Object { Write-Host $_ }
    Write-Host "`nStatistik:"
    (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('diff', '--cached', '--stat')).Output | ForEach-Object { Write-Host $_ }
    Write-Host "`nCommit-Message: $trimmedMessage"

    if ($PSCmdlet.ShouldProcess("Branch '$currentBranch'", "Lokalen Commit mit Message '$trimmedMessage' erstellen")) {
        Assert-WorkflowState -ExpectedBranch $currentBranch -ExpectedHeadOid $initialHeadOid -ExpectedIndex $initialIndex
        $commitResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('commit', '-m', $trimmedMessage)
        $commitResult.Output | ForEach-Object { Write-Host $_ }
        Write-Host "`nStatus nach dem Commit:"
        (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('status', '--short', '--branch')).Output | ForEach-Object { Write-Host $_ }
    }
}
finally {
    Pop-Location
}
}
finally {
    try {
        $OutputEncoding = $originalOutputEncoding
    }
    finally {
        try {
            [Console]::InputEncoding = $originalConsoleInputEncoding
        }
        finally {
            [Console]::OutputEncoding = $originalConsoleOutputEncoding
        }
    }
}
