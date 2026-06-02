# Data Collection Guide

This tool needs one usage event per model call. The easiest first path is to wrap your existing API client and write JSONL logs.

## What to collect
For each LLM request, record:
- `timestamp`
- `provider`
- `model`
- `feature`
- `endpoint`
- `request_id`
- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `cost_usd`
- `status`
- `latency_ms`

Optional:
- `retry_count`
- `user_id` (hashed)
- `metadata`

## Where to collect from
- Your server/app wrapper around OpenAI/Anthropic API calls.
- Provider exports for backfill (less context-rich).

If you only use chat apps directly (ChatGPT/Claude UI), you usually will not get event-level logs needed for feature-level attribution.

## Single-line wrapper pattern
```js
import OpenAI from "openai";
import { withCostTracking } from "./examples/wrappers/with-cost-tracking.mjs";

const openai = withCostTracking(new OpenAI(), { feature: "summarization" });
```

Per-call attribution:
```js
await openai.responses.create(
  { model: "gpt-5-mini", input: "Summarize doc-123" },
  { attribution: { userId: "hash_u123", metadata: { documentId: "doc-123" } } }
);
```

## Quick start wrapper
Use:
- `examples/wrappers/with-cost-tracking.mjs`
- `examples/wrappers/openai-wrapper-example.mjs`

It writes JSONL to:
- `tools/llm-cost-observatory/examples/usage-events.jsonl`

## Flow after collection
1. Add wrapper around production API calls.
2. Append one JSON event per call to a daily JSONL file.
3. Validate file shape against `schemas/usage-event.schema.json`.
4. Run ingest/report commands in this tool.
5. Share weekly spend deltas by feature/model/provider.
