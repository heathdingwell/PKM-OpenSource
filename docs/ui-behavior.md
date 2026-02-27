# UI Behavior Contract

## Product principle
The UI should feel as scannable and structured as PKM while preserving a Markdown-native workflow under the hood.

## Layout model
- Primary shell: sidebar + note list + note editor.
- Sidebar width resizable and persistent.
- Note list width resizable and persistent.
- Collapse and expand controls for focus mode.

## Sidebar behavior
- Tree supports folders, tags, shortcuts, and saved searches.
- Expand or collapse state persists per node.
- Drag and drop supports folder move and note move.
- Keyboard navigation supports arrows, enter, and context menu key.

## Note list behavior
- Each row/card shows title, snippet, updated date, tags, and optional indicators.
- Selection states:
  - single select by click
  - range select by shift-click
  - toggle select by cmd or ctrl-click
- Double click opens note in focused editor mode.
- Infinite scroll with incremental fetch from local index.

## Editor behavior
- Rich text editing with Markdown output guarantees.
- Context toolbar appears on selection.
- Slash menu for block insertion.
- Markdown shortcuts enabled:
  - `# ` heading
  - `- [ ] ` checklist
  - `> ` quote
  - `` ``` `` code block
- Inline command completion for `[[wikilink]]`, `#tag`, and `@date` mentions (if enabled).

## Create, rename, and move flows
- New note:
  - created in current folder context
  - untitled placeholder title shown until first heading or line
- Rename note:
  - updates title and file name using slug rules
  - preserves incoming links with link resolution map
- Move note:
  - updates folder location on disk
  - updates internal path index and open tabs

## Save and conflict behavior
- Autosave after debounce (default 600ms) and on blur.
- Dirty indicator appears when unsaved edits exist.
- If external file change detected:
  - non-overlapping edits auto-merge
  - overlapping edits open conflict diff modal

## Search behavior
- Global quick switcher opens with cmd or ctrl + p.
- Search bar supports plain text and filter chips.
- Result ranking combines text score, recency, and exact title match boost.

## Accessibility baseline
- Full keyboard traversal for core workflows.
- Visible focus rings on all interactive elements.
- WCAG AA contrast for text and controls.
- Screen reader labels for note metadata chips and editor toolbar actions.

## Performance budgets (desktop)
- Cold startup to interactive: under 2.5s on reference machine.
- Open note transition: under 100ms for typical notes.
- Search first result paint: under 120ms at 10k note scale.

## Visual language constraints
- Clean, information-dense, low-noise UI.
- Typography and spacing tuned for scanability of long note lists.
- Avoid flashy transitions; keep motion purposeful and short (120-180ms).
