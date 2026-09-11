#!/usr/bin/env bash
set -euo pipefail

INPUT="${1:-$(dirname "$0")/sample-usage.jsonl}"
LCO="$(dirname "$0")/../../tools/llm-cost-observatory/src/cli.mjs"
STORE="$(dirname "$0")/.store.jsonl"

rm -f "$STORE"
node "$LCO" ingest "$INPUT" --store "$STORE"
node "$LCO" report --group-by feature --window 7d --store "$STORE"
node "$LCO" report --group-by model --window 7d --store "$STORE"
node "$LCO" anomalies --window 7d --threshold 2 --store "$STORE"
