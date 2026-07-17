<#
.SYNOPSIS
Entfernt einen technisch löschbaren lokalen Branch nach Bestätigung.

.DESCRIPTION
Löscht ausschließlich einen exakt benannten lokalen Branch. Normale Merges
verwenden -d; bei exakt identischen Squash-Trees ist -D zulässig. Das Skript
führt keine Netzwerk- oder Remote-Operationen aus. Tree-Gleichheit ist kein
Nachweis für einen gemergten Pull Request. Zwischen letzter Prüfung und
`git branch` bleibt ein minimales, technisch nicht vollständig schließbares Rennen.

.PARAMETER BranchName
Name des zu prüfenden lokalen Branches.

.PARAMETER BaseBranch
Aktuell ausgecheckter lokaler Basis-Branch. Standard: main.

.EXAMPLE
.\scripts\git\Remove-MergedLocalBranch.ps1 -BranchName chore/example -WhatIf
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)][string]$BranchName,
    [string]$BaseBranch = 'main'
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

if ([string]::IsNullOrWhiteSpace($BranchName)) { throw 'BranchName darf nicht leer sein.' }
if ([string]::IsNullOrWhiteSpace($BaseBranch)) { throw 'BaseBranch darf nicht leer sein.' }
$BranchName = $BranchName.Trim()
$BaseBranch = $BaseBranch.Trim()
if ($BranchName.StartsWith('refs/', [StringComparison]::OrdinalIgnoreCase) -or
    $BaseBranch.StartsWith('refs/', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'BranchName und BaseBranch müssen kurze lokale Namen ohne refs/-Präfix sein.'
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
    [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('check-ref-format', '--branch', $BranchName))
    [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('check-ref-format', '--branch', $BaseBranch))
    $targetRef = "refs/heads/$BranchName"
    $baseRef = "refs/heads/$BaseBranch"

    $status = (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none')).Output
    if ($status.Count -gt 0) {
        throw 'Der Arbeitsbaum ist nicht sauber. Committe, stash oder entferne Änderungen vor dem Branch-Cleanup manuell.'
    }

    $branchResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('symbolic-ref', '--quiet', '--short', 'HEAD') -AllowedExitCodes @(0, 1)
    if ($branchResult.ExitCode -ne 0) { throw 'Branch-Cleanup bei Detached HEAD wird verweigert.' }
    $currentBranch = ($branchResult.Output -join '').Trim()
    if ($currentBranch -ne $BaseBranch) {
        throw "Der Basis-Branch '$BaseBranch' muss aktuell ausgecheckt sein. Aktuell: '$currentBranch'."
    }
    if ($BranchName -in @('main', 'master', $BaseBranch, $currentBranch)) {
        throw "Der geschützte oder aktuell ausgecheckte Branch '$BranchName' darf nicht gelöscht werden."
    }

    [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('show-ref', '--verify', '--quiet', $baseRef))
    [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('show-ref', '--verify', '--quiet', $targetRef))

    $targetOid = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$targetRef^{commit}")).Output -join '').Trim()
    $baseOid = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$baseRef^{commit}")).Output -join '').Trim()
    $ancestorResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('merge-base', '--is-ancestor', $targetRef, $baseRef) -AllowedExitCodes @(0, 1)
    $deleteFlag = $null
    $mergeDescription = $null
    if ($ancestorResult.ExitCode -eq 0) {
        $deleteFlag = '-d'
        $mergeDescription = "Normaler Merge: '$BranchName' ist vollständig in '$BaseBranch' enthalten."
    }
    else {
        $branchTree = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$targetRef^{tree}")).Output -join '').Trim()
        $baseTree = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$baseRef^{tree}")).Output -join '').Trim()
        if ($branchTree -ne $baseTree) {
            throw "Der Branch ist weder Vorfahr von '$BaseBranch' noch ist sein Tree exakt identisch. Prüfe den gemergten Pull Request manuell; eine Force-Option wird nicht angeboten."
        }
        $deleteFlag = '-D'
        $mergeDescription = "SQUASH-TREE-PRÜFUNG: Beide Tree-Hashes sind exakt identisch. Dies ist nur eine technische Löschbedingung und kein Nachweis eines gemergten Pull Requests."
    }

    Write-Host "`n$mergeDescription" -ForegroundColor Yellow
    Write-Host "Geplanter Befehl: git branch $deleteFlag -- $BranchName"
    if ($PSCmdlet.ShouldProcess("Lokaler Branch '$BranchName'", "$mergeDescription Löschen mit git branch $deleteFlag")) {
        $status = (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none')).Output
        if ($status.Count -gt 0) { throw 'Der Arbeitsbaum hat sich geändert; keine Löschung.' }
        $branchResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('symbolic-ref', '--quiet', '--short', 'HEAD') -AllowedExitCodes @(0, 1)
        if ($branchResult.ExitCode -ne 0 -or (($branchResult.Output -join '').Trim() -cne $BaseBranch)) { throw 'Der ausgecheckte BaseBranch hat sich geändert; keine Löschung.' }
        [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('show-ref', '--verify', '--quiet', $targetRef))
        [void](Invoke-NativeCommand -Command $script:GitCommand -Arguments @('show-ref', '--verify', '--quiet', $baseRef))
        $currentTargetOid = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$targetRef^{commit}")).Output -join '').Trim()
        $currentBaseOid = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$baseRef^{commit}")).Output -join '').Trim()
        if ($currentTargetOid -cne $targetOid -or $currentBaseOid -cne $baseOid) { throw 'Eine Branch-OID hat sich geändert; keine Löschung.' }
        $recheck = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('merge-base', '--is-ancestor', $targetRef, $baseRef) -AllowedExitCodes @(0, 1)
        if ($recheck.ExitCode -ne 0) {
            $targetTree = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$targetRef^{tree}")).Output -join '').Trim()
            $baseTree = ((Invoke-NativeCommand -Command $script:GitCommand -Arguments @('rev-parse', '--verify', "$baseRef^{tree}")).Output -join '').Trim()
            if ($targetTree -cne $baseTree) { throw 'Die technische Löschbedingung ist nicht mehr erfüllt; keine Löschung.' }
        }
        $deleteResult = Invoke-NativeCommand -Command $script:GitCommand -Arguments @('branch', $deleteFlag, '--', $BranchName)
        $deleteResult.Output | ForEach-Object { Write-Host $_ }
        Write-Host "`nLokale Branches:"
        (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('branch', '--list')).Output | ForEach-Object { Write-Host $_ }
        Write-Host "`nRepository-Status:"
        (Invoke-NativeCommand -Command $script:GitCommand -Arguments @('status', '--short', '--branch')).Output | ForEach-Object { Write-Host $_ }
    }
}
finally {
    Pop-Location
}
