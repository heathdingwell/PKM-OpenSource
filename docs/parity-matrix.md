# PKM UX Parity Matrix

## Scope and intent
This matrix defines how the app should behave so the user experience feels like PKM while keeping Markdown files as the source of truth.

Legend:
- `P0`: must match for MVP
- `P1`: high-value, next phase
- `P2`: later

## Information architecture
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Vault and folders | Local folder tree maps directly to filesystem folders. | P0 | Creating, renaming, and moving folders updates disk layout without data loss. |
| Notebooks and stacks | Optional virtual notebook view over folders with collapsible groupings. | P1 | User can browse notes by folder tree and by notebook grouping. |
| Tags | Inline tags and tag browser with counts. | P0 | Tag list updates immediately after note save; tag click filters notes. |
| Shortcuts | Pin notes, tags, folders, and saved searches. | P1 | Shortcuts persist across restarts and are keyboard accessible. |
| Recents | Most recently opened or edited notes feed. | P1 | Recents order is stable and updates on open or edit events. |

## Note list and card presentation
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Preview extraction | Title + snippet + metadata chips extracted from Markdown. | P0 | Snippet excludes frontmatter; formatting stripped consistently. |
| Density options | Compact and comfortable list or card modes. | P1 | Toggle changes row or card height and persists preference. |
| Sorting | Sort by updated date, created date, title. | P0 | Sort order is deterministic and preserved per user preference. |
| Grouping | Group by date buckets or notebook or tag. | P2 | Group headers render correctly with keyboard navigation. |
| Multi-select | Bulk operations for tags, move, delete. | P1 | Multi-select works with shift-click and keyboard modifiers. |

## Editor parity and Markdown guarantees
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Markdown round-trip | Rich editing never corrupts Markdown semantics. | P0 | Edit -> save -> reload yields equivalent rendered output and stable text. |
| Core formatting | Bold, italic, highlight, heading, quote, code, checklist, links. | P0 | Toolbar, shortcuts, and slash command all produce same output. |
| Tables | Visual table editing with Markdown serialization. | P1 | Table operations (add row or col, align) serialize to valid Markdown tables. |
| Embeds and attachments | Drag and drop files and embed images or PDF links. | P1 | Files stored in attachments folder and links remain relative. |
| Command palette | Fast action launcher with keyboard shortcuts. | P1 | Palette returns actions under 100ms on 10k notes index. |
| Paste normalization | Clean paste from web or docs with predictable markdown output. | P0 | Pasting common sources strips unsafe HTML and preserves structure. |

## Knowledge graph and linking
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Wikilinks | `[[Note Name]]` autocompletion and creation. | P0 | Unknown link creates new note on open. |
| Backlinks | Automatic inbound references panel. | P0 | Panel updates within one save cycle. |
| Outgoing links | Display outgoing links for current note. | P1 | List reflects current unsaved editor state. |
| Graph view | Interactive local and global graph. | P2 | Node click opens note and graph filters by scope. |

## Search and discovery
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Full text search | Fast indexed search across note content. | P0 | Top 10 result query returns in under 100ms on 10k notes. |
| Filters | Search by tag, folder, date range, attachment type. | P1 | Filter syntax is documented and works with UI builders. |
| Saved searches | Persist reusable advanced queries. | P1 | Saved searches appear in sidebar and can be edited or deleted. |

## Tasks and reminders
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Checklist extraction | Detect markdown checkboxes and list open tasks. | P1 | Task view updates when notes are saved. |
| Reminders | Date-based reminder metadata on notes. | P2 | Reminder list shows upcoming and overdue items. |

## Cross-platform and extensibility
| Area | Target behavior | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| Desktop app | Electron app for macOS, Windows, Linux. | P0 | App launches with same vault on all supported desktop OSes. |
| Plugin API | Scriptable commands, panels, and note transforms. | P2 | Third-party plugin can register command and sidebar panel. |
| Theme API | CSS variables and UI token system. | P1 | Custom theme can override typography, spacing, and colors safely. |

## Non-goals (initially)
- Real-time multi-user collaboration.
- Full PKM account import parity beyond ENEX basics.
- AI features.
