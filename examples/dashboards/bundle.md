# AI Dev Toolkit - Review Bundle

Generated: 2026-09-11T00:31:41.621Z

## LLM cost

Grouped by `feature` - 5 requests, $0.1097, error rate 0.2.

| key | requests | cost_usd | error_rate |
| --- | --- | --- | --- |
| proposal_writer | 2 | 0.0872 | 0.5 |
| report_summarizer | 1 | 0.0185 | 0 |
| support_chat | 2 | 0.004 | 0 |

## RAG quality

Grouped by `feature` - 6 traces, hit rate 0.6, grounded 0.5, failure rate 0.666667.

| key | traces | hit_rate | grounded_rate | failure_rate |
| --- | --- | --- | --- | --- |
| billing-bot | 2 | 1 | 0.5 | 1 |
| docs-assistant | 4 | 0.333333 | 0.5 | 0.5 |

## Suggested review questions
- Which feature drives the most spend, and is its RAG quality holding up?
- Any feature with a rising failure rate that also grew in cost?
- Do ungrounded answers correlate with retry-heavy or error-heavy paths?
