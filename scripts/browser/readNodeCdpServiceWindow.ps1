param(
    [Parameter(Mandatory = $true)][ValidateRange(1, 4294967295)][long]$CandidatePid,
    [Parameter(Mandatory = $true)][ValidateLength(7, 1024)][string]$ExpectedExecutable
)

# Read-only candidate observation. No titles, contents, activation or close calls.
# No process-name search, replacement PID, privilege adjustment or policy bypass.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$clock = [System.Diagnostics.Stopwatch]::StartNew()
$candidateProcess = $null
$result = @{ schema = 1; status = 'UNPROVEN'; pid = $CandidatePid;
    executable = $null; handle = $null; processStartUtcTicks = $null }
try {
    if ($args.Count -ne 0 -or $ExpectedExecutable -notmatch '^[A-Za-z]:\\[^\r\n"<>|?*]+\.exe$') { throw 'INPUT' }
    $candidateProcess = [System.Diagnostics.Process]::GetProcessById([int]$CandidatePid)
    $image = $candidateProcess.MainModule.FileName
    $started = $candidateProcess.StartTime.ToUniversalTime().Ticks.ToString()
    if ($candidateProcess.HasExited -or -not [String]::Equals($image, $ExpectedExecutable, [StringComparison]::OrdinalIgnoreCase)) { throw 'IDENTITY' }
    # In-memory interop only: no Add-Type compiler process, source or DLL files.
    $assembly = [AppDomain]::CurrentDomain.DefineDynamicAssembly(
        [Reflection.AssemblyName]::new('GoldenDawnWindowObservation'), [Reflection.Emit.AssemblyBuilderAccess]::Run)
    $module = $assembly.DefineDynamicModule('Observation')
    $delegateBuilder = $module.DefineType('WindowCallback', 'Class, Public, Sealed', [MulticastDelegate])
    $constructor = $delegateBuilder.DefineConstructor('Public, HideBySig, RTSpecialName',
        [Reflection.CallingConventions]::Standard, [Type[]]@([object], [IntPtr]))
    $constructor.SetImplementationFlags('Runtime, Managed')
    $invoke = $delegateBuilder.DefineMethod('Invoke', 'Public, HideBySig, NewSlot, Virtual',
        [bool], [Type[]]@([IntPtr], [IntPtr]))
    $invoke.SetImplementationFlags('Runtime, Managed')
    $callbackType = $delegateBuilder.CreateType()
    $nativeBuilder = $module.DefineType('WindowReadOnly', 'Class, Public, Sealed, Abstract')
    $definitions = @(
        @{ name = 'EnumWindows'; result = [bool]; parameters = [Type[]]@($callbackType, [IntPtr]) },
        @{ name = 'GetWindowThreadProcessId'; result = [uint32]; parameters = [Type[]]@([IntPtr], [uint32].MakeByRefType()) },
        @{ name = 'IsWindowVisible'; result = [bool]; parameters = [Type[]]@([IntPtr]) }
    )
    foreach ($definition in $definitions) {
        $method = $nativeBuilder.DefinePInvokeMethod($definition.name, 'user32.dll',
            'Public, Static, PinvokeImpl', [Reflection.CallingConventions]::Standard,
            $definition.result, $definition.parameters, [Runtime.InteropServices.CallingConvention]::Winapi,
            [Runtime.InteropServices.CharSet]::Unicode)
        $method.SetImplementationFlags('PreserveSig')
    }
    $native = $nativeBuilder.CreateType()
    if ($clock.ElapsedMilliseconds -ge 4000) { throw 'DEADLINE' }
    $observation = @{ scanned = 0; matches = 0; complete = $true; candidate = [IntPtr]::Zero }
    $enumerationStart = $clock.ElapsedMilliseconds
    $callback = [Management.Automation.LanguagePrimitives]::ConvertTo({
        param([IntPtr]$window, [IntPtr]$unused)
        try {
            $observation.scanned++
            if ($observation.scanned -gt 4096 -or $clock.ElapsedMilliseconds - $enumerationStart -ge 1000) {
                $observation.complete = $false
                return $false
            }
            [uint32]$owner = 0
            if ($native::GetWindowThreadProcessId($window, [ref]$owner) -eq 0) {
                $observation.complete = $false
                return $false
            }
            if ($owner -eq $CandidatePid -and $native::IsWindowVisible($window)) {
                $observation.matches++
                $observation.candidate = $window
            }
            return $true
        } catch { $observation.complete = $false; return $false }
    }, $callbackType)
    $enumerated = $native::EnumWindows($callback, [IntPtr]::Zero)
    [GC]::KeepAlive($callback)
    if (-not $enumerated -or -not $observation.complete -or $observation.matches -ne 1 -or
        $clock.ElapsedMilliseconds - $enumerationStart -ge 1000) { throw 'WINDOWS' }
    [uint32]$finalOwner = 0
    if ($native::GetWindowThreadProcessId($observation.candidate, [ref]$finalOwner) -eq 0 -or
        $finalOwner -ne $CandidatePid -or -not $native::IsWindowVisible($observation.candidate)) { throw 'WINDOW' }
    $handle = $observation.candidate.ToInt64().ToString([Globalization.CultureInfo]::InvariantCulture)
    $candidateProcess.Refresh()
    if ($clock.ElapsedMilliseconds -ge 4000 -or $candidateProcess.HasExited -or
        $candidateProcess.StartTime.ToUniversalTime().Ticks.ToString() -ne $started -or
        -not [String]::Equals($candidateProcess.MainModule.FileName, $image, [StringComparison]::OrdinalIgnoreCase) -or
        [String]::IsNullOrEmpty($handle)) { throw 'UNCONFIRMED' }
    $result.status = 'CANDIDATE'
    $result.executable = $image
    $result.handle = $handle
    $result.processStartUtcTicks = $started
} catch {
    # Static, bounded failure; never serialize foreign exception messages.
    $result.status = 'UNPROVEN'
} finally {
    if ($null -ne $candidateProcess) {
        try { $candidateProcess.Dispose() } catch { $result.status = 'UNPROVEN' }
    }
    $clock.Stop()
}
$result | ConvertTo-Json -Compress
