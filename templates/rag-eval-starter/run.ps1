param(
  [string]$Input = "$PSScriptRoot/sample-traces.jsonl"
)

$ErrorActionPreference = "Stop"
$MinHitRate = 0.7
$MinGroundedRate = 0.8

$rdk = "$PSScriptRoot/../../tools/rag-debug-kit/src/cli.mjs"
$store = "$PSScriptRoot/.store.jsonl"

if (Test-Path $store) { Remove-Item $store }
node $rdk analyze $Input --store $store
node $rdk report --group-by feature --store $store

$report = node $rdk export --type report --format json --store $store | ConvertFrom-Json
$hit = [double]($report.totals.hit_rate)
$grounded = [double]($report.totals.grounded_rate)
Write-Host "hit_rate=$hit (min $MinHitRate), grounded_rate=$grounded (min $MinGroundedRate)"

$fail = $false
if ($hit -lt $MinHitRate) { Write-Host "FAIL: hit_rate below threshold"; $fail = $true }
if ($grounded -lt $MinGroundedRate) { Write-Host "FAIL: grounded_rate below threshold"; $fail = $true }
if ($fail) { exit 1 }
