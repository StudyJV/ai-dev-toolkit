param(
  [string]$Input = "$PSScriptRoot/sample-usage.jsonl"
)

$ErrorActionPreference = "Stop"
$lco = "$PSScriptRoot/../../tools/llm-cost-observatory/src/cli.mjs"
$store = "$PSScriptRoot/.store.jsonl"

if (Test-Path $store) { Remove-Item $store }
node $lco ingest $Input --store $store
node $lco report --group-by feature --window 7d --store $store
node $lco report --group-by model --window 7d --store $store
node $lco anomalies --window 7d --threshold 2 --store $store
