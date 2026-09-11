# AI Dev Toolkit

A monorepo of practical, adoption-first tools for AI product and platform teams.

## Vision
Ship small tools that solve real engineering pain around LLM apps: cost, quality, retrieval, reliability, and operations.

## Current tools
- `tools/llm-cost-observatory` - track and explain LLM spend by feature, model, and workflow.

## Current integrations
- `integrations/` - capture usage events from Codex, Cursor, and Claude. See [`integrations/README.md`](integrations/README.md).

## Planned tools
- `tools/prompt-evals-starter`
- `tools/rag-debug-kit`
- `tools/ai-feature-guardrails`

## Repo layout
- `core/` shared schemas, conventions, and utilities
- `tools/` independently usable tools
- `integrations/` thin adapters for Codex, Cursor, Claude
- `examples/` cross-tool usage examples and sample data

## Principles
- Useful in under 10 minutes
- Tool-agnostic first, agent integrations second
- Observable output: tables, reports, and artifacts teams can review
- Safe defaults: no raw PII assumptions

## Contributing
Each tool should include:
- `README.md`
- `docs/roadmap.md`
- sample input in `examples/`
- clear output examples

## License
MIT
