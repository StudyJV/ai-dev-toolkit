# Changelog

## 0.1.0
- Initial MVP.
- `analyze` scores JSONL/JSON retrieval traces: hit@k, MRR, precision@k, recall@k, groundedness, answer F1.
- `report` aggregates by feature or failure type.
- `failures` lists failing traces by type (`empty_retrieval`, `no_hit`, `ungrounded`, `low_score`).
- `export` writes report/failures as JSON or CSV.
- Trace schema in `schemas/rag-trace.schema.json`.
