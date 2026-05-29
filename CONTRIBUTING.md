# Contributing

This monorepo is optimized for consistent, high-signal tooling contributions.

## Non-negotiable rules
- Every tool lives under `tools/<tool-name>/`.
- Every tool must include:
  - `README.md`
  - `CHANGELOG.md`
  - `VERSION`
- Tool folder names must be kebab-case.
- Each PR should focus on one tool or one cross-cutting change.

## Folder conventions
- `core/`: shared contracts, schemas, and reusable logic
- `tools/`: independently usable tools
- `integrations/`: Codex/Cursor/Claude adapters and guides
- `examples/`: cross-tool examples
- `scripts/`: validation and automation scripts

Inside each tool:
- `src/`: implementation
- `docs/`: roadmap/design notes
- `examples/`: sample inputs/outputs
- `schemas/`: tool-specific contracts

## Versioning rules
- `VERSION` uses `MAJOR.MINOR.PATCH` (e.g. `0.1.0`).
- Increment version for every user-visible change.
- Add corresponding entry in `CHANGELOG.md`.

## Pull request checklist
- [ ] Tool folder follows conventions.
- [ ] `README.md`, `CHANGELOG.md`, and `VERSION` exist.
- [ ] `CHANGELOG.md` includes this change.
- [ ] `VERSION` updated appropriately.
- [ ] Examples updated if behavior changed.
- [ ] Validation script passes.

## Validation
Run:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-tools.ps1
```
