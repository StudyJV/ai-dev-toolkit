# LLM Cost Observatory

Track and explain LLM spend by feature, model, provider, and workflow.

## MVP scope
- Parse JSONL/CSV usage logs
- Normalize records into a canonical event schema
- Generate spend reports by day/week and dimensions
- Flag anomalies (spikes, retry-heavy paths)
- Export terminal, CSV, and JSON reports

## Quick start (target)
```bash
npm install
npm run build
node dist/cli.js ingest ./examples/sample-usage.jsonl
node dist/cli.js report --group-by feature --window 7d
```

## Commands (planned)
- `ingest <path>`
- `report --group-by <field> --window <range>`
- `anomalies --window <range>`
- `export --format csv|json`

## Schema
See `schemas/usage-event.schema.json`.

Required fields:
- `timestamp`
- `provider`
- `model`
- `feature`
- `request_id`
- `total_tokens`
- `cost_usd`
- `status`
