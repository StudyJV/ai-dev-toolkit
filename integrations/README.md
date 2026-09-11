# Integrations

Thin adapters for capturing LLM usage events from agent coding tools into
[`tools/llm-cost-observatory`](../tools/llm-cost-observatory/README.md).

Each guide produces JSONL events that match
[`usage-event.schema.json`](../tools/llm-cost-observatory/schemas/usage-event.schema.json),
then you `ingest` and `report` as normal.

## Guides
- [Codex](./codex/README.md) - OpenAI Codex CLI / agent
- [Cursor](./cursor/README.md) - Cursor editor
- [Claude](./claude/README.md) - Claude Code / Anthropic API

## Which path fits you
- You own the app code the agent edits or runs: wrap your client with
  [`with-cost-tracking.mjs`](../tools/llm-cost-observatory/examples/wrappers/with-cost-tracking.mjs).
- You want to measure the agent's own model calls: route it through a logging
  proxy (below) or import the provider's usage export for backfill.

## Logging proxy pattern
Point the tool at an OpenAI/Anthropic-compatible base URL you control. The proxy
forwards the request and appends one event per call:

```
agent -> local proxy (logs JSONL) -> provider API
```

Set `feature` from an env var per session so spend is attributable
(e.g. `LCO_FEATURE=refactor-auth`).
