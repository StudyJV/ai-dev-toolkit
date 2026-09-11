# Cross-tool review bundle

Combine a [`llm-cost-observatory`](../../tools/llm-cost-observatory/README.md) report
and a [`rag-debug-kit`](../../tools/rag-debug-kit/README.md) report into one
Markdown + JSON bundle a team can review each week.

## Build
```bash
# 1. cost report
node ../../tools/llm-cost-observatory/src/cli.mjs ingest ../../tools/llm-cost-observatory/examples/sample-usage.jsonl --store ./cost.jsonl
node ../../tools/llm-cost-observatory/src/cli.mjs export --type report --format json --group-by feature --window 30d --store ./cost.jsonl --output ./sample-cost-report.json

# 2. rag report
node ../../tools/rag-debug-kit/src/cli.mjs analyze ../../tools/rag-debug-kit/examples/sample-traces.jsonl --store ./rag.jsonl
node ../../tools/rag-debug-kit/src/cli.mjs export --type report --format json --group-by feature --store ./rag.jsonl --output ./sample-rag-report.json

# 3. bundle
node ./build-bundle.mjs --cost ./sample-cost-report.json --rag ./sample-rag-report.json --out ./bundle
```

Either `--cost` or `--rag` may be omitted; that section renders as "not supplied".

## Output
- `bundle.md` - shareable summary: spend by feature, RAG quality by feature, review prompts
- `bundle.json` - the merged data for dashboards or further processing

Checked-in samples (`sample-cost-report.json`, `sample-rag-report.json`,
`bundle.md`, `bundle.json`) are generated from each tool's example data.
