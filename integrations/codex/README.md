# Codex integration

Capture LLM spend from the OpenAI Codex CLI / agent.

## Option A: logging proxy (measures Codex's own calls)
Codex reads OpenAI client config from the environment. Point it at a proxy you
control:

```bash
export OPENAI_BASE_URL=http://localhost:8787/v1
export OPENAI_API_KEY=sk-...            # real key, used by the proxy
export LCO_FEATURE=codex-session
```

The proxy forwards each request to `https://api.openai.com/v1` and appends one
event per call to `usage-events.jsonl`:

- `provider`: `openai`
- `model`: from the response body
- `feature`: `process.env.LCO_FEATURE`
- `prompt_tokens` / `completion_tokens` / `total_tokens`: from `response.usage`
- `cost_usd`: price table lookup (see the wrapper's `estimateCostUsd`)
- `status`: `ok` / `error` / `rate_limited` / `timeout`
- `latency_ms`, `request_id`

Any OpenAI-compatible logging gateway works; reuse the field mapping in
[`with-cost-tracking.mjs`](../../tools/llm-cost-observatory/examples/wrappers/with-cost-tracking.mjs).

## Option B: usage export backfill
Download the OpenAI usage export for the date range and convert each row to a
usage event. `feature` will be coarse (`codex`) since export rows lack call-site
context.

## Ingest
```bash
cd tools/llm-cost-observatory
node src/cli.mjs ingest ./examples/usage-events.jsonl
node src/cli.mjs report --group-by feature --window 7d
```
