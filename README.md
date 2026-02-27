# PKM-OpenSource

Open source notes app with Markdown-first storage and an high-density experience layer.

## Workspace layout
- `apps/desktop`: Electron + React desktop shell
- `packages/vault-core`: filesystem-facing note and vault domain
- `packages/doc-engine`: markdown parsing and extraction helpers
- `packages/indexer`: local search and ranking scaffolding
- `packages/ui-features`: shared UI behavior contracts
- `docs`: parity, UI, and architecture specifications

## Quick start
1. `npm install`
2. `npm run dev`

## Current status
This is an implementation scaffold aligned to the docs in `docs/` and intended for iterative feature parity work.

## Implemented now
- Templates view with "set as template" and "use template" flows.
- Trash mode with restore/permanent delete and empty trash actions.
- Backlinks dock in notes view.
- Configurable Git vault backups (desktop):
  - Auto-commit backups are enabled by default.
  - Toggle in `AI Copilot -> Settings -> Git backup`.
  - Manual run via `Run Git backup now` in command palette (`cmd+shift+k`, then `>` query).
