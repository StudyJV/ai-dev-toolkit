#!/usr/bin/env bash
set -euo pipefail

MIN_HIT_RATE=0.7
MIN_GROUNDED_RATE=0.8

INPUT="${1:-$(dirname "$0")/sample-traces.jsonl}"
RDK="$(dirname "$0")/../../tools/rag-debug-kit/src/cli.mjs"
STORE="$(dirname "$0")/.store.jsonl"

rm -f "$STORE"
node "$RDK" analyze "$INPUT" --store "$STORE"
node "$RDK" report --group-by feature --store "$STORE"

REPORT="$(node "$RDK" export --type report --format json --store "$STORE")"
HIT=$(node -e "const r=JSON.parse(process.argv[1]);process.stdout.write(String(r.totals.hit_rate ?? 0))" "$REPORT")
GROUNDED=$(node -e "const r=JSON.parse(process.argv[1]);process.stdout.write(String(r.totals.grounded_rate ?? 0))" "$REPORT")

echo "hit_rate=$HIT (min $MIN_HIT_RATE), grounded_rate=$GROUNDED (min $MIN_GROUNDED_RATE)"

FAIL=0
awk "BEGIN{exit !($HIT < $MIN_HIT_RATE)}" && { echo "FAIL: hit_rate below threshold"; FAIL=1; }
awk "BEGIN{exit !($GROUNDED < $MIN_GROUNDED_RATE)}" && { echo "FAIL: grounded_rate below threshold"; FAIL=1; }
exit $FAIL
