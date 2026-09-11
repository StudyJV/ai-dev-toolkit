# RAG eval starter

Quality gate for a RAG pipeline using
[`rag-debug-kit`](../../tools/rag-debug-kit/README.md).

## Use as a gate
1. Capture a fixed eval set of traces (query, retrieved chunks, answer) with
   relevance labels (`is_relevant` or `expected_chunk_ids`).
2. Run `./run.sh path/to/traces.jsonl` (or `run.ps1`). It fails with a non-zero
   exit if `hit_rate` or `grounded_rate` fall below the thresholds in the script.
3. Wire the script into CI on PRs that touch retriever or prompt code.

## Tune
Edit `MIN_HIT_RATE` / `MIN_GROUNDED_RATE` at the top of the run script once you
have a baseline from your own eval set.

## Files
- `run.sh` / `run.ps1` - analyze, print report, enforce thresholds
- `sample-traces.jsonl` - example eval set so the script runs out of the box
