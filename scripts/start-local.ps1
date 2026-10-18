# Invoked by START-WEBSITE.cmd. Changes apply only to this launcher process.
$ErrorActionPreference = 'Stop'
$LauncherArguments = $args
$ProjectDirectory = Split-Path -Parent $PSScriptRoot
$RuntimeDirectory = Join-Path $ProjectDirectory '.runtime'

function Test-CompatibleVersion([string] $VersionText) {
    if ($VersionText -notmatch '^v?(\d+)\.(\d+)\.(\d+)$') { return $false }
    $MajorVersion = [int] $Matches[1]
    $MinorVersion = [int] $Matches[2]
    return ($MajorVersion -gt 22 -or ($MajorVersion -eq 22 -and $MinorVersion -ge 12))
}

function Test-UsableNode([string] $NodePath) {
    if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) { return $false }
    $NpmCliPath = Join-Path (Split-Path -Parent $NodePath) 'node_modules\npm\bin\npm-cli.js'
    if (-not (Test-Path -LiteralPath $NpmCliPath -PathType Leaf)) { return $false }
    try {
        $VersionText = & $NodePath --version 2>$null
        if ($LASTEXITCODE -ne 0) { return $false }
        return (Test-CompatibleVersion ([string] $VersionText).Trim())
    } catch {
        return $false
    }
}

function Get-WindowsArchitecture {
    $Architecture = $env:PROCESSOR_ARCHITECTURE
    if ($env:PROCESSOR_ARCHITEW6432) { $Architecture = $env:PROCESSOR_ARCHITEW6432 }
    switch ($Architecture.ToUpperInvariant()) {
        'AMD64' { return 'x64' }
        'ARM64' { return 'arm64' }
        default { throw 'This automatic launcher supports 64-bit Windows (x64 or ARM64).' }
    }
}

function Get-NodeRuntime {
    $SystemNodes = @(Get-Command node.exe -CommandType Application -All -ErrorAction SilentlyContinue)
    foreach ($SystemNode in $SystemNodes) {
        if (Test-UsableNode $SystemNode.Source) { return $SystemNode.Source }
    }

    $Architecture = Get-WindowsArchitecture
    if (Test-Path -LiteralPath $RuntimeDirectory) {
        $CachedRuntimes = @(Get-ChildItem -LiteralPath $RuntimeDirectory -Directory -Filter "node-v*-win-$Architecture*" |
            Where-Object { $_.Name -match '^node-v\d+\.\d+\.\d+-win-(x64|arm64)(-repair-[0-9a-f]{32})?$' } |
            Sort-Object { [version] ($_.Name -replace '^node-v', '' -replace '-win-(x64|arm64)(-repair-[0-9a-f]{32})?$', '') } -Descending)
        foreach ($CachedRuntime in $CachedRuntimes) {
            $CachedNode = Join-Path $CachedRuntime.FullName 'node.exe'
            if (Test-UsableNode $CachedNode) { return $CachedNode }
        }
    }

    Write-Host 'Preparing Node.js for this project. The first start needs an internet connection.'
    Write-Host 'Downloading an official LTS release from nodejs.org; no administrator access is needed.'
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $Releases = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing -TimeoutSec 30
    $Release = $Releases |
        Where-Object { $_.lts -and (Test-CompatibleVersion $_.version) -and ($_.files -contains "win-$Architecture-zip") } |
        Sort-Object { [version] ($_.version -replace '^v', '') } -Descending |
        Select-Object -First 1
    if (-not $Release) { throw 'No compatible Windows LTS release was found on nodejs.org.' }

    $VersionName = [string] $Release.version
    $RuntimeName = "node-$VersionName-win-$Architecture"
    $ArchiveName = "$RuntimeName.zip"
    $ReleaseUrl = "https://nodejs.org/dist/$VersionName"
    $TargetDirectory = Join-Path $RuntimeDirectory $RuntimeName
    $DownloadDirectory = Join-Path $RuntimeDirectory ('.download-' + [guid]::NewGuid().ToString('N'))
    $ArchivePath = Join-Path $DownloadDirectory $ArchiveName
    New-Item -ItemType Directory -Path $DownloadDirectory -Force | Out-Null

    try {
        $ChecksumText = (Invoke-WebRequest -Uri "$ReleaseUrl/SHASUMS256.txt" -UseBasicParsing -TimeoutSec 30).Content
        $ExpectedHash = $null
        $HashPattern = '^([a-fA-F0-9]{64})\s+\*?' + [regex]::Escape($ArchiveName) + '$'
        foreach ($Line in ($ChecksumText -split '\r?\n')) {
            if ($Line.Trim() -match $HashPattern) { $ExpectedHash = $Matches[1]; break }
        }
        if (-not $ExpectedHash) { throw "No official SHA256 checksum was found for $ArchiveName." }

        Write-Host "Downloading Node.js $VersionName ($Architecture)..."
        Invoke-WebRequest -Uri "$ReleaseUrl/$ArchiveName" -OutFile $ArchivePath -UseBasicParsing -TimeoutSec 180
        $ActualHash = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash
        if ($ActualHash -ne $ExpectedHash) { throw 'The Node.js download failed SHA256 verification. Please start again.' }

        Write-Host 'Checksum verified. Extracting the portable runtime...'
        Expand-Archive -LiteralPath $ArchivePath -DestinationPath $DownloadDirectory -Force
        $ExtractedDirectory = Join-Path $DownloadDirectory $RuntimeName
        if (-not (Test-UsableNode (Join-Path $ExtractedDirectory 'node.exe'))) {
            throw 'The downloaded Node.js runtime could not run on this computer.'
        }

        # Another double-click may have finished the same download in the meantime.
        if (Test-Path -LiteralPath $TargetDirectory) {
            if (Test-UsableNode (Join-Path $TargetDirectory 'node.exe')) {
                return (Join-Path $TargetDirectory 'node.exe')
            }
            # Preserve an existing runtime: another launch may be using or
            # repairing it. A healthy sibling is reused on subsequent starts.
            $TargetDirectory = Join-Path $RuntimeDirectory ($RuntimeName + '-repair-' + [guid]::NewGuid().ToString('N'))
        }
        try {
            # Directory.Move atomically fails if another launcher already won;
            # Move-Item would instead nest this directory inside the winner.
            [System.IO.Directory]::Move($ExtractedDirectory, $TargetDirectory)
        } catch {
            if (Test-UsableNode (Join-Path $TargetDirectory 'node.exe')) {
                return (Join-Path $TargetDirectory 'node.exe')
            }
            if (-not (Test-Path -LiteralPath $TargetDirectory)) { throw }
            $TargetDirectory = Join-Path $RuntimeDirectory ($RuntimeName + '-repair-' + [guid]::NewGuid().ToString('N'))
            [System.IO.Directory]::Move($ExtractedDirectory, $TargetDirectory)
        }
        return (Join-Path $TargetDirectory 'node.exe')
    } finally {
        if (Test-Path -LiteralPath $DownloadDirectory) {
            Remove-Item -LiteralPath $DownloadDirectory -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

try {
    Set-Location -LiteralPath $ProjectDirectory
    $NodeExecutable = Get-NodeRuntime
    $NodeDirectory = Split-Path -Parent $NodeExecutable
    $env:PATH = $NodeDirectory + [IO.Path]::PathSeparator + $env:PATH
    $env:NEXORA_NPM_CLI = Join-Path $NodeDirectory 'node_modules\npm\bin\npm-cli.js'
    & $NodeExecutable (Join-Path $PSScriptRoot 'start-local.mjs') @LauncherArguments
    exit $LASTEXITCODE
} catch {
    Write-Host ''
    Write-Host ('Could not start Nexora: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'For download errors, check your connection and try again.'
    Write-Host 'You can also install a current Node.js LTS release from https://nodejs.org/en/download.'
    exit 1
}
