param(
  [string]$ToolsPath = "tools"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$toolsRoot = Join-Path $repoRoot $ToolsPath

if (-not (Test-Path $toolsRoot)) {
  Write-Error "Tools directory not found: $toolsRoot"
}

$toolDirs = Get-ChildItem -Path $toolsRoot -Directory
if ($toolDirs.Count -eq 0) {
  Write-Error "No tools found under $toolsRoot"
}

$requiredFiles = @("README.md", "CHANGELOG.md", "VERSION")
$missing = @()

foreach ($tool in $toolDirs) {
  foreach ($file in $requiredFiles) {
    $path = Join-Path $tool.FullName $file
    if (-not (Test-Path $path)) {
      $missing += "Missing $file in $($tool.Name)"
    }
  }

  $versionPath = Join-Path $tool.FullName "VERSION"
  if (Test-Path $versionPath) {
    $version = (Get-Content -Path $versionPath -Raw).Trim()
    if ($version -notmatch '^\d+\.\d+\.\d+$') {
      $missing += "Invalid VERSION format in $($tool.Name): '$version'"
    }
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Validation failed:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Tool validation passed." -ForegroundColor Green
