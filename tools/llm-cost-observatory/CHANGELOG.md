# Changelog

All notable changes to this tool will be documented in this file.

## [0.2.0] - 2026-05-28
### Added
- Complete CLI implementation for `ingest`, `report`, `anomalies`, and `export`.
- JSONL/CSV ingestion with normalization and required-field validation.
- Local store (`.lco/events.jsonl`) and report windowing support.
- Spend and reliability analytics (cost rollups, error rates, retry rates).
- Anomaly detection for spend spikes, high retry rate, and high error rate.
- CSV/JSON export and table output modes.
- Automated tests for parser and pipeline behavior (`node --test`).
- End-to-end walkthrough from wrapper collection to report export.

## [0.1.2] - 2026-05-28
### Added
- BrainTrust-style single-line `withCostTracking(...)` wrapper helper.
- Per-call attribution support (`feature`, `userId`, `tags`, `metadata`).
- Updated wrapper example to use the one-line client wrap pattern.

## [0.1.1] - 2026-05-28
### Added
- Data collection guide with practical wrapper-first onboarding.
- OpenAI API wrapper example that logs canonical JSONL usage events.
- End-to-end Mermaid flow diagram in README.

## [0.1.0] - 2026-05-28
### Added
- Initial documentation, roadmap, schema, and sample dataset.
