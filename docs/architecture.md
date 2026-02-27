# Architecture (Markdown-first + Evernote-like UX)

## Goals
- Plain Markdown files remain the source of truth.
- UI and interaction model target Evernote-like usability.
- Local-first performance with deterministic behavior.
- Extensible core for plugins and future sync.

## Proposed stack
- Desktop shell: Electron
- UI: React + TypeScript
- State: Zustand or Redux Toolkit (final choice in implementation spike)
- Editor: ProseMirror via Tiptap with custom schema extensions
- Local index: SQLite with FTS5
- Filesystem: Node fs with chokidar watchers
- Validation and contracts: Zod
- Testing: Vitest + Playwright

## High-level modules
1. `app-shell`
- window lifecycle, layout persistence, command routing

2. `vault-core`
- vault discovery, folder and note CRUD, attachment management
- path normalization and slugging rules

3. `doc-engine`
- markdown parse/serialize pipeline
- editor schema mapping
- import/export normalizers

4. `indexer`
- content and metadata extraction
- full-text index updates
- backlinks and tag graph materialization

5. `ui-features`
- sidebar tree, note list, editor surface
- quick switcher, command palette, filter builder

6. `sync-adapter` (future)
- change log, remote transport, conflict policy

## Data model (initial)
### Note record
- `id`: stable UUID
- `path`: vault-relative file path
- `title`: derived from heading or first line fallback
- `tags`: normalized tag list
- `createdAt`: file birthtime or metadata
- `updatedAt`: mtime + save events
- `snippet`: plain text preview
- `linksOut`: extracted wiki and markdown links

### Attachment record
- `id`: stable UUID
- `path`: vault-relative binary path
- `mime`: detected type
- `size`: bytes
- `linkedFrom`: note ids

### Saved search record
- `id`: stable UUID
- `name`: display label
- `query`: filter expression

## Markdown pipeline rules
- Parse markdown to AST.
- Map AST to editor document model.
- Map editor model back to markdown with stable formatting rules.
- Preserve unsupported constructs in protected blocks to avoid data loss.
- Snapshot test parse and serialize round-trips.

## Indexing pipeline
- File watcher emits changed paths.
- Parser extracts note metadata and text body.
- Indexer updates:
  - FTS table for content
  - tags table
  - link edges table
  - note metadata table
- Incremental updates should complete within 200ms for typical note edits.

## Conflict strategy (local and future sync)
- Single-device: external file change watcher + three-way merge on overlap.
- Multi-device (future): operation log with vector clock metadata.
- User-visible conflict resolution modal for unresolved merges.

## Security and privacy baseline
- Default local-only operation.
- No telemetry unless explicitly enabled.
- Plugin permissions model required before third-party plugin execution.

## Milestones
1. Foundation
- project scaffold, vault-core, basic shell layout

2. Core editing
- note CRUD, markdown editor, autosave, backlinks, tags

3. Discovery
- indexed search, quick switcher, saved searches

4. Experience parity
- note card density modes, polish, keyboard parity, accessibility

5. Extensibility
- plugin API v1, theming API, import improvements
