# Claude integration

Capture LLM spend from Claude Code and direct Anthropic API use.

## Option A: wrap your own Anthropic client (best attribution)
For app code that Claude Code writes or runs, wrap the client the same way as the
OpenAI example. Map Anthropic's usage shape to the event schema:

- `provider`: `anthropic`
- `model`: `response.model`
- `prompt_tokens`: `response.usage.input_tokens`
- `completion_tokens`: `response.usage.output_tokens`
- `total_tokens`: `input_tokens + output_tokens`
- `cost_usd`: price table lookup by model
- `status`, `latency_ms`, `request_id`

The helper in
[`with-cost-tracking.mjs`](../../tools/llm-cost-observatory/examples/wrappers/with-cost-tracking.mjs)
already reads `input_tokens` / `output_tokens` in `buildEvent`; add Claude models
to its `pricing` map.

## Option B: logging proxy for Claude Code
Set an Anthropic-compatible base URL so Claude Code's own calls flow through a
proxy you control:

```bash
export ANTHROPIC_BASE_URL=http://localhost:8788
export LCO_FEATURE=claude-code-session
```

The proxy forwards to `https://api.anthropic.com` and appends one event per call.

## Option C: Anthropic Console usage export
Export usage for the date range and convert rows to events with
`provider: anthropic`, `feature: claude-code`, and per-row tokens and cost.

## Ingest
```bash
cd tools/llm-cost-observatory
node src/cli.mjs ingest ./examples/usage-events.jsonl
node src/cli.mjs report --group-by provider --window 7d
```
