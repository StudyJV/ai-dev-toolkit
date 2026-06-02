# E2E Walkthrough

This walkthrough shows a full local flow from wrapper logs to actionable report.

## 1. Collect events with wrapper
From this folder:

```bash
set OPENAI_API_KEY=your_key
node examples/wrappers/openai-wrapper-example.mjs
```

This appends events to:
- `tools/llm-cost-observatory/examples/usage-events.jsonl`

## 2. Ingest events into local store
```bash
node src/cli.mjs ingest ./examples/usage-events.jsonl
```

Default store path:
- `.lco/events.jsonl`

## 3. Generate cost report
```bash
node src/cli.mjs report --group-by feature --window 7d
```

## 4. Detect anomalies
```bash
node src/cli.mjs anomalies --window 7d --threshold 2 --min-daily-cost 0.01
```

## 5. Export artifacts
```bash
node src/cli.mjs export --type report --format csv --output ./examples/report-by-feature.csv --group-by feature --window 7d
node src/cli.mjs export --type anomalies --format json --output ./examples/anomalies.json --window 7d
```

## 6. Team review
Use exported files in weekly product + engineering review:
- highest cost features
- retry-heavy paths
- error-heavy paths
- spend spikes over baseline
