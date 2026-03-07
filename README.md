# PKM-OpenSource

Open source notes app with Markdown-first storage and a high-density desktop experience.

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

## Desktop packaging
- Local unpacked app bundle: `npm run package:desktop`
- Installable artifacts for current OS: `npm run dist:desktop`
- Output folder: `apps/desktop/release`

## Current status
Desktop personal V1 is implemented and packaged. The app supports daily note workflows, notebook and stack organization,
rich/plain-text editing, backlinks, templates, AI copilot integrations, configurable Git backups, import/export flows,
and keyboard-heavy note management. The remaining roadmap in `docs/` is long-tail parity and post-V1 refinement.

## Implemented now
- Templates view with "set as template" and "use template" flows.
  - Command palette: `Open templates`, `Toggle active note template`
- Notebook management from command palette includes `New notebook` and `Rename current notebook`.
- Navigation includes command palette action `Open all notes` to reset notebook scope.
- Active-note pinning actions via command palette:
  - `Toggle active note shortcut`
  - `Toggle active note pin to home`
  - `Toggle active note pin to notebook`
- Trash mode with restore/permanent delete and empty trash actions.
- Command palette action: `Restore note from Trash`.
- Command palette action: `Delete note permanently`.
- Command palette dynamically includes `Open notebook: ...` actions for current notebooks.
- Command palette dynamically includes `Open tag: #...` actions for current tags.
- Command palette dynamically includes recent note actions: `Open recent note: ...` and `Remove recent note: ...`.
- Command palette dynamically includes recent search actions: `Open recent search: ...` and `Remove recent search: ...`.
- Sidebar recent notes now support removing individual entries inline.
- Command palette dynamically includes shortcut note actions: `Open shortcut note: ...` and `Remove shortcut note: ...`.
- Command palette dynamically includes shortcut notebook/tag actions: `Open shortcut notebook: ...`, `Remove shortcut notebook: ...`, `Open shortcut tag: #...`, and `Remove shortcut tag: #...`.
- Command palette dynamically includes Home pin actions: `Open home pin: ...` and `Remove home pin: ...`.
- Command palette dynamically includes notebook pin actions: `Open notebook pin: ...` and `Remove notebook pin: ...`.
- Command palette dynamically includes template actions: `Open template: ...` and `Unset template: ...`.
- Command palette dynamically includes stack actions: `Move current notebook to stack: ...`, `Toggle stack: ...`, `Rename stack: ...`, and `Remove stack: ...`.
- Command palette dynamically includes saved search actions: `Open saved search: ...`, `Edit saved search: ...`, and `Remove saved search: ...`.
- Command palette trash/restore/delete actions now apply to selected notes when multiple cards are selected.
- Command palette duplicate action now applies to selected notes when multiple cards are selected.
- Command palette `Move note`, `Copy note to notebook`, and `Edit note tags` now apply to selected notes when multiple cards are selected.
- Command palette `Copy note markdown`, `Copy note HTML`, and `Copy note text` now apply to selected notes when multiple cards are selected.
- Command palette template/shortcut/home-pin/notebook-pin toggles now apply to selected notes when multiple cards are selected.
- Command palette `Copy note link`, `Copy note path`, and `Share note link` now apply to selected notes when multiple cards are selected.
- Keyboard shortcuts for move-to-trash (`⌘⌫`), move note (`⇧⌘M`), copy/share link/path (`⌘L`, `⌥⌘L`, `⌥⌘S`), and copy HTML/text (`⇧⌘H`, `⇧⌘T`) now apply to selected notes when multiple cards are selected.
- Rename actions (`⇧⌘R` and command palette) now require a single selected note and show a guard message for multi-selection.
- Note info/history actions (`⇧⌘I`, `⌥⌘H`, and command palette) now require a single selected note and show a guard message for multi-selection.
- Open actions for a single note (`⌘O`, `⌥⌘O`, local graph, and current-note tasks/files/calendar commands) now show clear guard messages when multiple notes are selected.
- Keyboard tag editor shortcut (`⌥⌘T`) opens bulk tag editing when multiple notes are selected.
- Command palette export actions for Markdown/HTML/Text now apply to selected notes when multiple cards are selected.
- Note card multi-select supports toggle selection (`⌘`/`Ctrl` click), shift-click range selection, and keyboard range selection with `Shift+↑/↓/Home/End`.
- Notebook tree keyboard navigation supports arrow keys and Home/End for traversal, stack collapse/expand, and nested notebook focus.
- Backlinks dock in notes view.
- Backlinks dock can be toggled with command palette (`Toggle backlinks pane`) and keyboard shortcut (`⇧⌘B`).
- Configurable Git vault backups (desktop):
  - Auto-commit backups are enabled by default.
  - Toggle in `AI Copilot -> Settings -> Git backup`.
  - Manual run via `Run Git backup now` in command palette (`cmd+shift+k`, then `>` query).
- Vault snapshots for manual backup/restore:
  - Export via command palette: `Export vault snapshot`
  - Restore via command palette: `Import vault snapshot`
- ENEX import (basic archive support):
  - Import `.enex` files via command palette: `Import ENEX archive`
  - Supports importing one or many ENEX files in a single picker operation
  - Imported notes are grouped into a notebook derived from the ENEX file name when importing from `All Notes`
  - Preserves note source URL and resource file names in generated Markdown
- Markdown file import:
  - Import one or many `.md`/`.markdown` files via command palette: `Import Markdown files`
  - Imports into current notebook, or `Imported` when browsing `All Notes`
- Text file import:
  - Import one or many `.txt`/`.text` files via command palette: `Import Text files`
  - Imports into current notebook, or `Imported` when browsing `All Notes`
- HTML file import:
  - Import one or many `.html`/`.htm` files via command palette: `Import HTML files`
  - Converts HTML to Markdown and imports into current notebook, or `Imported` when browsing `All Notes`
- Active-note export actions via command palette:
  - `Export note as Markdown`
  - `Export note as Text`
  - `Export note as HTML`
  - `Export note as PDF`
- Active-note copy actions via command palette:
  - `Copy note path`
  - `Copy note markdown`
  - `Copy note HTML`
  - `Copy note text`
  - Keyboard: `⌥⌘L` copies active note path
- Focused/full editor actions via command palette:
  - `Open note in Lite edit mode`
  - `Open note in full editor`
- Quick search result actions:
  - `Open in Lite edit mode` (button or `⌥⌘O`)
  - `Open in full editor` (button or `⇧⌘O`)
  - `Open local graph` (button or `⇧⌘G`)
  - `Share` selected result link (button or `⌥⌘S`)
  - `Note info` for selected result (button or `⇧⌘I`)
  - `Note history` for selected result (button or `⌥⌘H`)
  - `Edit tags` for selected result (button or `⌥⌘T`)
  - `Rename note` for selected result (button or `⌥⌘R`)
  - `Find in note` for selected result (button or `⇧⌘F`)
  - `Move note` for selected result (button or `⌥⌘M`)
  - `Copy to...` for selected result (button or `⌥⌘Y`)
  - `Open tasks` for selected result (button or `⌥⌘J`)
  - `Open files` for selected result (button or `⌥⌘F`)
  - `Open calendar` for selected result (button or `⌥⌘C`)
  - `Open reminders` for selected result (button or `⌥⌘U`)
  - `Set as template` for selected result (button or `⌥⌘5`)
  - `Add to shortcuts` for selected result (button or `⌥⌘6`)
  - `Pin to Home` for selected result (button or `⌥⌘7`)
  - `Pin to notebook` for selected result (button or `⌥⌘8`)
  - `Export as Markdown` for selected result (button or `⌥⌘1`)
  - `Export as HTML` for selected result (button or `⌥⌘2`)
  - `Export as Text` for selected result (button or `⌥⌘3`)
  - `Export as PDF` for selected result (button or `⌥⌘4`)
  - `Print` selected result (button or `⌥⌘P`)
  - `Duplicate note` for selected result (button or `⌥⌘D`)
  - `Restore` selected trashed result (button or `⌥⌘Z`)
  - `Move to Trash` for selected active result (button or `⌥⌘⌫`)
  - `Delete permanently` for selected trashed result (button or `⌥⌘⌫`)
  - `Copy path` for selected result (button or `⌥⌘L`)
- Vault refresh action:
  - Reload from disk via command palette: `Reload vault from disk`
- Explicit AI provider actions via command palette:
  - `Set AI provider: OpenAI|Claude|Gemini|Perplexity|OpenAI-compatible|Ollama`
  - `Toggle AI copilot pane`
  - `Open AI settings`
  - `Clear AI chat`
  - `Test AI connection`
  - `Fetch AI models`
- Explicit theme actions via command palette:
  - `Set theme: Cobalt`
  - `Set theme: Sky`
  - `Set theme: Slate`
- Explicit note sort actions via command palette:
  - `Set sort: Updated (newest first|oldest first)`
  - `Set sort: Created (newest first|oldest first)`
  - `Set sort: Title (A-Z|Z-A)`
- Explicit view and density actions via command palette:
  - `Set view: Cards|List`
  - `Set density: Comfortable|Compact`
- Reminder filtering actions via command palette:
  - `Set reminders filter: All|Overdue|Today|Upcoming`
- Reminder scope actions via command palette:
  - `Set reminders scope: All notes|Current note`
  - `Open reminders for current note`
- Task filtering actions via command palette:
  - `Set tasks filter: All|Overdue|Today|Upcoming|No due`
- Task scope/sort actions via command palette:
  - `Set tasks scope: All notes|Current note`
  - `Set tasks sort: Recent|Due soonest|Due latest`
- File filtering actions via command palette:
  - `Set files filter: All|Images|PDFs|Videos|Audio|Other`
- Files scope/sort actions via command palette:
  - `Set files scope: All notes|Current note`
  - `Set files sort: Recent|Name (A-Z)|Name (Z-A)`
- Calendar scope/sort/filter actions via command palette:
  - `Set calendar scope: All notes|Current note`
  - `Set calendar sort: Soonest|Latest`
  - `Set calendar filter: All calendars|<calendar name>`
- Explicit grouping actions via command palette:
  - `Set grouping: Off|Updated|Notebook|Tag`
- Explicit editor font actions via command palette:
  - `Set editor font: Palatino|Georgia|Sans Serif|Monospace`
- Explicit editor font size actions via command palette:
  - `Set editor size: Small|Medium|Large`
