# Cost review starter

Weekly LLM spend review using
[`llm-cost-observatory`](../../tools/llm-cost-observatory/README.md).

## Weekly steps
1. Export the week's usage events to JSONL (see the tool's data-collection guide).
2. Run `./run.sh path/to/usage-events.jsonl` (or `run.ps1` on Windows).
3. In review, look at:
   - Top 3 features by cost and their week-over-week delta
   - Any `spend_spike`, `high_retry_rate`, or `high_error_rate` anomalies
   - Model mix: could a cheaper model serve a high-volume feature?
4. File one action item per anomaly.

## Files
- `run.sh` / `run.ps1` - ingest, report by feature and model, list anomalies
- `sample-usage.jsonl` - tiny example input so the script runs out of the box
