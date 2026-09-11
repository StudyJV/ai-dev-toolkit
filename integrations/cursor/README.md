# Cursor integration

Capture LLM spend from the Cursor editor.

Cursor routes model calls through its own backend, so you cannot wrap its client
directly. Two practical paths:

## Option A: custom OpenAI base URL (Cursor settings)
Cursor lets you set an OpenAI API key and a custom base URL under
`Settings -> Models`. Point the base URL at a proxy you control:

```bash
export OPENAI_BASE_URL=http://localhost:8787/v1
export LCO_FEATURE=cursor-session
```

The proxy forwards to `https://api.openai.com/v1` and appends one event per call
using the field mapping in
[`with-cost-tracking.mjs`](../../tools/llm-cost-observatory/examples/wrappers/with-cost-tracking.mjs)
(`provider: openai`, tokens and `request_id` from the response, `feature` from
`LCO_FEATURE`).

This only covers models served via your key; Cursor's bundled models are billed
by Cursor and must come from Option B.

## Option B: Cursor dashboard export
Export the team usage / invoice CSV from the Cursor dashboard and map each row to
a usage event:

- `provider`: `cursor`
- `model`: from the row
- `feature`: `cursor` (or split by editor/user if the export has it)
- `total_tokens`, `cost_usd`: from the row
- `status`: `ok`
- `request_id`: synthesize from row id + date

## Ingest
```bash
cd tools/llm-cost-observatory
node src/cli.mjs ingest ./examples/usage-events.jsonl
node src/cli.mjs report --group-by model --window 7d
```
