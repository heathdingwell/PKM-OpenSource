# Evernote-OpenSource

Open source notes app with Markdown-first storage and an Evernote-like experience layer.

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
