# RAG Debug Kit Roadmap

## 0.1.0 (now)
- Trace schema, `analyze`, `report`, `failures`, `export`
- Heuristic groundedness and lexical answer F1

## Next
- Embedding-based groundedness and semantic recall
- Per-chunk attribution in the answer
- Diff mode: compare two runs (retriever or prompt change)
- Adapter examples for LangChain / LlamaIndex trace formats

## Later
- Regression gates for CI (fail on hit_rate or grounded_rate drop)
- Bundle scored output into the cross-tool dashboard
