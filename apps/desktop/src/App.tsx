import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SearchIndex } from "@pkm-os/indexer";
import { type NoteRecord, VaultService } from "@pkm-os/vault-core";
import RichMarkdownEditor, { type RichMarkdownEditorHandle } from "./RichMarkdownEditor";

interface SeedNote {
  notebook: string;
  fileName: string;
  markdown: string;
  updatedAt: string;
  isTemplate?: boolean;
}

interface AppNote extends NoteRecord {
  notebook: string;
  markdown: string;
  isTemplate?: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  noteIds: string[];
}

interface NotebookMenuState {
  x: number;
  y: number;
  notebook: string;
}

interface EditorContextMenuState {
  x: number;
  y: number;
}

interface MoveDialogState {
  noteIds: string[];
  destination: string;
  mode: "move" | "copy";
}

interface RenameDialogState {
  oldName: string;
  newName: string;
}

interface NoteRenameDialogState {
  noteId: string;
  newTitle: string;
}

interface StackDialogState {
  notebook: string;
  selectedStack: string;
  newStackName: string;
}

interface LastMoveState {
  previousById: Record<string, { notebook: string; path: string }>;
}

interface LastTrashState {
  notes: AppNote[];
}

interface NoteHistoryEntry {
  at: string;
  title: string;
  markdown: string;
}

interface NoteHistoryDialogState {
  noteId: string;
}

interface OpenTaskItem {
  id: string;
  noteId: string;
  lineIndex: number;
  noteTitle: string;
  notebook: string;
  text: string;
  updatedAt: string;
}

interface AttachmentItem {
  id: string;
  noteId: string;
  noteTitle: string;
  notebook: string;
  label: string;
  target: string;
  updatedAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  calendar: string;
  noteId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EventInsertOrigin {
  editor: EditorMode;
  markdownRange?: { start: number; end: number };
  richRange?: { from: number; to: number };
}

interface EventDialogState {
  mode: "create" | "edit";
  eventId: string | null;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  calendar: string;
  linkedNoteId: string | null;
  origin: EventInsertOrigin | null;
}

interface AppPrefs {
  selectedNotebook: string;
  activeId: string;
  sidebarWidth?: number;
  listWidth?: number;
  tagPaneHeight?: number;
  themeId?: ThemeId;
  browseMode?: NoteBrowseMode;
  viewMode?: NoteViewMode;
  noteDensity?: NoteDensityMode;
  sortMode?: NoteSortMode;
  tagFilters?: string[];
  recentNoteIds?: string[];
  shortcutNoteIds?: string[];
  homePinnedNoteIds?: string[];
  notebookPinnedNoteIds?: string[];
  savedSearches?: SavedSearch[];
  notebookStacks?: Record<string, string>;
  collapsedStacks?: string[];
}

interface LinkSuggestionState {
  start: number;
  query: string;
  selected: number;
}

interface MentionSuggestionState {
  kind: "tag" | "date";
  start: number;
  end: number;
  query: string;
  selected: number;
}

type EditorMode = "markdown" | "rich";
type NoteViewMode = "cards" | "list";
type NoteDensityMode = "comfortable" | "compact";
type SidebarView = "notes" | "tasks" | "calendar";
type NoteBrowseMode = "all" | "templates" | "shortcuts" | "home";
type ThemeId = "cobalt" | "sky" | "slate";
type AiProvider = "openai" | "anthropic" | "gemini" | "perplexity" | "openai-compatible" | "ollama";
type NoteSortMode =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc";
type SearchFilterKind = "attachments" | "tasks";

interface ParsedSearchQuery {
  text: string;
  tags: string[];
  notebook: string | null;
  afterDate: string | null;
  beforeDate: string | null;
  hasKinds: string[];
}

interface SlashMenuState {
  editor: EditorMode;
  source: "typed" | "insert";
  query: string;
  selected: number;
  markdownRange?: { start: number; end: number };
  richRange?: { from: number; to: number };
}

interface SlashCommand {
  id: string;
  label: string;
  section: string;
  keywords: string[];
}

interface NoteListMenuState {
  x: number;
  y: number;
  kind: "sort" | "filter";
}

interface SavedSearch {
  id: string;
  label: string;
  query: string;
  scope: "everywhere" | "current";
}

interface CommandPaletteAction {
  id: string;
  label: string;
  keywords: string[];
}

interface AiSettings {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  includeActiveNote: boolean;
  includeRelatedNotes: boolean;
  relatedCount: number;
  systemPrompt: string;
}

interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
}

interface AiConnectionState {
  tone: "success" | "error";
  message: string;
}

interface ShellNotesPayload {
  [index: number]: unknown;
  length: number;
}

interface ResizeState {
  kind: "sidebar" | "list";
  startX: number;
  startSidebarWidth: number;
  startListWidth: number;
}

const NOTES_STORAGE_KEY = "pkm-os.desktop.notes.v2";
const PREFS_STORAGE_KEY = "pkm-os.desktop.prefs.v1";
const SEARCH_RECENTS_KEY = "pkm-os.desktop.search-recents.v1";
const SCRATCHPAD_STORAGE_KEY = "pkm-os.desktop.home-scratchpad.v1";
const HISTORY_STORAGE_KEY = "pkm-os.desktop.history.v1";
const CALENDAR_STORAGE_KEY = "pkm-os.desktop.calendar.v1";
const AI_SETTINGS_STORAGE_KEY = "pkm-os.desktop.ai-settings.v1";
const MIN_SIDEBAR_WIDTH = 210;
const MAX_SIDEBAR_WIDTH = 420;
const MIN_LIST_WIDTH = 320;
const MAX_LIST_WIDTH = 960;
const MIN_TAG_PANE_HEIGHT = 12;
const MAX_TAG_PANE_HEIGHT = 420;
const DEFAULT_TAG_PANE_HEIGHT = 52;
const themeIds: ThemeId[] = ["cobalt", "sky", "slate"];
const aiProviders: AiProvider[] = ["openai", "anthropic", "gemini", "perplexity", "openai-compatible", "ollama"];

function clampTagPaneHeight(value: number): number {
  return Math.max(MIN_TAG_PANE_HEIGHT, Math.min(value, MAX_TAG_PANE_HEIGHT));
}

const seedNotes: SeedNote[] = [
  {
    notebook: "Daily Notes",
    fileName: "Agenda.md",
    updatedAt: "2026-02-26T18:00:00.000Z",
    isTemplate: true,
    markdown:
      "# Agenda\n\n## Today priorities\n\n1. Priority 1\n2. Priority 2\n3. Priority 3\n\n## Meetings\n- Link a calendar event\n- Add any relevant tasks\n- Add or create any linked notes"
  },
  {
    notebook: "Daily Notes",
    fileName: "To-do list.md",
    updatedAt: "2026-02-26T17:00:00.000Z",
    isTemplate: true,
    markdown:
      "# To-do list\n\n## High priority\n- Add your most urgent and important tasks here.\n- [ ] Add new task\n\n## Medium priority\n- These tasks are important, but not as time sensitive."
  },
  {
    notebook: "Daily Notes",
    fileName: "Daily Journal.md",
    updatedAt: "2026-02-25T22:00:00.000Z",
    markdown:
      "# Daily Journal\n\nAM fill this section first thing in the morning to set yourself up for success.\n\n## Wins\n- Closed key tasks\n- Did a focused review"
  },
  {
    notebook: "Readwise",
    fileName: "Tweets From Eric Cole.md",
    updatedAt: "2026-02-25T15:00:00.000Z",
    markdown:
      "# Tweets From Eric Cole\n\nhttps://twitter.com/erichustls\n\nIf I wanted to quit my job and use AI to get rich by Summer, here is exactly what I would do."
  },
  {
    notebook: "Readwise",
    fileName: "Tweets From Dickie Bush.md",
    updatedAt: "2026-02-25T14:00:00.000Z",
    markdown:
      "# Tweets From Dickie Bush\n\nWild how this newsletter generates 3k what I made on Wall Street under fluorescent lights."
  },
  {
    notebook: "[aNote] No Folder",
    fileName: "Second test.md",
    updatedAt: "2026-02-24T12:00:00.000Z",
    markdown: "# Second test\n\nUntitled\n\n/"
  },
  {
    notebook: "Recipes",
    fileName: "Simple soup.md",
    updatedAt: "2026-02-23T09:00:00.000Z",
    markdown:
      "# Simple soup\n\n## Ingredients\n- 2 onions\n- 1 carrot\n\n## Steps\n1. Dice vegetables\n2. Simmer"
  }
];

const sidePinned = ["Home", "Shortcuts", "Notes", "Tasks", "Files", "Calendar", "Templates"];
const commandPaletteActions: CommandPaletteAction[] = [
  { id: "new-note", label: "New note", keywords: ["create", "note"] },
  { id: "new-notebook", label: "New notebook", keywords: ["folder", "notebook"] },
  { id: "open-home", label: "Open home", keywords: ["home", "dashboard"] },
  { id: "open-notes", label: "Open notes", keywords: ["notes", "sidebar"] },
  { id: "open-shortcuts", label: "Open shortcuts", keywords: ["shortcuts", "pinned"] },
  { id: "open-tasks", label: "Open tasks", keywords: ["tasks", "todos"] },
  { id: "open-files", label: "Open files", keywords: ["attachments", "files"] },
  { id: "open-calendar", label: "Open calendar", keywords: ["events", "calendar"] },
  { id: "open-ai", label: "Open AI copilot", keywords: ["ai", "copilot", "assistant", "chat"] },
  { id: "open-templates", label: "Open templates", keywords: ["templates"] },
  { id: "toggle-view", label: "Toggle list/card view", keywords: ["view", "cards", "list"] },
  { id: "toggle-density", label: "Toggle note density", keywords: ["density", "compact", "comfortable"] },
  { id: "toggle-editor", label: "Toggle markdown/rich editor", keywords: ["editor", "markdown", "rich"] },
  { id: "cycle-theme", label: "Cycle theme", keywords: ["theme", "color", "palette"] },
  { id: "save-search", label: "Save current search", keywords: ["search", "save"] }
];

const seedCalendarEvents: Array<Pick<CalendarEvent, "title" | "startAt" | "endAt" | "allDay" | "calendar" | "noteId">> =
  [
    {
      title: "Weekly planning",
      startAt: "2026-02-28T15:00:00.000Z",
      endAt: "2026-02-28T16:00:00.000Z",
      allDay: false,
      calendar: "Events",
      noteId: null
    },
    {
      title: "Research block",
      startAt: "2026-03-01T18:30:00.000Z",
      endAt: "2026-03-01T20:00:00.000Z",
      allDay: false,
      calendar: "Deep Work",
      noteId: null
    },
    {
      title: "Template review",
      startAt: "2026-03-02T00:00:00.000Z",
      endAt: "2026-03-02T23:59:00.000Z",
      allDay: true,
      calendar: "Events",
      noteId: null
    }
  ];

const noteMenuRows: Array<{ id: string; label: string; shortcut?: string; divider?: boolean }> = [
  { id: "open-window", label: "Open in new window", shortcut: "cmd+o" },
  { id: "share", label: "Share", shortcut: "cmd+s" },
  { id: "copy-link", label: "Copy link", shortcut: "cmd+l" },
  { id: "rename", label: "Rename", shortcut: "cmd+shift+r" },
  { id: "divider-1", label: "", divider: true },
  { id: "move", label: "Move", shortcut: "cmd+shift+m" },
  { id: "copy-to", label: "Copy to" },
  { id: "duplicate", label: "Duplicate" },
  { id: "edit-tags", label: "Edit tags", shortcut: "cmd+alt+t" },
  { id: "divider-2", label: "", divider: true },
  { id: "add-shortcuts", label: "Add to Shortcuts" },
  { id: "pin-notebook", label: "Pin to Notebook" },
  { id: "pin-home", label: "Pin to Home" },
  { id: "divider-3", label: "", divider: true },
  { id: "find", label: "Find in note", shortcut: "cmd+f" },
  { id: "note-info", label: "Note info", shortcut: "cmd+i" },
  { id: "toggle-template", label: "Set as template" },
  { id: "note-history", label: "Note history" },
  { id: "divider-4", label: "", divider: true },
  { id: "export", label: "Export" },
  { id: "export-pdf", label: "Export as PDF" },
  { id: "print", label: "Print", shortcut: "cmd+p" },
  { id: "divider-5", label: "", divider: true },
  { id: "move-trash", label: "Move to Trash", shortcut: "cmd+backspace" }
];

const slashCommands: SlashCommand[] = [
  { id: "transcribe-media", label: "Transcribe media", section: "New Features", keywords: ["audio", "video"] },
  { id: "new-task", label: "New task", section: "Essentials", keywords: ["todo", "checklist"] },
  { id: "event", label: "Event", section: "Essentials", keywords: ["calendar"] },
  { id: "new-linked-note", label: "New linked note", section: "Essentials", keywords: ["wikilink"] },
  { id: "link-to-note", label: "Link to note", section: "Essentials", keywords: ["wikilink"] },
  { id: "link", label: "Link", section: "Essentials", keywords: ["url"] },
  { id: "table-of-contents", label: "Table of contents", section: "Essentials", keywords: ["toc"] },
  { id: "table", label: "Table", section: "Essentials", keywords: ["grid"] },
  { id: "divider", label: "Divider", section: "Essentials", keywords: ["hr", "line"] },
  { id: "quote", label: "Quote", section: "Text Styles", keywords: ["blockquote"] },
  { id: "heading-1", label: "Large header", section: "Text Styles", keywords: ["h1", "heading"] },
  { id: "heading-2", label: "Medium header", section: "Text Styles", keywords: ["h2", "heading"] },
  { id: "heading-3", label: "Small header", section: "Text Styles", keywords: ["h3", "heading"] },
  { id: "paragraph", label: "Normal text", section: "Text Styles", keywords: ["body", "paragraph"] },
  { id: "bold", label: "Bold", section: "Formatting", keywords: ["strong"] },
  { id: "italic", label: "Italic", section: "Formatting", keywords: ["emphasis"] },
  { id: "underline", label: "Underlined", section: "Formatting", keywords: ["underline"] },
  { id: "strikethrough", label: "Strikethrough", section: "Formatting", keywords: ["strike"] },
  { id: "superscript", label: "Superscript", section: "Formatting", keywords: ["super"] },
  { id: "subscript", label: "Subscript", section: "Formatting", keywords: ["sub"] },
  { id: "bullet-list", label: "Bullet list", section: "Lists", keywords: ["ul", "list"] },
  { id: "checklist", label: "Checklist", section: "Lists", keywords: ["task", "todo"] },
  { id: "numbered-list", label: "Numbered list", section: "Lists", keywords: ["ol", "list"] },
  { id: "checkbox", label: "Checkbox", section: "Lists", keywords: ["task", "check"] },
  { id: "image", label: "Image", section: "Media", keywords: ["photo"] },
  { id: "file", label: "File", section: "Media", keywords: ["attachment"] },
  { id: "video", label: "Video", section: "Media", keywords: ["media"] },
  { id: "audio", label: "Audio", section: "Media", keywords: ["recording"] },
  { id: "code-block", label: "Code Block", section: "Advanced", keywords: ["code", "fence"] },
  { id: "formula", label: "Formula", section: "Advanced", keywords: ["latex", "math"] },
  { id: "current-date", label: "Current date", section: "Utilities", keywords: ["today", "date"] },
  { id: "current-time", label: "Current time", section: "Utilities", keywords: ["time", "clock"] }
];

const editorContextRows: Array<{ id: string; label: string; divider?: boolean }> = [
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "underline", label: "Underline" },
  { id: "strikethrough", label: "Strikethrough" },
  { id: "divider-1", label: "", divider: true },
  { id: "bullet", label: "Bullet list" },
  { id: "checklist", label: "Checklist" },
  { id: "divider-2", label: "", divider: true },
  { id: "link", label: "Insert link" },
  { id: "divider-3", label: "", divider: true },
  { id: "copy-note-link", label: "Copy note link" }
];

const sortModes: Array<{ id: NoteSortMode; label: string }> = [
  { id: "updated-desc", label: "Updated (newest first)" },
  { id: "updated-asc", label: "Updated (oldest first)" },
  { id: "created-desc", label: "Created (newest first)" },
  { id: "created-asc", label: "Created (oldest first)" },
  { id: "title-asc", label: "Title (A-Z)" },
  { id: "title-desc", label: "Title (Z-A)" }
];

function toFileName(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "untitled"}.md`;
}

function clampMenuPosition(x: number, y: number): { x: number; y: number } {
  const maxX = window.innerWidth - 260;
  const maxY = window.innerHeight - 420;
  return { x: Math.max(16, Math.min(x, maxX)), y: Math.max(16, Math.min(y, maxY)) };
}

function clampPaneWidth(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseForPreview(markdown: string): { title: string; body: string[] } {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.startsWith("# ")) {
    return { title: lines[0].slice(2).trim() || "Untitled", body: lines.slice(1) };
  }

  const fallback = lines.find((line) => line.trim())?.trim() || "Untitled";
  return { title: fallback, body: lines };
}

function extractWikilinks(markdown: string): string[] {
  const links = new Set<string>();
  for (const match of markdown.matchAll(/\[\[([^\]]+)\]\]/g)) {
    const value = match[1]?.trim();
    if (value) {
      links.add(value);
    }
  }
  return [...links];
}

function formatRelativeTime(iso: string): string {
  const elapsedMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(elapsedMs / 3600000);
  if (hours < 1) {
    return "Just now";
  }
  if (hours < 24) {
    return `${hours} hr ago`;
  }
  return new Date(iso).toLocaleDateString();
}

function toDateBucketLabel(iso: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(iso);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const elapsedDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (elapsedDays <= 0) {
    return "Today";
  }
  if (elapsedDays === 1) {
    return "Yesterday";
  }
  return targetDate.toLocaleDateString();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDateTimeInput(dateValue: string, timeValue: string): Date | null {
  const [year, month, day] = dateValue.split("-").map((value) => Number.parseInt(value, 10));
  const [hours, minutes] = timeValue.split(":").map((value) => Number.parseInt(value, 10));

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function roundToQuarterHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  const minutes = rounded.getMinutes();
  const offset = 15 - (minutes % 15 || 15);
  rounded.setMinutes(minutes + offset);
  return rounded;
}

function toCalendarDayLabel(iso: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(iso);
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const dayOffset = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (dayOffset === 0) {
    return "Today";
  }
  if (dayOffset === 1) {
    return "Tomorrow";
  }
  if (dayOffset === -1) {
    return "Yesterday";
  }
  return targetDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatCalendarTimeRange(event: CalendarEvent): string {
  if (event.allDay) {
    return "All day";
  }

  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const startLabel = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${startLabel} - ${endLabel}`;
}

function formatCalendarReference(event: CalendarEvent): string {
  return `[[event:${event.id}|${event.title}]]`;
}

function extractEventReferences(markdown: string): Array<{ id: string; title: string }> {
  const references: Array<{ id: string; title: string }> = [];

  for (const match of markdown.matchAll(/\[\[event:([^\]|]+)\|([^\]]+)\]\]/gi)) {
    const id = match[1]?.trim();
    const title = match[2]?.trim() || "Event";
    if (!id) {
      continue;
    }
    references.push({ id, title });
  }

  return references;
}

function extractOpenTasks(notes: AppNote[]): OpenTaskItem[] {
  const tasks: OpenTaskItem[] = [];

  for (const note of notes) {
    const lines = note.markdown.replace(/\r\n/g, "\n").split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const match = line.match(/^\s*-\s\[\s\]\s+(.+)$/);
      if (!match) {
        continue;
      }

      tasks.push({
        id: `${note.id}:${index}`,
        noteId: note.id,
        lineIndex: index,
        noteTitle: note.title,
        notebook: note.notebook,
        text: match[1].trim(),
        updatedAt: note.updatedAt
      });
    }
  }

  return tasks.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function noteHasAttachmentLink(markdown: string): boolean {
  return /\[[^\]]+\]\((\.\/)?attachments\/[^)]+\)|!\[[^\]]*\]\((\.\/)?attachments\/[^)]+\)/i.test(markdown);
}

function noteHasOpenTasks(markdown: string): boolean {
  return /^\s*-\s\[\s\]\s+/m.test(markdown);
}

function noteHasAttachmentKind(markdown: string, kind: string): boolean {
  const normalized = kind.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === "attachment" || normalized === "file") {
    return noteHasAttachmentLink(markdown);
  }
  if (normalized === "task" || normalized === "todo") {
    return noteHasOpenTasks(markdown);
  }
  if (normalized === "image") {
    return /!\[[^\]]*\]\(([^)]+)\)/i.test(markdown);
  }

  const extPattern = normalized.startsWith(".") ? normalized : `.${normalized}`;
  const escaped = extPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\[[^\\]]+\\]\\([^)]*${escaped}(?:$|[?#)])`, "i").test(markdown);
}

function parseSearchQuery(rawQuery: string): ParsedSearchQuery {
  const tokens: ParsedSearchQuery = {
    text: rawQuery,
    tags: [],
    notebook: null,
    afterDate: null,
    beforeDate: null,
    hasKinds: []
  };

  const extracted: string[] = [];
  const tokenPattern = /\b(tag|notebook|folder|after|before|has):(?:"([^"]+)"|(\S+))/gi;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(rawQuery)) !== null) {
    const key = match[1]?.toLowerCase() ?? "";
    const value = (match[2] ?? match[3] ?? "").trim();
    if (!value) {
      continue;
    }

    extracted.push(match[0]);

    if (key === "tag") {
      tokens.tags.push(value.replace(/^#/, "").toLowerCase());
      continue;
    }

    if (key === "notebook" || key === "folder") {
      tokens.notebook = value;
      continue;
    }

    if (key === "after") {
      tokens.afterDate = value;
      continue;
    }

    if (key === "before") {
      tokens.beforeDate = value;
      continue;
    }

    if (key === "has") {
      tokens.hasKinds.push(value.toLowerCase());
    }
  }

  let text = rawQuery;
  for (const token of extracted) {
    text = text.replace(token, " ");
  }
  tokens.text = text.replace(/\s+/g, " ").trim();

  return tokens;
}

function extractAttachments(notes: AppNote[]): AttachmentItem[] {
  const linkPattern = /(!?\[([^\]]*)\])\(([^)]+)\)/g;
  const items: AttachmentItem[] = [];

  for (const note of notes) {
    let match: RegExpExecArray | null;
    while ((match = linkPattern.exec(note.markdown)) !== null) {
      const label = match[2]?.trim() || "Attachment";
      const target = match[3]?.trim() || "";
      if (!target) {
        continue;
      }

      if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) {
        continue;
      }

      const normalized = target.replace(/^<|>$/g, "");
      if (!normalized) {
        continue;
      }

      const looksLikeAttachment =
        /(^|\/)attachments\//i.test(normalized) ||
        /\.(pdf|png|jpe?g|gif|webp|svg|mp4|mov|mp3|wav|m4a|zip|docx?|xlsx?|pptx?)($|[?#])/i.test(normalized);
      if (!looksLikeAttachment) {
        continue;
      }

      items.push({
        id: `${note.id}:${match.index}`,
        noteId: note.id,
        noteTitle: note.title,
        notebook: note.notebook,
        label,
        target: normalized,
        updatedAt: note.updatedAt
      });
    }
  }

  return items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function rewriteHeading(markdown: string, title: string): string {
  if (/^#\s+.*$/m.test(markdown)) {
    return markdown.replace(/^#\s+.*$/m, `# ${title}`);
  }

  const body = markdown.trim() ? `${markdown}\n` : "";
  return `# ${title}\n\n${body}`;
}

function rewriteWikilinks(markdown: string, titleMap: ReadonlyMap<string, string>): string {
  if (!titleMap.size) {
    return markdown;
  }

  return markdown.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, (match, rawTarget: string, suffix?: string) => {
    const target = rawTarget.trim().toLowerCase();
    const renamed = titleMap.get(target);
    if (!renamed) {
      return match;
    }
    return `[[${renamed}${suffix ?? ""}]]`;
  });
}

function noteFromMarkdown(base: AppNote, markdown: string, nowIso?: string): AppNote {
  const parser = new VaultService();
  const parsed = parser.upsertNoteFromMarkdown(base.path, markdown);
  const mergedTags = Array.from(new Set([...(base.tags ?? []), ...parsed.tags])).sort((left, right) =>
    left.localeCompare(right)
  );
  return {
    ...base,
    title: parsed.title,
    snippet: parsed.snippet,
    tags: mergedTags,
    linksOut: parsed.linksOut,
    markdown,
    path: `${base.notebook}/${toFileName(parsed.title)}`,
    updatedAt: nowIso ?? new Date().toISOString()
  };
}

function getSeededNotes(): AppNote[] {
  const service = new VaultService();
  return seedNotes.map((seed) => {
    const note = service.upsertNoteFromMarkdown(`${seed.notebook}/${seed.fileName}`, seed.markdown);
    return {
      ...note,
      createdAt: seed.updatedAt,
      updatedAt: seed.updatedAt,
      notebook: seed.notebook,
      isTemplate: Boolean(seed.isTemplate),
      markdown: seed.markdown
    };
  });
}

function isAppNote(value: unknown): value is AppNote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Partial<AppNote>;
  return (
    typeof note.id === "string" &&
    typeof note.path === "string" &&
    typeof note.title === "string" &&
    typeof note.snippet === "string" &&
    Array.isArray(note.tags) &&
    Array.isArray(note.linksOut) &&
    typeof note.createdAt === "string" &&
    typeof note.updatedAt === "string" &&
    typeof note.notebook === "string" &&
    typeof note.markdown === "string" &&
    (note.isTemplate === undefined || typeof note.isTemplate === "boolean")
  );
}

function loadInitialNotes(): AppNote[] {
  if (typeof window === "undefined") {
    return getSeededNotes();
  }

  try {
    const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!raw) {
      return getSeededNotes();
    }

    const parsed = JSON.parse(raw) as AppNote[];
    if (!Array.isArray(parsed) || !parsed.length) {
      return getSeededNotes();
    }

    return parsed;
  } catch {
    return getSeededNotes();
  }
}

function defaultPrefs(): AppPrefs {
  return {
    selectedNotebook: "Daily Notes",
    activeId: "",
    sidebarWidth: 240,
    listWidth: 520,
    tagPaneHeight: DEFAULT_TAG_PANE_HEIGHT,
    themeId: "cobalt",
    browseMode: "all",
    viewMode: "cards",
    noteDensity: "comfortable",
    sortMode: "updated-desc",
    tagFilters: [],
    recentNoteIds: [],
    shortcutNoteIds: [],
    homePinnedNoteIds: [],
    notebookPinnedNoteIds: [],
    savedSearches: [],
    notebookStacks: {},
    collapsedStacks: []
  };
}

function loadPrefs(): AppPrefs {
  if (typeof window === "undefined") {
    return defaultPrefs();
  }

  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return defaultPrefs();
    }

    const parsed = JSON.parse(raw) as Partial<AppPrefs>;
    return {
      selectedNotebook: parsed.selectedNotebook || "Daily Notes",
      activeId: parsed.activeId || "",
      sidebarWidth:
        typeof parsed.sidebarWidth === "number"
          ? clampPaneWidth(parsed.sidebarWidth, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
          : 240,
      listWidth:
        typeof parsed.listWidth === "number" ? clampPaneWidth(parsed.listWidth, MIN_LIST_WIDTH, MAX_LIST_WIDTH) : 520,
      tagPaneHeight:
        typeof parsed.tagPaneHeight === "number" ? clampTagPaneHeight(parsed.tagPaneHeight) : DEFAULT_TAG_PANE_HEIGHT,
      themeId: themeIds.includes(parsed.themeId as ThemeId) ? (parsed.themeId as ThemeId) : "cobalt",
      browseMode:
        parsed.browseMode === "templates" || parsed.browseMode === "shortcuts" || parsed.browseMode === "home"
          ? parsed.browseMode
          : "all",
      viewMode: parsed.viewMode === "list" ? "list" : "cards",
      noteDensity: parsed.noteDensity === "compact" ? "compact" : "comfortable",
      sortMode: sortModes.some((entry) => entry.id === parsed.sortMode) ? parsed.sortMode : "updated-desc",
      tagFilters: Array.isArray(parsed.tagFilters)
        ? parsed.tagFilters.filter((tag): tag is string => typeof tag === "string")
        : [],
      recentNoteIds: Array.isArray(parsed.recentNoteIds)
        ? parsed.recentNoteIds.filter((noteId): noteId is string => typeof noteId === "string")
        : [],
      shortcutNoteIds: Array.isArray(parsed.shortcutNoteIds)
        ? parsed.shortcutNoteIds.filter((noteId): noteId is string => typeof noteId === "string")
        : [],
      homePinnedNoteIds: Array.isArray(parsed.homePinnedNoteIds)
        ? parsed.homePinnedNoteIds.filter((noteId): noteId is string => typeof noteId === "string")
        : [],
      notebookPinnedNoteIds: Array.isArray(parsed.notebookPinnedNoteIds)
        ? parsed.notebookPinnedNoteIds.filter((noteId): noteId is string => typeof noteId === "string")
        : [],
      savedSearches: Array.isArray(parsed.savedSearches)
        ? parsed.savedSearches.filter(
            (entry): entry is SavedSearch =>
              Boolean(entry) &&
              typeof entry === "object" &&
              typeof (entry as SavedSearch).id === "string" &&
              typeof (entry as SavedSearch).label === "string" &&
              typeof (entry as SavedSearch).query === "string" &&
              ((entry as SavedSearch).scope === "everywhere" || (entry as SavedSearch).scope === "current")
          )
        : [],
      notebookStacks:
        parsed.notebookStacks && typeof parsed.notebookStacks === "object"
          ? Object.fromEntries(
              Object.entries(parsed.notebookStacks).filter(
                (entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string"
              )
            )
          : {},
      collapsedStacks: Array.isArray(parsed.collapsedStacks)
        ? parsed.collapsedStacks.filter((stack): stack is string => typeof stack === "string")
        : []
    };
  } catch {
    return defaultPrefs();
  }
}

function defaultAiSettings(): AiSettings {
  const defaults = aiProviderDefaults("openai");
  return {
    provider: "openai",
    baseUrl: defaults.baseUrl,
    model: defaults.model,
    apiKey: "",
    temperature: 0.2,
    includeActiveNote: true,
    includeRelatedNotes: true,
    relatedCount: 4,
    systemPrompt:
      "You are a note-taking copilot. Be concise and practical. Use note context when relevant and cite note titles in brackets."
  };
}

function aiProviderDefaults(provider: AiProvider): { baseUrl: string; model: string; apiKeyPlaceholder: string } {
  if (provider === "anthropic") {
    return {
      baseUrl: "https://api.anthropic.com",
      model: "claude-3-5-sonnet-latest",
      apiKeyPlaceholder: "sk-ant-..."
    };
  }
  if (provider === "gemini") {
    return {
      baseUrl: "https://generativelanguage.googleapis.com",
      model: "gemini-1.5-pro",
      apiKeyPlaceholder: "AIza..."
    };
  }
  if (provider === "perplexity") {
    return {
      baseUrl: "https://api.perplexity.ai",
      model: "sonar",
      apiKeyPlaceholder: "pplx-..."
    };
  }
  if (provider === "ollama") {
    return {
      baseUrl: "http://localhost:11434",
      model: "llama3.1",
      apiKeyPlaceholder: "(not required)"
    };
  }
  if (provider === "openai-compatible") {
    return {
      baseUrl: "http://localhost:1234/v1",
      model: "local-model",
      apiKeyPlaceholder: "(optional)"
    };
  }
  return {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKeyPlaceholder: "sk-..."
  };
}

function aiProviderLabel(provider: AiProvider): string {
  if (provider === "openai") {
    return "OpenAI";
  }
  if (provider === "anthropic") {
    return "Claude (Anthropic)";
  }
  if (provider === "gemini") {
    return "Gemini (Google)";
  }
  if (provider === "perplexity") {
    return "Perplexity";
  }
  if (provider === "openai-compatible") {
    return "OpenAI-compatible";
  }
  return "Ollama (Local)";
}

function aiProviderHint(provider: AiProvider): string {
  if (provider === "openai") {
    return "OpenAI Chat Completions API.";
  }
  if (provider === "anthropic") {
    return "Anthropic Messages API for Claude.";
  }
  if (provider === "gemini") {
    return "Google Gemini generateContent API.";
  }
  if (provider === "perplexity") {
    return "Perplexity OpenAI-style chat endpoint.";
  }
  if (provider === "openai-compatible") {
    return "Any OpenAI-compatible endpoint (LM Studio, vLLM, OpenRouter, etc).";
  }
  return "Local Ollama server at /api/chat.";
}

function loadAiSettings(): AiSettings {
  if (typeof window === "undefined") {
    return defaultAiSettings();
  }

  try {
    const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaultAiSettings();
    }

    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const defaults = defaultAiSettings();
    const provider = aiProviders.includes(parsed.provider as AiProvider) ? (parsed.provider as AiProvider) : defaults.provider;
    const providerDefaults = aiProviderDefaults(provider);
    return {
      provider,
      baseUrl: typeof parsed.baseUrl === "string" && parsed.baseUrl.trim() ? parsed.baseUrl : providerDefaults.baseUrl,
      model: typeof parsed.model === "string" && parsed.model.trim() ? parsed.model : providerDefaults.model,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : defaults.apiKey,
      temperature:
        typeof parsed.temperature === "number" ? Math.max(0, Math.min(parsed.temperature, 1.5)) : defaults.temperature,
      includeActiveNote:
        typeof parsed.includeActiveNote === "boolean" ? parsed.includeActiveNote : defaults.includeActiveNote,
      includeRelatedNotes:
        typeof parsed.includeRelatedNotes === "boolean" ? parsed.includeRelatedNotes : defaults.includeRelatedNotes,
      relatedCount:
        typeof parsed.relatedCount === "number" ? Math.max(1, Math.min(Math.round(parsed.relatedCount), 8)) : defaults.relatedCount,
      systemPrompt:
        typeof parsed.systemPrompt === "string" && parsed.systemPrompt.trim() ? parsed.systemPrompt : defaults.systemPrompt
    };
  } catch {
    return defaultAiSettings();
  }
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_RECENTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string").slice(0, 8);
  } catch {
    return [];
  }
}

function loadScratchPad(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw = window.localStorage.getItem(SCRATCHPAD_STORAGE_KEY);
    return typeof raw === "string" ? raw : "";
  } catch {
    return "";
  }
}

function loadNoteHistory(): Record<string, NoteHistoryEntry[]> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const entries = Object.entries(parsed as Record<string, unknown>).map(([noteId, snapshots]) => {
      if (!Array.isArray(snapshots)) {
        return [noteId, []] as const;
      }

      const safe = snapshots
        .filter(
          (entry): entry is NoteHistoryEntry =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof (entry as NoteHistoryEntry).at === "string" &&
            typeof (entry as NoteHistoryEntry).title === "string" &&
            typeof (entry as NoteHistoryEntry).markdown === "string"
        )
        .slice(0, 30);

      return [noteId, safe] as const;
    });

    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function getSeededCalendarEvents(): CalendarEvent[] {
  const now = new Date().toISOString();
  return seedCalendarEvents.map((entry) => ({
    id: crypto.randomUUID(),
    title: entry.title,
    startAt: entry.startAt,
    endAt: entry.endAt,
    allDay: entry.allDay,
    calendar: entry.calendar,
    noteId: entry.noteId,
    createdAt: now,
    updatedAt: now
  }));
}

function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const event = value as Partial<CalendarEvent>;
  return (
    typeof event.id === "string" &&
    typeof event.title === "string" &&
    typeof event.startAt === "string" &&
    typeof event.endAt === "string" &&
    typeof event.allDay === "boolean" &&
    typeof event.calendar === "string" &&
    (event.noteId === null || typeof event.noteId === "string") &&
    typeof event.createdAt === "string" &&
    typeof event.updatedAt === "string"
  );
}

function loadCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") {
    return getSeededCalendarEvents();
  }

  try {
    const raw = window.localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (!raw) {
      return getSeededCalendarEvents();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return getSeededCalendarEvents();
    }

    const events = parsed.filter(isCalendarEvent);
    return events.length ? events : getSeededCalendarEvents();
  } catch {
    return getSeededCalendarEvents();
  }
}

export default function App() {
  const initialPrefs = useMemo(() => loadPrefs(), []);
  const initialAiSettings = useMemo(() => loadAiSettings(), []);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() =>
    clampPaneWidth(initialPrefs.sidebarWidth ?? 240, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH)
  );
  const [listWidth, setListWidth] = useState<number>(() =>
    clampPaneWidth(initialPrefs.listWidth ?? 520, MIN_LIST_WIDTH, MAX_LIST_WIDTH)
  );
  const [notes, setNotes] = useState<AppNote[]>(() => loadInitialNotes());
  const [selectedNotebook, setSelectedNotebook] = useState<string>(initialPrefs.selectedNotebook);
  const [activeId, setActiveId] = useState<string>(initialPrefs.activeId);
  const [browseMode, setBrowseMode] = useState<NoteBrowseMode>(initialPrefs.browseMode ?? "all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [noteListMenu, setNoteListMenu] = useState<NoteListMenuState | null>(null);
  const [notebookMenu, setNotebookMenu] = useState<NotebookMenuState | null>(null);
  const [editorContextMenu, setEditorContextMenu] = useState<EditorContextMenuState | null>(null);
  const [moveDialog, setMoveDialog] = useState<MoveDialogState | null>(null);
  const [renameDialog, setRenameDialog] = useState<RenameDialogState | null>(null);
  const [noteRenameDialog, setNoteRenameDialog] = useState<NoteRenameDialogState | null>(null);
  const [noteHistoryDialog, setNoteHistoryDialog] = useState<NoteHistoryDialogState | null>(null);
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [eventDialog, setEventDialog] = useState<EventDialogState | null>(null);
  const [stackDialog, setStackDialog] = useState<StackDialogState | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"everywhere" | "current">("everywhere");
  const [searchFilters, setSearchFilters] = useState<SearchFilterKind[]>([]);
  const [quickQuery, setQuickQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const [searchSelected, setSearchSelected] = useState(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [tagPaneHeight, setTagPaneHeight] = useState<number>(initialPrefs.tagPaneHeight ?? DEFAULT_TAG_PANE_HEIGHT);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [draggingNotebook, setDraggingNotebook] = useState<string | null>(null);
  const [stackDropTarget, setStackDropTarget] = useState<string | null>(null);
  const [attachmentDropTarget, setAttachmentDropTarget] = useState<"markdown" | "rich" | null>(null);
  const [dropNotebook, setDropNotebook] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<LastMoveState | null>(null);
  const [lastTrash, setLastTrash] = useState<LastTrashState | null>(null);
  const [draftMarkdown, setDraftMarkdown] = useState<string>("");
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [sidebarView, setSidebarView] = useState<SidebarView>("notes");
  const [editorMode, setEditorMode] = useState<EditorMode>("markdown");
  const [themeId, setThemeId] = useState<ThemeId>(initialPrefs.themeId ?? "cobalt");
  const [viewMode, setViewMode] = useState<NoteViewMode>(initialPrefs.viewMode ?? "cards");
  const [noteDensity, setNoteDensity] = useState<NoteDensityMode>(initialPrefs.noteDensity ?? "comfortable");
  const [sortMode, setSortMode] = useState<NoteSortMode>(initialPrefs.sortMode ?? "updated-desc");
  const [tagFilters, setTagFilters] = useState<string[]>(initialPrefs.tagFilters ?? []);
  const [recentNoteIds, setRecentNoteIds] = useState<string[]>(initialPrefs.recentNoteIds ?? []);
  const [shortcutNoteIds, setShortcutNoteIds] = useState<string[]>(initialPrefs.shortcutNoteIds ?? []);
  const [homePinnedNoteIds, setHomePinnedNoteIds] = useState<string[]>(initialPrefs.homePinnedNoteIds ?? []);
  const [notebookPinnedNoteIds, setNotebookPinnedNoteIds] = useState<string[]>(
    initialPrefs.notebookPinnedNoteIds ?? []
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(initialPrefs.savedSearches ?? []);
  const [notebookStacks, setNotebookStacks] = useState<Record<string, string>>(initialPrefs.notebookStacks ?? {});
  const [collapsedStacks, setCollapsedStacks] = useState<Set<string>>(
    () => new Set(initialPrefs.collapsedStacks ?? [])
  );
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiShowSettings, setAiShowSettings] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(initialAiSettings);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConnectionBusy, setAiConnectionBusy] = useState(false);
  const [aiModelFetchBusy, setAiModelFetchBusy] = useState(false);
  const [aiConnectionState, setAiConnectionState] = useState<AiConnectionState | null>(null);
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [homeScratchPad, setHomeScratchPad] = useState<string>(() => loadScratchPad());
  const [vaultReady, setVaultReady] = useState(false);
  const [queryNoteHandled, setQueryNoteHandled] = useState(false);
  const [noteHistory, setNoteHistory] = useState<Record<string, NoteHistoryEntry[]>>(() => loadNoteHistory());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => loadCalendarEvents());
  const [vaultMode] = useState<"local" | "desktop">(() =>
    typeof window !== "undefined" && window.pkmShell?.saveVaultState ? "desktop" : "local"
  );
  const [linkSuggestion, setLinkSuggestion] = useState<LinkSuggestionState | null>(null);
  const [mentionSuggestion, setMentionSuggestion] = useState<MentionSuggestionState | null>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);
  const previousNotesRef = useRef<AppNote[] | null>(null);
  const editorMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const markdownEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const richEditorRef = useRef<RichMarkdownEditorHandle | null>(null);
  const editorMainRef = useRef<HTMLDivElement | null>(null);
  const activeResizeRef = useRef<ResizeState | null>(null);

  const notebooks = useMemo(() => {
    const names = Array.from(new Set(notes.map((note) => note.notebook))).sort((left, right) =>
      left.localeCompare(right)
    );
    return ["All Notes", ...names];
  }, [notes]);

  const notebookList = useMemo(() => notebooks.filter((item) => item !== "All Notes"), [notebooks]);

  const stackNames = useMemo(() => {
    return Array.from(new Set(Object.values(notebookStacks).filter((name) => name.trim())))
      .sort((left, right) => left.localeCompare(right));
  }, [notebookStacks]);

  const stackedNotebookGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    const unstacked: string[] = [];

    for (const notebook of notebookList) {
      const stack = notebookStacks[notebook]?.trim();
      if (!stack) {
        unstacked.push(notebook);
        continue;
      }
      const list = groups.get(stack) ?? [];
      list.push(notebook);
      groups.set(stack, list);
    }

    const stacks = Array.from(groups.entries())
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([stack, entries]) => ({ stack, notebooks: entries.sort((a, b) => a.localeCompare(b)) }));

    return { stacks, unstacked: unstacked.sort((a, b) => a.localeCompare(b)) };
  }, [notebookList, notebookStacks]);

  const visibleNotes = useMemo(() => {
    const scoped =
      selectedNotebook === "All Notes"
        ? notes
        : notes.filter((note) => note.notebook === selectedNotebook);

    const modeScoped =
      browseMode === "templates"
        ? scoped.filter((note) => Boolean(note.isTemplate))
        : browseMode === "shortcuts"
          ? (() => {
              const shortcutIds = new Set(shortcutNoteIds);
              return scoped.filter((note) => shortcutIds.has(note.id));
            })()
          : scoped;

    const filtered = tagFilters.length
      ? modeScoped.filter((note) => tagFilters.every((tag) => note.tags.includes(tag)))
      : modeScoped;

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortMode === "updated-desc") {
        return right.updatedAt.localeCompare(left.updatedAt);
      }
      if (sortMode === "updated-asc") {
        return left.updatedAt.localeCompare(right.updatedAt);
      }
      if (sortMode === "created-desc") {
        return right.createdAt.localeCompare(left.createdAt);
      }
      if (sortMode === "created-asc") {
        return left.createdAt.localeCompare(right.createdAt);
      }
      if (sortMode === "title-asc") {
        return left.title.localeCompare(right.title);
      }
      return right.title.localeCompare(left.title);
    });

    return sorted;
  }, [notes, selectedNotebook, browseMode, tagFilters, sortMode, shortcutNoteIds]);

  const availableTags = useMemo(() => {
    const scoped =
      selectedNotebook === "All Notes"
        ? notes
        : notes.filter((note) => note.notebook === selectedNotebook);
    const source =
      browseMode === "templates"
        ? scoped.filter((note) => Boolean(note.isTemplate))
        : browseMode === "shortcuts"
          ? (() => {
              const shortcutIds = new Set(shortcutNoteIds);
              return scoped.filter((note) => shortcutIds.has(note.id));
            })()
          : scoped;
    return Array.from(new Set(source.flatMap((note) => note.tags))).sort((left, right) => left.localeCompare(right));
  }, [notes, selectedNotebook, browseMode, shortcutNoteIds]);

  const recentNotes = useMemo(() => {
    return recentNoteIds
      .map((noteId) => notes.find((note) => note.id === noteId))
      .filter((note): note is AppNote => Boolean(note))
      .slice(0, 8);
  }, [recentNoteIds, notes]);

  const shortcutNotes = useMemo(() => {
    return shortcutNoteIds
      .map((noteId) => notes.find((note) => note.id === noteId))
      .filter((note): note is AppNote => Boolean(note));
  }, [shortcutNoteIds, notes]);

  const homePinnedNotes = useMemo(() => {
    return homePinnedNoteIds
      .map((noteId) => notes.find((note) => note.id === noteId))
      .filter((note): note is AppNote => Boolean(note))
      .slice(0, 16);
  }, [homePinnedNoteIds, notes]);

  const notebookPinnedNotes = useMemo(() => {
    if (selectedNotebook === "All Notes") {
      return [];
    }
    return notebookPinnedNoteIds
      .map((noteId) => notes.find((note) => note.id === noteId))
      .filter((note): note is AppNote => {
        if (!note) {
          return false;
        }
        return note.notebook === selectedNotebook;
      })
      .slice(0, 16);
  }, [notebookPinnedNoteIds, notes, selectedNotebook]);

  const homePinnedSet = useMemo(() => new Set(homePinnedNoteIds), [homePinnedNoteIds]);
  const notebookPinnedSet = useMemo(() => new Set(notebookPinnedNoteIds), [notebookPinnedNoteIds]);
  const shortcutSet = useMemo(() => new Set(shortcutNoteIds), [shortcutNoteIds]);

  const collapsedStacksKey = Array.from(collapsedStacks).sort().join("|");

  const activeNote = notes.find((note) => note.id === activeId) ?? visibleNotes[0] ?? null;
  const noteHistoryNote = noteHistoryDialog ? notes.find((note) => note.id === noteHistoryDialog.noteId) ?? null : null;
  const noteHistoryEntries = noteHistoryDialog ? noteHistory[noteHistoryDialog.noteId] ?? [] : [];

  const draftPreview = useMemo(
    () => parseForPreview(draftMarkdown || activeNote?.markdown || "# Untitled\n"),
    [draftMarkdown, activeNote?.markdown]
  );

  const searchIndex = useMemo(() => {
    const index = new SearchIndex();
    for (const note of notes) {
      index.upsert(note, note.markdown);
    }
    return index;
  }, [notes]);

  const commandMode = quickQuery.trim().startsWith(">");
  const commandQuery = commandMode ? quickQuery.trim().slice(1).trim().toLowerCase() : "";
  const paletteResults = useMemo(() => {
    if (!commandMode) {
      return [];
    }

    if (!commandQuery) {
      return commandPaletteActions;
    }

    return commandPaletteActions.filter((action) => {
      if (action.label.toLowerCase().includes(commandQuery)) {
        return true;
      }
      return action.keywords.some((keyword) => keyword.toLowerCase().includes(commandQuery));
    });
  }, [commandMode, commandQuery]);

  const parsedQuickQuery = useMemo(() => parseSearchQuery(quickQuery), [quickQuery]);

  const quickResults = useMemo(() => {
    if (commandMode) {
      return [];
    }

    const scopedNotes =
      searchScope === "current" && selectedNotebook !== "All Notes"
        ? notes.filter((note) => note.notebook === selectedNotebook)
        : notes;

    const filterAfter = parsedQuickQuery.afterDate ? new Date(`${parsedQuickQuery.afterDate}T00:00:00`) : null;
    const filterBefore = parsedQuickQuery.beforeDate ? new Date(`${parsedQuickQuery.beforeDate}T23:59:59`) : null;
    const notebookFilter = parsedQuickQuery.notebook?.toLowerCase() ?? null;

    const filteredScope = scopedNotes.filter((note) => {
      if (searchFilters.includes("attachments") && !noteHasAttachmentLink(note.markdown)) {
        return false;
      }
      if (searchFilters.includes("tasks") && !noteHasOpenTasks(note.markdown)) {
        return false;
      }
      if (notebookFilter && !note.notebook.toLowerCase().includes(notebookFilter)) {
        return false;
      }
      if (parsedQuickQuery.tags.length && !parsedQuickQuery.tags.every((tag) => note.tags.includes(tag))) {
        return false;
      }
      if (parsedQuickQuery.hasKinds.length && !parsedQuickQuery.hasKinds.every((kind) => noteHasAttachmentKind(note.markdown, kind))) {
        return false;
      }
      if (filterAfter || filterBefore) {
        const updated = new Date(note.updatedAt);
        if (filterAfter && updated < filterAfter) {
          return false;
        }
        if (filterBefore && updated > filterBefore) {
          return false;
        }
      }
      return true;
    });
    const scopedIds = new Set(filteredScope.map((note) => note.id));
    const queryText = parsedQuickQuery.text;

    if (!queryText) {
      return filteredScope
        .slice()
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 8);
    }

    return searchIndex
      .search(queryText)
      .map((result) => notes.find((note) => note.id === result.noteId))
      .filter((note): note is AppNote => {
        if (!note) {
          return false;
        }
        return scopedIds.has(note.id);
      })
      .slice(0, 8);
  }, [notes, commandMode, parsedQuickQuery, searchIndex, searchScope, selectedNotebook, searchFilters]);

  const selectedSearchResult = quickResults[searchSelected] ?? null;
  const selectedPaletteAction = paletteResults[searchSelected] ?? null;
  const quickResultGroups = useMemo(() => {
    const groups: Array<{ label: string; entries: Array<{ note: AppNote; index: number }> }> = [];

    quickResults.forEach((note, index) => {
      const label = toDateBucketLabel(note.updatedAt);
      const existing = groups.find((group) => group.label === label);
      if (existing) {
        existing.entries.push({ note, index });
        return;
      }
      groups.push({ label, entries: [{ note, index }] });
    });

    return groups;
  }, [quickResults]);

  const openTasks = useMemo(() => extractOpenTasks(notes), [notes]);
  const attachmentItems = useMemo(() => extractAttachments(notes), [notes]);
  const calendarEventsById = useMemo(() => new Map(calendarEvents.map((event) => [event.id, event])), [calendarEvents]);
  const calendarGroups = useMemo(() => {
    const sorted = [...calendarEvents].sort((left, right) => left.startAt.localeCompare(right.startAt));
    const groups: Array<{ label: string; events: CalendarEvent[] }> = [];

    for (const event of sorted) {
      const label = toCalendarDayLabel(event.startAt);
      const existing = groups.find((entry) => entry.label === label);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({ label, events: [event] });
      }
    }

    return groups;
  }, [calendarEvents]);
  const homeRecentNotes = useMemo(() => {
    if (recentNotes.length) {
      return recentNotes.slice(0, 6);
    }
    return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 6);
  }, [recentNotes, notes]);
  const upcomingCalendarEvents = useMemo(() => {
    const now = Date.now();
    return [...calendarEvents]
      .filter((event) => new Date(event.endAt).getTime() >= now)
      .sort((left, right) => left.startAt.localeCompare(right.startAt))
      .slice(0, 6);
  }, [calendarEvents]);
  const homeTagSuggestions = useMemo(() => availableTags.slice(0, 16), [availableTags]);
  const eventReferences = useMemo(() => {
    return extractEventReferences(draftMarkdown).map((reference) => ({
      ...reference,
      event: calendarEventsById.get(reference.id) ?? null
    }));
  }, [draftMarkdown, calendarEventsById]);
  const currentAiProviderDefaults = useMemo(() => aiProviderDefaults(aiSettings.provider), [aiSettings.provider]);
  const aiKeyOptional = aiSettings.provider === "ollama" || aiSettings.provider === "openai-compatible";

  const suggestions = useMemo(() => {
    if (!linkSuggestion) {
      return [];
    }

    const lower = linkSuggestion.query.toLowerCase();
    return notes
      .filter((note) => note.id !== activeNote?.id)
      .filter((note) => (lower ? note.title.toLowerCase().includes(lower) : true))
      .slice(0, 8);
  }, [notes, linkSuggestion, activeNote?.id]);

  const mentionResults = useMemo(() => {
    if (!mentionSuggestion) {
      return [];
    }

    if (mentionSuggestion.kind === "tag") {
      const lower = mentionSuggestion.query.toLowerCase();
      return availableTags
        .filter((tag) => (lower ? tag.toLowerCase().includes(lower) : true))
        .slice(0, 8)
        .map((tag) => ({
          id: `tag:${tag}`,
          label: `#${tag}`,
          value: `#${tag}`
        }));
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const entries = [
      { id: "today", label: "@today", value: `@${toDateInputValue(today)}` },
      { id: "tomorrow", label: "@tomorrow", value: `@${toDateInputValue(tomorrow)}` },
      { id: "next-week", label: "@next-week", value: `@${toDateInputValue(nextWeek)}` }
    ];

    const lower = mentionSuggestion.query.toLowerCase();
    return entries.filter((entry) => (lower ? entry.label.toLowerCase().includes(`@${lower}`) : true));
  }, [mentionSuggestion, availableTags]);

  const slashResults = useMemo(() => {
    if (!slashMenu) {
      return [];
    }

    const query = slashMenu.query.trim().toLowerCase();
    if (!query) {
      return slashCommands;
    }

    return slashCommands.filter((command) => {
      if (command.label.toLowerCase().includes(query)) {
        return true;
      }
      return command.keywords.some((keyword) => keyword.toLowerCase().includes(query));
    });
  }, [slashMenu]);

  const slashSections = useMemo(() => {
    const grouped = new Map<string, SlashCommand[]>();
    for (const command of slashResults) {
      const list = grouped.get(command.section) ?? [];
      list.push(command);
      grouped.set(command.section, list);
    }
    return Array.from(grouped.entries());
  }, [slashResults]);

  const outgoingLinks = useMemo(() => {
    if (!activeNote) {
      return [];
    }

    const parsed = extractWikilinks(draftMarkdown);
    return parsed.map((title) => ({
      title,
      target: notes.find((note) => note.title.toLowerCase() === title.toLowerCase()) ?? null
    }));
  }, [activeNote, draftMarkdown, notes]);

  const backlinks = useMemo(() => {
    if (!activeNote) {
      return [];
    }

    const title = activeNote.title.toLowerCase();
    return notes.filter(
      (note) => note.id !== activeNote.id && note.linksOut.some((link) => link.toLowerCase() === title)
    );
  }, [notes, activeNote]);

  const draftWordCount = useMemo(() => {
    const text = draftMarkdown.trim();
    return text ? text.split(/\s+/).length : 0;
  }, [draftMarkdown]);

  const draftCharCount = draftMarkdown.length;

  useEffect(() => {
    let cancelled = false;

    async function hydrateVault() {
      if (typeof window === "undefined" || !window.pkmShell?.loadVaultState) {
        setVaultReady(true);
        return;
      }

      try {
        const payload = (await window.pkmShell.loadVaultState()) as ShellNotesPayload | null;
        if (cancelled || !payload || !Array.isArray(payload)) {
          setVaultReady(true);
          return;
        }

        const hydrated = payload.filter(isAppNote);
        if (hydrated.length > 0) {
          setNotes(hydrated);
        }
      } catch {
        // Fallback to local state when desktop vault load fails.
      } finally {
        if (!cancelled) {
          setVaultReady(true);
        }
      }
    }

    void hydrateVault();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (queryNoteHandled || typeof window === "undefined") {
      return;
    }

    const noteId = new URLSearchParams(window.location.search).get("note");
    if (!noteId) {
      setQueryNoteHandled(true);
      return;
    }

    const note = notes.find((entry) => entry.id === noteId);
    if (!note) {
      if (vaultReady) {
        setQueryNoteHandled(true);
      }
      return;
    }

    setSelectedNotebook(note.notebook);
    setActiveId(note.id);
    setSelectedIds(new Set([note.id]));
    setLastSelectedId(note.id);
    setQueryNoteHandled(true);
  }, [notes, queryNoteHandled, vaultReady]);

  useEffect(() => {
    if (!notebooks.includes(selectedNotebook)) {
      setSelectedNotebook("All Notes");
    }
  }, [notebooks, selectedNotebook]);

  useEffect(() => {
    const knownNotebooks = new Set(notebookList);
    setNotebookStacks((previous) => {
      let changed = false;
      const next: Record<string, string> = {};
      for (const [notebook, stack] of Object.entries(previous)) {
        const cleaned = stack.trim();
        if (!knownNotebooks.has(notebook) || !cleaned) {
          changed = true;
          continue;
        }
        next[notebook] = cleaned;
        if (previous[notebook] !== cleaned) {
          changed = true;
        }
      }
      return changed || Object.keys(next).length !== Object.keys(previous).length ? next : previous;
    });
  }, [notebookList]);

  useEffect(() => {
    const validIds = new Set(notes.map((note) => note.id));
    setRecentNoteIds((previous) => {
      const next = previous.filter((noteId) => validIds.has(noteId));
      return next.length === previous.length ? previous : next;
    });
    setShortcutNoteIds((previous) => {
      const next = previous.filter((noteId) => validIds.has(noteId));
      return next.length === previous.length ? previous : next;
    });
    setHomePinnedNoteIds((previous) => {
      const next = previous.filter((noteId) => validIds.has(noteId));
      return next.length === previous.length ? previous : next;
    });
    setNotebookPinnedNoteIds((previous) => {
      const next = previous.filter((noteId) => validIds.has(noteId));
      return next.length === previous.length ? previous : next;
    });
  }, [notes]);

  useEffect(() => {
    const knownStacks = new Set(stackNames);
    setCollapsedStacks((previous) => {
      let changed = false;
      const next = new Set<string>();
      for (const stack of previous) {
        if (!knownStacks.has(stack)) {
          changed = true;
          continue;
        }
        next.add(stack);
      }
      return changed ? next : previous;
    });
  }, [stackNames]);

  useEffect(() => {
    if (!activeId && visibleNotes[0]) {
      setActiveId(visibleNotes[0].id);
      setSelectedIds(new Set([visibleNotes[0].id]));
      return;
    }

    if (activeId && !notes.some((note) => note.id === activeId)) {
      setActiveId(visibleNotes[0]?.id ?? "");
      setSelectedIds(visibleNotes[0] ? new Set([visibleNotes[0].id]) : new Set());
      return;
    }

    if (activeId && visibleNotes.length > 0 && !visibleNotes.some((note) => note.id === activeId)) {
      setActiveId(visibleNotes[0].id);
      setSelectedIds(new Set([visibleNotes[0].id]));
    }
  }, [activeId, notes, visibleNotes]);

  useEffect(() => {
    if (!activeNote) {
      setDraftMarkdown("");
      setSaveState("saved");
      setTagEditorOpen(false);
      setTagInput("");
      setMentionSuggestion(null);
      return;
    }

    setDraftMarkdown(activeNote.markdown);
    setSaveState("saved");
    setTagEditorOpen(false);
    setTagInput("");
    setMentionSuggestion(null);
  }, [activeNote?.id]);

  useEffect(() => {
    if (editorMode === "rich" && linkSuggestion) {
      setLinkSuggestion(null);
    }
    if (editorMode === "rich" && mentionSuggestion) {
      setMentionSuggestion(null);
    }
  }, [editorMode, linkSuggestion, mentionSuggestion]);

  useEffect(() => {
    if (!slashMenu) {
      return;
    }
    if (slashMenu.editor !== editorMode && slashMenu.source === "typed") {
      setSlashMenu(null);
    }
  }, [editorMode, slashMenu]);

  useEffect(() => {
    if (!activeNote) {
      return;
    }

    if (draftMarkdown === activeNote.markdown) {
      return;
    }

    setSaveState("dirty");

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      setSaveState("saving");
      setNotes((previous) =>
        previous.map((note) => (note.id === activeNote.id ? noteFromMarkdown(note, draftMarkdown) : note))
      );
      setSaveState("saved");
      touchRecent(activeNote.id);
      autosaveTimerRef.current = null;
    }, 650);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draftMarkdown, activeNote?.id, activeNote?.markdown]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));

    if (!vaultReady || !window.pkmShell?.saveVaultState) {
      return;
    }

    void window.pkmShell.saveVaultState(notes);
  }, [notes, vaultReady]);

  useEffect(() => {
    const previous = previousNotesRef.current;
    if (!previous) {
      previousNotesRef.current = notes;
      return;
    }

    const previousById = new Map(previous.map((note) => [note.id, note]));
    const updates: Array<{ noteId: string; snapshot: NoteHistoryEntry }> = [];

    for (const note of notes) {
      const prior = previousById.get(note.id);
      if (!prior) {
        continue;
      }
      if (prior.markdown === note.markdown) {
        continue;
      }
      updates.push({
        noteId: note.id,
        snapshot: {
          at: new Date().toISOString(),
          title: prior.title,
          markdown: prior.markdown
        }
      });
    }

    if (updates.length) {
      setNoteHistory((previousHistory) => {
        const nextHistory = { ...previousHistory };
        for (const { noteId, snapshot } of updates) {
          const existing = nextHistory[noteId] ?? [];
          if (existing[0]?.markdown === snapshot.markdown) {
            continue;
          }
          nextHistory[noteId] = [snapshot, ...existing].slice(0, 30);
        }
        return nextHistory;
      });
    }

    previousNotesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    const validIds = new Set(notes.map((note) => note.id));
    setNoteHistory((previous) => {
      let changed = false;
      const next: Record<string, NoteHistoryEntry[]> = {};
      for (const [noteId, snapshots] of Object.entries(previous)) {
        if (!validIds.has(noteId)) {
          changed = true;
          continue;
        }
        next[noteId] = snapshots;
      }
      return changed ? next : previous;
    });
  }, [notes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(noteHistory));
  }, [noteHistory]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SCRATCHPAD_STORAGE_KEY, homeScratchPad);
  }, [homeScratchPad]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.dataset.theme = themeId;
  }, [themeId]);

  useEffect(() => {
    const validNoteIds = new Set(notes.map((note) => note.id));
    setCalendarEvents((previous) => {
      let changed = false;
      const next = previous.map((event) => {
        if (event.noteId && !validNoteIds.has(event.noteId)) {
          changed = true;
          return {
            ...event,
            noteId: null,
            updatedAt: new Date().toISOString()
          };
        }
        return event;
      });
      return changed ? next : previous;
    });
  }, [notes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const prefs: AppPrefs = {
      selectedNotebook,
      activeId,
      sidebarWidth,
      listWidth,
      tagPaneHeight,
      themeId,
      browseMode,
      viewMode,
      noteDensity,
      sortMode,
      tagFilters,
      recentNoteIds,
      shortcutNoteIds,
      homePinnedNoteIds,
      notebookPinnedNoteIds,
      savedSearches,
      notebookStacks,
      collapsedStacks: Array.from(collapsedStacks)
    };
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  }, [
    selectedNotebook,
    activeId,
    sidebarWidth,
    listWidth,
    tagPaneHeight,
    themeId,
    browseMode,
    viewMode,
    noteDensity,
    sortMode,
    tagFilters,
    recentNoteIds,
    shortcutNoteIds,
    homePinnedNoteIds,
    notebookPinnedNoteIds,
    savedSearches,
    notebookStacks,
    collapsedStacksKey
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (slashMenu?.editor === "rich") {
        if (event.key === "Escape") {
          event.preventDefault();
          setSlashMenu(null);
          return;
        }

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setSlashMenu((previous) => {
            if (!previous) {
              return previous;
            }
            const max = Math.max(0, slashResults.length - 1);
            return { ...previous, selected: Math.min(previous.selected + 1, max) };
          });
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setSlashMenu((previous) =>
            previous ? { ...previous, selected: Math.max(previous.selected - 1, 0) } : previous
          );
          return;
        }

        if (event.key === "Tab" || event.key === "Enter") {
          event.preventDefault();
          commitSlashCommand(slashMenu.selected);
          return;
        }
      }

      if (!searchOpen && activeNote && (event.metaKey || event.ctrlKey)) {
        const key = event.key.toLowerCase();
        if (key === "b") {
          event.preventDefault();
          if (editorMode === "rich") {
            richEditorRef.current?.toggleBold();
          } else {
            applyMarkdownInlineFormat("**", "**", "bold text");
          }
          return;
        }

        if (key === "i") {
          event.preventDefault();
          if (editorMode === "rich") {
            richEditorRef.current?.toggleItalic();
          } else {
            applyMarkdownInlineFormat("*", "*", "italic text");
          }
          return;
        }

        if (key === "u") {
          event.preventDefault();
          if (editorMode === "rich") {
            richEditorRef.current?.toggleUnderline();
          } else {
            applyMarkdownInlineFormat("<u>", "</u>", "underlined text");
          }
          return;
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommandPalette();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && ["k", "p"].includes(event.key.toLowerCase())) {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        flushActiveDraft();
        return;
      }

      if (event.key === "Escape") {
        activeResizeRef.current = null;
        document.body.classList.remove("is-resizing");
        setContextMenu(null);
        setNoteListMenu(null);
        setNotebookMenu(null);
        setEditorContextMenu(null);
        setDraggingNotebook(null);
        setStackDropTarget(null);
        setStackDialog(null);
        setNoteHistoryDialog(null);
        setTasksDialogOpen(false);
        setFilesDialogOpen(false);
        setCalendarDialogOpen(false);
        setEventDialog(null);
        setAttachmentDropTarget(null);
        setSidebarView("notes");
        setSearchOpen(false);
        setSlashMenu(null);
        setMentionSuggestion(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draftMarkdown, activeNote?.id, activeNote?.markdown, slashMenu, slashResults, searchOpen, editorMode]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SEARCH_RECENTS_KEY, JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }
    setSearchSelected(0);
  }, [searchOpen, quickQuery, searchScope, searchFilters]);

  useEffect(() => {
    const length = commandMode ? paletteResults.length : quickResults.length;
    if (searchSelected < length) {
      return;
    }
    setSearchSelected(Math.max(0, length - 1));
  }, [searchSelected, quickResults.length, commandMode, paletteResults.length]);

  useEffect(() => {
    if (!slashMenu) {
      return;
    }

    if (!slashResults.length) {
      if (slashMenu.selected !== 0) {
        setSlashMenu((previous) => (previous ? { ...previous, selected: 0 } : previous));
      }
      return;
    }

    if (slashMenu.selected >= slashResults.length) {
      setSlashMenu((previous) =>
        previous ? { ...previous, selected: Math.max(0, slashResults.length - 1) } : previous
      );
    }
  }, [slashMenu, slashResults]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const activeResize = activeResizeRef.current;
      if (activeResize) {
        const delta = event.clientX - activeResize.startX;
        if (activeResize.kind === "sidebar") {
          const nextSidebar = clampPaneWidth(
            activeResize.startSidebarWidth + delta,
            MIN_SIDEBAR_WIDTH,
            MAX_SIDEBAR_WIDTH
          );
          setSidebarWidth(nextSidebar);
        } else {
          const nextList = clampPaneWidth(activeResize.startListWidth + delta, MIN_LIST_WIDTH, MAX_LIST_WIDTH);
          setListWidth(nextList);
        }
      }
    };

    const handleMouseUp = () => {
      if (!activeResizeRef.current) {
        return;
      }
      activeResizeRef.current = null;
      document.body.classList.remove("is-resizing");
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handleWindowResize = () => {
      setSidebarWidth((previous) => clampPaneWidth(previous, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH));
      setListWidth((previous) => clampPaneWidth(previous, MIN_LIST_WIDTH, MAX_LIST_WIDTH));
      setTagPaneHeight((previous) => clampTagPaneHeight(previous));
    };

    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  function startPaneResize(kind: "sidebar" | "list", startX: number): void {
    activeResizeRef.current = {
      kind,
      startX,
      startSidebarWidth: sidebarWidth,
      startListWidth: listWidth
    };
    document.body.classList.add("is-resizing");
  }

  function nudgePaneWidth(kind: "sidebar" | "list", direction: "decrease" | "increase"): void {
    const delta = direction === "increase" ? 16 : -16;
    if (kind === "sidebar") {
      setSidebarWidth((previous) => clampPaneWidth(previous + delta, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH));
      return;
    }
    setListWidth((previous) => clampPaneWidth(previous + delta, MIN_LIST_WIDTH, MAX_LIST_WIDTH));
  }

  function nudgeTagPaneHeight(direction: "decrease" | "increase"): void {
    const delta = direction === "increase" ? 12 : -12;
    setTagPaneHeight((previous) => clampTagPaneHeight(previous + delta));
  }

  function startTagPanePointerResize(event: React.PointerEvent<HTMLButtonElement>): void {
    event.preventDefault();
    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const startY = event.clientY;
    const startHeight = tagPaneHeight;
    document.body.classList.add("is-resizing");
    target.setPointerCapture(pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      setTagPaneHeight(clampTagPaneHeight(startHeight - delta));
    };

    const stop = () => {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", stop);
      target.removeEventListener("pointercancel", stop);
      document.body.classList.remove("is-resizing");
    };

    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", stop);
    target.addEventListener("pointercancel", stop);
  }

  function cycleTheme(): void {
    setThemeId((previous) => {
      const index = themeIds.indexOf(previous);
      const next = themeIds[(index + 1) % themeIds.length];
      setToastMessage(`Theme switched to ${next}`);
      return next;
    });
  }

  function toggleAiPanel(): void {
    setAiPanelOpen((previous) => {
      const next = !previous;
      if (next) {
        setMetadataOpen(false);
      }
      return next;
    });
  }

  function applyAiProvider(provider: AiProvider): void {
    const defaults = aiProviderDefaults(provider);
    setAiSettings((previous) => ({
      ...previous,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
      apiKey: provider === "ollama" ? "" : previous.apiKey
    }));
    setAiModels([]);
    setAiConnectionState(null);
  }

  function clearAiChat(): void {
    setAiMessages([]);
    setAiError(null);
  }

  async function testAiConnection(): Promise<void> {
    if (aiBusy || aiConnectionBusy || aiModelFetchBusy) {
      return;
    }

    try {
      setAiConnectionBusy(true);
      setAiConnectionState(null);
      if (!window.pkmShell?.testLlmConnection) {
        throw new Error("Connection test is unavailable in this build.");
      }

      const result = await window.pkmShell.testLlmConnection({
        provider: aiSettings.provider,
        baseUrl: aiSettings.baseUrl,
        apiKey: aiSettings.apiKey
      });

      const error = result?.error?.trim();
      if (!result?.ok) {
        throw new Error(error || "Connection test failed");
      }

      setAiConnectionState({
        tone: "success",
        message: result?.detail?.trim() || "Connected"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      setAiConnectionState({
        tone: "error",
        message
      });
    } finally {
      setAiConnectionBusy(false);
    }
  }

  async function fetchAiModels(): Promise<void> {
    if (aiBusy || aiConnectionBusy || aiModelFetchBusy) {
      return;
    }

    try {
      setAiModelFetchBusy(true);
      setAiConnectionState(null);
      if (!window.pkmShell?.listLlmModels) {
        throw new Error("Model discovery is unavailable in this build.");
      }

      const result = await window.pkmShell.listLlmModels({
        provider: aiSettings.provider,
        baseUrl: aiSettings.baseUrl,
        apiKey: aiSettings.apiKey
      });

      const error = result?.error?.trim();
      if (error) {
        throw new Error(error);
      }

      const models = Array.isArray(result?.models)
        ? result.models.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        : [];

      setAiModels(models);
      if (models.length && !models.includes(aiSettings.model)) {
        setAiSettings((previous) => ({
          ...previous,
          model: models[0]
        }));
      }
      setAiConnectionState({
        tone: "success",
        message: models.length ? `Loaded ${models.length} models` : "Connected, but no models were returned"
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Model discovery failed";
      setAiModels([]);
      setAiConnectionState({
        tone: "error",
        message
      });
    } finally {
      setAiModelFetchBusy(false);
    }
  }

  function buildAiContext(question: string): string {
    const sections: string[] = [];

    if (aiSettings.includeActiveNote && activeNote) {
      const truncated = activeNote.markdown.slice(0, 12000);
      sections.push(
        `Active note:\nTitle: ${activeNote.title}\nNotebook: ${activeNote.notebook}\nPath: ${activeNote.path}\nContent:\n${truncated}`
      );
    }

    if (aiSettings.includeRelatedNotes) {
      const related = searchIndex
        .search(question)
        .map((result) => notes.find((note) => note.id === result.noteId))
        .filter((note): note is AppNote => Boolean(note))
        .filter((note) => note.id !== activeNote?.id)
        .slice(0, aiSettings.relatedCount);

      if (related.length) {
        const parts = related.map((note, index) => {
          const content = note.markdown.slice(0, 2600);
          return `${index + 1}. ${note.title} (${note.notebook})\n${content}`;
        });
        sections.push(`Related notes:\n${parts.join("\n\n")}`);
      }
    }

    return sections.join("\n\n---\n\n");
  }

  async function submitAiPrompt(): Promise<void> {
    const prompt = aiInput.trim();
    if (!prompt || aiBusy) {
      return;
    }

    const userMessage: AiChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt,
      at: new Date().toISOString()
    };

    setAiMessages((previous) => [...previous, userMessage]);
    setAiInput("");
    setAiBusy(true);
    setAiError(null);

    const context = buildAiContext(prompt);
    const history = [...aiMessages, userMessage]
      .slice(-10)
      .map((entry) => ({ role: entry.role as "user" | "assistant", content: entry.content }));

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: aiSettings.systemPrompt
      }
    ];
    if (context) {
      messages.push({
        role: "system",
        content: `Vault context (use only if relevant):\n${context}`
      });
    }
    messages.push(...history);

    try {
      if (!window.pkmShell?.chatWithLlm) {
        throw new Error("LLM bridge is unavailable in this build.");
      }

      const result = await window.pkmShell.chatWithLlm({
        provider: aiSettings.provider,
        baseUrl: aiSettings.baseUrl,
        apiKey: aiSettings.apiKey,
        model: aiSettings.model,
        temperature: aiSettings.temperature,
        messages
      });

      const content = result?.message?.trim();
      const error = result?.error?.trim();
      if (!content) {
        throw new Error(error || "No response returned by provider.");
      }

      const assistantMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        at: new Date().toISOString()
      };
      setAiMessages((previous) => [...previous, assistantMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "LLM request failed";
      setAiError(message);
      const assistantMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${message}`,
        at: new Date().toISOString()
      };
      setAiMessages((previous) => [...previous, assistantMessage]);
    } finally {
      setAiBusy(false);
    }
  }

  function flushActiveDraft(): void {
    if (!activeNote || draftMarkdown === activeNote.markdown) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    setNotes((previous) =>
      previous.map((note) => (note.id === activeNote.id ? noteFromMarkdown(note, draftMarkdown) : note))
    );
    setSaveState("saved");
    touchRecent(activeNote.id);
  }

  function touchRecent(noteId: string): void {
    setRecentNoteIds((previous) => [noteId, ...previous.filter((entry) => entry !== noteId)].slice(0, 24));
  }

  function syncSlashSuggestion(markdown: string, caret: number): void {
    const head = markdown.slice(0, caret);
    const match = head.match(/(?:^|\s)\/([a-z0-9-]*)$/i);

    if (!match) {
      setSlashMenu((previous) => {
        if (previous?.editor === "markdown" && previous.source === "typed") {
          return null;
        }
        return previous;
      });
      return;
    }

    const token = match[0];
    const leadingSpace = token.startsWith(" ") ? 1 : 0;
    const start = caret - token.length + leadingSpace;

    setSlashMenu((previous) => ({
      editor: "markdown",
      source: "typed",
      query: match[1] ?? "",
      selected: previous?.editor === "markdown" && previous.source === "typed" ? previous.selected : 0,
      markdownRange: { start, end: caret }
    }));
    setLinkSuggestion(null);
    setMentionSuggestion(null);
  }

  function syncRichSlashSuggestion(state: { query: string; from: number; to: number } | null): void {
    setSlashMenu((previous) => {
      if (previous?.editor === "rich" && previous.source === "insert") {
        return previous;
      }

      if (!state) {
        if (previous?.editor === "rich" && previous.source === "typed") {
          return null;
        }
        return previous;
      }

      return {
        editor: "rich",
        source: "typed",
        query: state.query,
        selected: previous?.editor === "rich" && previous.source === "typed" ? previous.selected : 0,
        richRange: { from: state.from, to: state.to }
      };
    });
  }

  function syncLinkSuggestion(markdown: string, caret: number): void {
    const head = markdown.slice(0, caret);
    const match = head.match(/\[\[([^\]\n]*)$/);
    if (!match) {
      setLinkSuggestion(null);
      return;
    }

    const start = caret - match[0].length;
    const query = match[1];
    setLinkSuggestion((previous) => ({
      start,
      query,
      selected: previous ? Math.min(previous.selected, suggestions.length) : 0
    }));
    setMentionSuggestion(null);
  }

  function syncMentionSuggestion(markdown: string, caret: number): void {
    const head = markdown.slice(0, caret);
    if (/\[\[[^\]\n]*$/.test(head)) {
      setMentionSuggestion(null);
      return;
    }
    const tagMatch = head.match(/(?:^|\s)#([a-z0-9/_-]*)$/i);
    if (tagMatch) {
      const token = tagMatch[0];
      const leadingSpace = token.startsWith(" ") ? 1 : 0;
      const start = caret - token.length + leadingSpace;
      setMentionSuggestion((previous) => ({
        kind: "tag",
        start,
        end: caret,
        query: tagMatch[1] ?? "",
        selected:
          previous && previous.kind === "tag" ? Math.min(previous.selected, Math.max(0, mentionResults.length - 1)) : 0
      }));
      return;
    }

    const dateMatch = head.match(/(?:^|\s)@([a-z0-9-]*)$/i);
    if (dateMatch) {
      const token = dateMatch[0];
      const leadingSpace = token.startsWith(" ") ? 1 : 0;
      const start = caret - token.length + leadingSpace;
      setMentionSuggestion((previous) => ({
        kind: "date",
        start,
        end: caret,
        query: dateMatch[1] ?? "",
        selected:
          previous && previous.kind === "date"
            ? Math.min(previous.selected, Math.max(0, mentionResults.length - 1))
            : 0
      }));
      return;
    }

    setMentionSuggestion(null);
  }

  function commitMentionSuggestion(index: number): void {
    const editor = markdownEditorRef.current;
    if (!editor || !mentionSuggestion) {
      return;
    }

    const picked = mentionResults[index];
    const fallbackQuery = mentionSuggestion.query.trim().replace(/^[@#]/, "");
    const replacement =
      picked?.value ??
      (mentionSuggestion.kind === "tag" ? `#${fallbackQuery}` : fallbackQuery ? `@${fallbackQuery}` : "");

    if (!replacement) {
      setMentionSuggestion(null);
      return;
    }

    const next = `${draftMarkdown.slice(0, mentionSuggestion.start)}${replacement}${draftMarkdown.slice(mentionSuggestion.end)}`;
    setDraftMarkdown(next);
    setMentionSuggestion(null);

    window.requestAnimationFrame(() => {
      const position = mentionSuggestion.start + replacement.length;
      editor.focus();
      editor.setSelectionRange(position, position);
    });
  }

  function openSlashMenuFromInsert(): void {
    setMentionSuggestion(null);
    if (editorMode === "markdown") {
      const editor = markdownEditorRef.current;
      const position = editor?.selectionStart ?? draftMarkdown.length;
      setSlashMenu({
        editor: "markdown",
        source: "insert",
        query: "",
        selected: 0,
        markdownRange: { start: position, end: position }
      });
      editor?.focus();
      return;
    }

    setSlashMenu({
      editor: "rich",
      source: "insert",
      query: "",
      selected: 0
    });
    richEditorRef.current?.focus();
  }

  function resolveDefaultNotebook(): string {
    if (selectedNotebook !== "All Notes") {
      return selectedNotebook;
    }
    if (notebooks.includes("Daily Notes")) {
      return "Daily Notes";
    }
    if (notebooks.includes("Inbox")) {
      return "Inbox";
    }
    return notebooks[1] || "Inbox";
  }

  function ensureLinkedNote(title: string): AppNote {
    const existing = notes.find((note) => note.title.toLowerCase() === title.toLowerCase());
    if (existing) {
      return existing;
    }

    const notebook = resolveDefaultNotebook();
    const now = new Date().toISOString();
    const markdown = `# ${title}\n\n`;
    const created: AppNote = {
      id: crypto.randomUUID(),
      title,
      snippet: "",
      tags: [],
      linksOut: [],
      createdAt: now,
      updatedAt: now,
      notebook,
      path: `${notebook}/${toFileName(title)}`,
      markdown
    };

    const hydrated = noteFromMarkdown(created, markdown, now);
    setNotes((previous) => [hydrated, ...previous]);
    return hydrated;
  }

  function insertWikilink(title: string): void {
    const editor = markdownEditorRef.current;
    if (!editor || !linkSuggestion) {
      return;
    }

    const caret = editor.selectionStart;
    const before = draftMarkdown.slice(0, linkSuggestion.start);
    const after = draftMarkdown.slice(caret);
    const insert = `[[${title}]]`;
    const next = `${before}${insert}${after}`;
    setDraftMarkdown(next);
    setLinkSuggestion(null);

    window.requestAnimationFrame(() => {
      const position = before.length + insert.length;
      editor.focus();
      editor.setSelectionRange(position, position);
    });
  }

  function commitLinkSuggestion(index: number): void {
    if (!linkSuggestion) {
      return;
    }

    const picked = suggestions[index];
    if (picked) {
      insertWikilink(picked.title);
      return;
    }

    const fallbackTitle = linkSuggestion.query.trim();
    if (!fallbackTitle) {
      setLinkSuggestion(null);
      return;
    }

    const created = ensureLinkedNote(fallbackTitle);
    insertWikilink(created.title);
  }

  function focusNote(noteId: string): void {
    flushActiveDraft();
    const target = notes.find((note) => note.id === noteId);
    if (browseMode === "templates" && target && !target.isTemplate) {
      setBrowseMode("all");
    }
    if (browseMode === "shortcuts" && target && !shortcutSet.has(target.id)) {
      setBrowseMode("all");
    }
    setActiveId(noteId);
    setSelectedIds(new Set([noteId]));
    setLastSelectedId(noteId);
    touchRecent(noteId);
    setLinkSuggestion(null);
    setMentionSuggestion(null);
    setSlashMenu(null);
  }

  function onCardClick(noteId: string, event: React.MouseEvent<HTMLButtonElement>): void {
    const isToggle = event.metaKey || event.ctrlKey;
    const isRange = event.shiftKey && lastSelectedId;

    if (isRange && lastSelectedId) {
      const ids = visibleNotes.map((note) => note.id);
      const start = ids.indexOf(lastSelectedId);
      const end = ids.indexOf(noteId);
      if (start >= 0 && end >= 0) {
        const low = Math.min(start, end);
        const high = Math.max(start, end);
        const range = ids.slice(low, high + 1);
        setSelectedIds(new Set(range));
      }
      setActiveId(noteId);
      return;
    }

    if (isToggle) {
      setSelectedIds((previous) => {
        const next = new Set(previous);
        if (next.has(noteId)) {
          next.delete(noteId);
        } else {
          next.add(noteId);
        }
        return next;
      });
      setActiveId(noteId);
      setLastSelectedId(noteId);
      return;
    }

    focusNote(noteId);
  }

  function rememberSearchQuery(query: string): void {
    const value = query.trim();
    if (!value) {
      return;
    }
    setRecentSearches((previous) => [value, ...previous.filter((entry) => entry !== value)].slice(0, 8));
  }

  function saveCurrentSearch(): void {
    const query = quickQuery.trim();
    if (!query) {
      setToastMessage("Enter a query to save");
      return;
    }

    const defaultLabel = query.length > 28 ? `${query.slice(0, 28)}...` : query;
    const input = window.prompt("Saved search name", defaultLabel);
    const label = input?.trim();
    if (!label) {
      return;
    }

    setSavedSearches((previous) => {
      const existing = previous.find(
        (entry) => entry.query === query && entry.scope === searchScope && entry.label.toLowerCase() === label.toLowerCase()
      );
      if (existing) {
        return previous;
      }

      return [
        {
          id: crypto.randomUUID(),
          label,
          query,
          scope: searchScope
        },
        ...previous
      ].slice(0, 40);
    });
    setToastMessage(`Saved search "${label}"`);
  }

  function openSavedSearch(saved: SavedSearch): void {
    setBrowseMode("all");
    setSearchScope(saved.scope);
    setQuickQuery(saved.query);
    setSearchOpen(true);
  }

  function removeSavedSearch(id: string): void {
    setSavedSearches((previous) => previous.filter((entry) => entry.id !== id));
  }

  function editSavedSearch(id: string): void {
    const existing = savedSearches.find((entry) => entry.id === id);
    if (!existing) {
      return;
    }

    const labelInput = window.prompt("Saved search name", existing.label);
    const label = labelInput?.trim();
    if (!label) {
      return;
    }

    const queryInput = window.prompt("Search query", existing.query);
    const query = queryInput?.trim();
    if (!query) {
      return;
    }

    const scopeInput = window.prompt('Scope: "everywhere" or "current"', existing.scope);
    const scope = scopeInput?.trim().toLowerCase() === "current" ? "current" : "everywhere";

    setSavedSearches((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, label, query, scope } : entry))
    );
    setToastMessage(`Saved search "${label}" updated`);
  }

  function completeOpenTask(task: OpenTaskItem): void {
    flushActiveDraft();

    let nextActiveMarkdown: string | null = null;

    setNotes((previous) =>
      previous.map((note) => {
        if (note.id !== task.noteId) {
          return note;
        }

        const lines = note.markdown.replace(/\r\n/g, "\n").split("\n");
        const target = lines[task.lineIndex];
        if (!target || !/^\s*-\s\[\s\]\s+/.test(target)) {
          return note;
        }

        lines[task.lineIndex] = target.replace(/^(\s*-\s)\[\s\](\s+)/, "$1[x]$2");
        const nextMarkdown = lines.join("\n");
        if (activeId === note.id) {
          nextActiveMarkdown = nextMarkdown;
        }
        return noteFromMarkdown(note, nextMarkdown, new Date().toISOString());
      })
    );

    if (nextActiveMarkdown !== null) {
      setDraftMarkdown(nextActiveMarkdown);
    }

    setToastMessage("Task completed");
  }

  function openCreateEventDialog(options?: { linkedNoteId?: string | null; origin?: EventInsertOrigin | null }): void {
    const start = roundToQuarterHour(new Date());
    const end = new Date(start.getTime() + 60 * 60000);

    setEventDialog({
      mode: "create",
      eventId: null,
      title: "",
      startDate: toDateInputValue(start),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(end),
      endTime: toTimeInputValue(end),
      allDay: false,
      calendar: "Events",
      linkedNoteId: options?.linkedNoteId ?? null,
      origin: options?.origin ?? null
    });
  }

  function openEditEventDialog(eventId: string): void {
    const event = calendarEventsById.get(eventId);
    if (!event) {
      return;
    }

    const start = new Date(event.startAt);
    const end = new Date(event.endAt);

    setEventDialog({
      mode: "edit",
      eventId: event.id,
      title: event.title,
      startDate: toDateInputValue(start),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(end),
      endTime: toTimeInputValue(end),
      allDay: event.allDay,
      calendar: event.calendar,
      linkedNoteId: event.noteId,
      origin: null
    });
  }

  function closeEventDialog(): void {
    setEventDialog(null);
  }

  function insertEventReferenceFromDialog(event: CalendarEvent, origin: EventInsertOrigin | null): void {
    if (!origin) {
      return;
    }

    const content = `- [ ] Calendar event: ${formatCalendarReference(event)}\n`;

    if (origin.editor === "rich") {
      if (origin.richRange) {
        richEditorRef.current?.replaceRange(origin.richRange.from, origin.richRange.to, "");
      }
      richEditorRef.current?.insertContent(content.trimEnd());
      window.requestAnimationFrame(() => richEditorRef.current?.focus());
      return;
    }

    const range = origin.markdownRange;
    const start = range?.start ?? (markdownEditorRef.current?.selectionStart ?? draftMarkdown.length);
    const end = range?.end ?? (markdownEditorRef.current?.selectionEnd ?? start);
    const next = `${draftMarkdown.slice(0, start)}${content}${draftMarkdown.slice(end)}`;
    setDraftMarkdown(next);

    window.requestAnimationFrame(() => {
      const editor = markdownEditorRef.current;
      if (!editor) {
        return;
      }
      const cursor = start + content.length;
      editor.focus();
      editor.setSelectionRange(cursor, cursor);
    });
  }

  function saveEventDialog(): void {
    if (!eventDialog) {
      return;
    }

    const title = eventDialog.title.trim();
    if (!title) {
      setToastMessage("Event title is required");
      return;
    }

    const startTime = eventDialog.allDay ? "00:00" : eventDialog.startTime;
    const endTime = eventDialog.allDay ? "23:59" : eventDialog.endTime;
    const start = parseDateTimeInput(eventDialog.startDate, startTime);
    const parsedEnd = parseDateTimeInput(eventDialog.endDate, endTime);

    if (!start || !parsedEnd) {
      setToastMessage("Enter a valid start and end time");
      return;
    }

    let end = parsedEnd;
    if (end <= start) {
      end = eventDialog.allDay
        ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 0, 0)
        : new Date(start.getTime() + 30 * 60000);
    }

    const now = new Date().toISOString();
    const baseEvent: CalendarEvent = {
      id: eventDialog.eventId ?? crypto.randomUUID(),
      title,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      allDay: eventDialog.allDay,
      calendar: eventDialog.calendar.trim() || "Events",
      noteId: eventDialog.linkedNoteId ?? null,
      createdAt: now,
      updatedAt: now
    };

    if (eventDialog.mode === "edit" && eventDialog.eventId) {
      setCalendarEvents((previous) =>
        previous.map((event) =>
          event.id === eventDialog.eventId
            ? {
                ...event,
                ...baseEvent,
                createdAt: event.createdAt,
                updatedAt: now
              }
            : event
        )
      );
      setToastMessage(`Event "${title}" updated`);
      setEventDialog(null);
      return;
    }

    setCalendarEvents((previous) => [baseEvent, ...previous]);
    insertEventReferenceFromDialog(baseEvent, eventDialog.origin);
    setToastMessage(`Event "${title}" created`);
    setEventDialog(null);
  }

  function deleteCalendarEvent(eventId: string): void {
    const existing = calendarEventsById.get(eventId);
    if (!existing) {
      return;
    }
    setCalendarEvents((previous) => previous.filter((event) => event.id !== eventId));
    setEventDialog((previous) => (previous?.eventId === eventId ? null : previous));
    setToastMessage(`Deleted "${existing.title}"`);
  }

  function openSearchResult(note: AppNote, mode: "open" | "copy-link" | "open-window" = "open"): void {
    rememberSearchQuery(quickQuery);

    if (mode === "copy-link") {
      void copyNoteLink(note.id);
      return;
    }

    if (mode === "open-window") {
      openNoteInNewWindow(note.id);
      return;
    }

    focusNote(note.id);
    setSearchOpen(false);
  }

  function openCommandPalette(): void {
    setSearchScope("everywhere");
    setSearchFilters([]);
    setQuickQuery(">");
    setSearchOpen(true);
  }

  function openTasksPanel(): void {
    setSidebarView("tasks");
    setTasksDialogOpen(true);
    setFilesDialogOpen(false);
    setCalendarDialogOpen(false);
    setSearchOpen(false);
  }

  function quickCreateTask(): void {
    const rawInput = window.prompt("Task text");
    const taskText = rawInput?.trim();
    if (!taskText) {
      return;
    }
    if (!activeNote) {
      setToastMessage("Open a note before creating a task");
      return;
    }

    const base = draftMarkdown.replace(/\s+$/, "");
    const separator = base.length ? "\n\n" : "";
    const nextMarkdown = `${base}${separator}- [ ] ${taskText}\n`;
    setDraftMarkdown(nextMarkdown);
    setSaveState("dirty");
    openTasksPanel();
    setToastMessage(`Task "${taskText}" added`);
  }

  function runPaletteAction(actionId: string): void {
    if (actionId === "new-note") {
      setSearchOpen(false);
      createNewNote();
      return;
    }

    if (actionId === "new-notebook") {
      setSearchOpen(false);
      createNotebook();
      return;
    }

    if (actionId === "open-home") {
      setSidebarView("notes");
      setBrowseMode("home");
      setSelectedNotebook("All Notes");
      setTasksDialogOpen(false);
      setFilesDialogOpen(false);
      setCalendarDialogOpen(false);
      setAiPanelOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "open-notes") {
      setSidebarView("notes");
      setBrowseMode("all");
      setTasksDialogOpen(false);
      setFilesDialogOpen(false);
      setCalendarDialogOpen(false);
      setAiPanelOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "open-shortcuts") {
      setSidebarView("notes");
      setBrowseMode("shortcuts");
      setSelectedNotebook("All Notes");
      setTasksDialogOpen(false);
      setFilesDialogOpen(false);
      setCalendarDialogOpen(false);
      setAiPanelOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "open-tasks") {
      openTasksPanel();
      setAiPanelOpen(false);
      return;
    }

    if (actionId === "open-files") {
      setSidebarView("notes");
      setTasksDialogOpen(false);
      setFilesDialogOpen(true);
      setCalendarDialogOpen(false);
      setAiPanelOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "open-calendar") {
      setSidebarView("calendar");
      setTasksDialogOpen(false);
      setFilesDialogOpen(false);
      setCalendarDialogOpen(true);
      setAiPanelOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "open-ai") {
      setAiPanelOpen(true);
      setMetadataOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "open-templates") {
      setSidebarView("notes");
      setBrowseMode("templates");
      setSelectedNotebook("All Notes");
      setTasksDialogOpen(false);
      setFilesDialogOpen(false);
      setCalendarDialogOpen(false);
      setAiPanelOpen(false);
      setSearchOpen(false);
      return;
    }

    if (actionId === "toggle-view") {
      setViewMode((previous) => (previous === "cards" ? "list" : "cards"));
      setSearchOpen(false);
      return;
    }

    if (actionId === "toggle-density") {
      setNoteDensity((previous) => (previous === "comfortable" ? "compact" : "comfortable"));
      setSearchOpen(false);
      return;
    }

    if (actionId === "toggle-editor") {
      setEditorMode((previous) => (previous === "markdown" ? "rich" : "markdown"));
      setSearchOpen(false);
      return;
    }

    if (actionId === "cycle-theme") {
      cycleTheme();
      setSearchOpen(false);
      return;
    }

    if (actionId === "save-search") {
      saveCurrentSearch();
      return;
    }
  }

  function openCardMenu(noteId: string, clientX: number, clientY: number): void {
    const noteIds = selectedIds.has(noteId) ? Array.from(selectedIds) : [noteId];
    const position = clampMenuPosition(clientX, clientY);
    setContextMenu({ x: position.x, y: position.y, noteIds });
    setEditorContextMenu(null);
  }

  function openEditorMenu(): void {
    if (!activeNote || !editorMenuButtonRef.current) {
      return;
    }

    const rect = editorMenuButtonRef.current.getBoundingClientRect();
    const position = clampMenuPosition(rect.left - 210, rect.bottom + 8);
    setContextMenu({ x: position.x, y: position.y, noteIds: [activeNote.id] });
    setEditorContextMenu(null);
  }

  function openNoteListMenu(kind: "sort" | "filter", clientX: number, clientY: number): void {
    const position = clampMenuPosition(clientX, clientY);
    setNoteListMenu({ kind, x: position.x, y: position.y });
    setContextMenu(null);
    setNotebookMenu(null);
    setEditorContextMenu(null);
  }

  function toggleTagFilter(tag: string): void {
    setTagFilters((previous) => {
      if (previous.includes(tag)) {
        return previous.filter((entry) => entry !== tag);
      }
      return [...previous, tag].sort((left, right) => left.localeCompare(right));
    });
  }

  function toggleSearchFilter(kind: SearchFilterKind): void {
    setSearchFilters((previous) => {
      if (previous.includes(kind)) {
        return previous.filter((entry) => entry !== kind);
      }
      return [...previous, kind];
    });
  }

  function toggleStackCollapsed(stack: string): void {
    setCollapsedStacks((previous) => {
      const next = new Set(previous);
      if (next.has(stack)) {
        next.delete(stack);
      } else {
        next.add(stack);
      }
      return next;
    });
  }

  function createNotebook(): void {
    const raw = window.prompt("Notebook name");
    const notebook = raw?.trim();
    if (!notebook) {
      return;
    }

    if (notebookList.includes(notebook)) {
      setSelectedNotebook(notebook);
      setToastMessage(`Notebook "${notebook}" already exists`);
      return;
    }

    const now = new Date().toISOString();
    const markdown = "# Untitled\n\n";
    const seed: AppNote = {
      id: crypto.randomUUID(),
      title: "Untitled",
      snippet: "",
      tags: [],
      linksOut: [],
      createdAt: now,
      updatedAt: now,
      notebook,
      path: `${notebook}/untitled.md`,
      markdown
    };
    const created = noteFromMarkdown(seed, markdown, now);
    setNotes((previous) => [created, ...previous]);
    setSelectedNotebook(notebook);
    focusNote(created.id);
    setToastMessage(`Notebook "${notebook}" created`);
  }

  function createNoteFromScratchPad(): void {
    const content = homeScratchPad.trim();
    if (!content) {
      setToastMessage("Scratch pad is empty");
      return;
    }

    const suggestedTitle = content.split(/\r?\n/)[0]?.replace(/^#+\s*/, "").trim() || "Scratch note";
    const rawTitle = window.prompt("New note title", suggestedTitle);
    const title = rawTitle?.trim();
    if (!title) {
      return;
    }

    const notebook = resolveDefaultNotebook();
    const now = new Date().toISOString();
    const markdown = `# ${title}\n\n${content}`;
    const created = noteFromMarkdown(
      {
        id: crypto.randomUUID(),
        title,
        snippet: "",
        tags: [],
        linksOut: [],
        createdAt: now,
        updatedAt: now,
        path: `${notebook}/${toFileName(title)}`,
        notebook,
        markdown
      },
      markdown,
      now
    );

    setNotes((previous) => [created, ...previous]);
    setHomeScratchPad("");
    setBrowseMode("all");
    setSelectedNotebook(notebook);
    focusNote(created.id);
    setToastMessage(`Created note "${title}"`);
  }

  function toggleShortcutNotes(noteIds: string[]): { added: number; removed: number } {
    const validIds = new Set(notes.map((note) => note.id));
    let added = 0;
    let removed = 0;
    setShortcutNoteIds((previous) => {
      const next = [...previous];
      for (const noteId of noteIds) {
        if (!validIds.has(noteId)) {
          continue;
        }

        const index = next.indexOf(noteId);
        if (index >= 0) {
          next.splice(index, 1);
          removed += 1;
        } else {
          next.push(noteId);
          added += 1;
        }
      }
      return next;
    });
    return { added, removed };
  }

  function removeShortcut(noteId: string): void {
    setShortcutNoteIds((previous) => previous.filter((entry) => entry !== noteId));
  }

  function removePinnedNote(noteId: string, scope: "home" | "notebook"): void {
    if (scope === "home") {
      setHomePinnedNoteIds((previous) => previous.filter((entry) => entry !== noteId));
      return;
    }
    setNotebookPinnedNoteIds((previous) => previous.filter((entry) => entry !== noteId));
  }

  function togglePinnedNotes(noteIds: string[], scope: "home" | "notebook"): { pinned: number; unpinned: number } {
    const validIds = new Set(notes.map((note) => note.id));
    let pinned = 0;
    let unpinned = 0;
    const apply = (previous: string[]): string[] => {
      const next = [...previous];
      for (const noteId of noteIds) {
        if (!validIds.has(noteId)) {
          continue;
        }
        const index = next.indexOf(noteId);
        if (index >= 0) {
          next.splice(index, 1);
          unpinned += 1;
        } else {
          next.push(noteId);
          pinned += 1;
        }
      }
      return next;
    };

    if (scope === "home") {
      setHomePinnedNoteIds(apply);
    } else {
      setNotebookPinnedNoteIds(apply);
    }

    return { pinned, unpinned };
  }

  function toggleTemplateNotes(noteIds: string[]): { marked: number; unmarked: number } {
    const selected = notes.filter((note) => noteIds.includes(note.id));
    const setTemplate = !selected.length || !selected.every((note) => note.isTemplate);
    let marked = 0;
    let unmarked = 0;

    setNotes((previous) =>
      previous.map((note) => {
        if (!noteIds.includes(note.id)) {
          return note;
        }

        const nextTemplate = setTemplate;
        if (Boolean(note.isTemplate) === nextTemplate) {
          return note;
        }

        if (nextTemplate) {
          marked += 1;
        } else {
          unmarked += 1;
        }

        return {
          ...note,
          isTemplate: nextTemplate
        };
      })
    );

    return { marked, unmarked };
  }

  function restoreNoteSnapshot(noteId: string, index: number): void {
    const snapshot = noteHistory[noteId]?.[index];
    if (!snapshot) {
      return;
    }

    setNotes((previous) =>
      previous.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        return noteFromMarkdown(
          {
            ...note,
            title: snapshot.title,
            path: `${note.notebook}/${toFileName(snapshot.title)}`
          },
          snapshot.markdown,
          new Date().toISOString()
        );
      })
    );

    if (activeId === noteId) {
      setDraftMarkdown(snapshot.markdown);
    }

    setNoteHistoryDialog(null);
    setToastMessage(`Restored ${new Date(snapshot.at).toLocaleString()}`);
  }

  function confirmStackAssignment(): void {
    if (!stackDialog) {
      return;
    }

    const chosen = stackDialog.newStackName.trim() || stackDialog.selectedStack.trim();
    if (!chosen) {
      setStackDialog(null);
      return;
    }

    assignNotebookToStack(stackDialog.notebook, chosen);
    setStackDialog(null);
  }

  function assignNotebookToStack(notebook: string, stack: string): void {
    const chosen = stack.trim();
    if (!chosen) {
      return;
    }

    setNotebookStacks((previous) => ({
      ...previous,
      [notebook]: chosen
    }));
    setCollapsedStacks((previous) => {
      if (!previous.has(chosen)) {
        return previous;
      }
      const next = new Set(previous);
      next.delete(chosen);
      return next;
    });
    setToastMessage(`Moved "${notebook}" to stack "${chosen}"`);
  }

  function removeNotebookFromStack(notebook: string): void {
    setNotebookStacks((previous) => {
      if (!(notebook in previous)) {
        return previous;
      }
      const next = { ...previous };
      delete next[notebook];
      return next;
    });
    setToastMessage(`Removed "${notebook}" from stack`);
  }

  function moveNotes(noteIds: string[], destination: string): void {
    const changed = notes.filter((note) => noteIds.includes(note.id) && note.notebook !== destination);
    if (changed.length === 0) {
      return;
    }

    const previousById: Record<string, { notebook: string; path: string }> = {};
    for (const note of changed) {
      previousById[note.id] = { notebook: note.notebook, path: note.path };
    }

    setNotes((previous) =>
      previous.map((note) => {
        if (!noteIds.includes(note.id)) {
          return note;
        }

        if (note.notebook === destination) {
          return note;
        }

        return {
          ...note,
          notebook: destination,
          path: `${destination}/${toFileName(note.title)}`,
          updatedAt: new Date().toISOString()
        };
      })
    );

    setLastMove({ previousById });
    setLastTrash(null);
    setToastMessage(
      `${changed.length === 1 ? `\"${changed[0].title}\"` : `${changed.length} notes`} moved to ${destination}`
    );
  }

  async function cloneNoteAttachmentsForCopy(
    sourceNotePath: string,
    targetNotePath: string,
    markdown: string
  ): Promise<string> {
    if (!window.pkmShell?.cloneAttachmentLinks) {
      return markdown;
    }

    const result = await window.pkmShell.cloneAttachmentLinks({
      sourceNotePath,
      targetNotePath,
      markdown
    });

    return result?.markdown ?? markdown;
  }

  async function useTemplateNote(note: AppNote): Promise<void> {
    const defaultTitle = note.title === "Untitled" ? "New note" : `${note.title} copy`;
    const rawTitle = window.prompt("New note title", defaultTitle);
    const nextTitle = rawTitle?.trim();
    if (!nextTitle) {
      return;
    }

    const now = new Date().toISOString();
    const path = `${note.notebook}/${toFileName(nextTitle)}`;
    const rewrittenHeading = rewriteHeading(note.markdown, nextTitle);
    const markdown = await cloneNoteAttachmentsForCopy(note.path, path, rewrittenHeading);
    const created = noteFromMarkdown(
      {
        ...note,
        id: crypto.randomUUID(),
        title: nextTitle,
        path,
        markdown,
        isTemplate: false,
        createdAt: now,
        updatedAt: now
      },
      markdown,
      now
    );

    setNotes((previous) => [created, ...previous]);
    setSelectedNotebook(created.notebook);
    setBrowseMode("all");
    focusNote(created.id);
    setToastMessage(`Created note from template "${note.title}"`);
  }

  async function copyNotes(noteIds: string[], destination: string): Promise<void> {
    const selected = notes.filter((note) => noteIds.includes(note.id));
    if (!selected.length) {
      return;
    }

    const now = new Date().toISOString();
    const copies = await Promise.all(selected.map(async (source, index) => {
      const suffix = selected.length > 1 ? ` copy ${index + 1}` : " copy";
      const draft = parseForPreview(source.markdown);
      const copyTitle = `${draft.title}${suffix}`;
      const copyPath = `${destination}/${toFileName(copyTitle)}`;
      const rewrittenHeading = source.markdown.replace(/^#\s+.*$/m, `# ${copyTitle}`);
      const rewritten = await cloneNoteAttachmentsForCopy(source.path, copyPath, rewrittenHeading);
      const copy: AppNote = {
        ...source,
        id: crypto.randomUUID(),
        notebook: destination,
        markdown: rewritten,
        createdAt: now,
        updatedAt: now,
        path: copyPath,
        title: copyTitle
      };
      return noteFromMarkdown(copy, rewritten, now);
    }));

    setNotes((previous) => [...copies, ...previous]);
    setToastMessage(
      `${copies.length === 1 ? `\"${copies[0].title}\"` : `${copies.length} notes`} copied to ${destination}`
    );
  }

  function undoLastAction(): void {
    if (lastTrash) {
      setNotes((previous) => {
        const existingIds = new Set(previous.map((note) => note.id));
        const restored = lastTrash.notes.filter((note) => !existingIds.has(note.id));
        return [...restored, ...previous];
      });
      setLastTrash(null);
      setToastMessage("Restored from Trash");
      return;
    }

    if (!lastMove) {
      return;
    }

    setNotes((previous) =>
      previous.map((note) => {
        const prior = lastMove.previousById[note.id];
        if (!prior) {
          return note;
        }

        return {
          ...note,
          notebook: prior.notebook,
          path: prior.path,
          updatedAt: new Date().toISOString()
        };
      })
    );

    setToastMessage("Move undone");
    setLastMove(null);
  }

  async function duplicateNotes(noteIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    const duplicates = await Promise.all(
      notes
        .filter((note) => noteIds.includes(note.id))
        .map(async (note) => {
        const title = `${note.title} copy`;
        const path = `${note.notebook}/${toFileName(title)}`;
        const rewrittenHeading = note.markdown.replace(/^#\s+.*$/m, `# ${title}`);
        const markdown = await cloneNoteAttachmentsForCopy(note.path, path, rewrittenHeading);
        const copy: AppNote = {
          ...note,
          id: crypto.randomUUID(),
          title,
          markdown,
          createdAt: now,
          updatedAt: now,
          path
        };

        return noteFromMarkdown(copy, markdown, now);
      })
    );

    if (!duplicates.length) {
      return;
    }

    setNotes((previous) => [...duplicates, ...previous]);
    setToastMessage(`${duplicates.length} duplicated`);
    focusNote(duplicates[0].id);
  }

  function renameNote(noteId: string, nextTitle: string): void {
    const note = notes.find((entry) => entry.id === noteId);
    const trimmedTitle = nextTitle.trim();
    if (!note || !trimmedTitle || note.title === trimmedTitle) {
      setNoteRenameDialog(null);
      return;
    }

    flushActiveDraft();

    const titleMap = new Map<string, string>([[note.title.toLowerCase(), trimmedTitle]]);
    const now = new Date().toISOString();
    let nextDraft: string | null = null;

    setNotes((previous) =>
      previous.map((entry) => {
        if (entry.id === note.id) {
          const renamedMarkdown = rewriteHeading(entry.markdown, trimmedTitle);
          const renamed = noteFromMarkdown(
            {
              ...entry,
              title: trimmedTitle,
              path: `${entry.notebook}/${toFileName(trimmedTitle)}`
            },
            renamedMarkdown,
            now
          );
          if (entry.id === activeId) {
            nextDraft = renamed.markdown;
          }
          return renamed;
        }

        const rewrittenMarkdown = rewriteWikilinks(entry.markdown, titleMap);
        if (rewrittenMarkdown === entry.markdown) {
          return entry;
        }

        const rewritten = noteFromMarkdown(entry, rewrittenMarkdown, now);
        if (entry.id === activeId) {
          nextDraft = rewritten.markdown;
        }
        return rewritten;
      })
    );

    if (nextDraft !== null) {
      setDraftMarkdown(nextDraft);
    }

    setNoteRenameDialog(null);
    setToastMessage(`Renamed to "${trimmedTitle}"`);
  }

  async function copyNoteLink(noteId: string): Promise<void> {
    const note = notes.find((entry) => entry.id === noteId);
    if (!note) {
      return;
    }

    const encoded = encodeURIComponent(note.path);
    const link = `pkm-os://note/${encoded}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      setToastMessage("Note link copied");
      return;
    }

    setToastMessage(link);
  }

  function openNoteInNewWindow(noteId: string): void {
    const note = notes.find((entry) => entry.id === noteId);
    if (!note || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("note", note.id);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  function exportNote(noteId: string): void {
    const note = notes.find((entry) => entry.id === noteId);
    if (!note || typeof document === "undefined") {
      return;
    }

    const blob = new Blob([note.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = toFileName(note.title);
    link.click();
    URL.revokeObjectURL(url);
    setToastMessage(`Exported "${note.title}"`);
  }

  function handleMenuAction(action: string): void {
    if (!contextMenu) {
      return;
    }

    const targetId = contextMenu.noteIds[0];

    if (action === "move") {
      setMoveDialog({
        noteIds: contextMenu.noteIds,
        destination: selectedNotebook === "All Notes" ? "" : selectedNotebook,
        mode: "move"
      });
      setContextMenu(null);
      return;
    }

    if (action === "copy-to") {
      setMoveDialog({
        noteIds: contextMenu.noteIds,
        destination: selectedNotebook === "All Notes" ? "" : selectedNotebook,
        mode: "copy"
      });
      setContextMenu(null);
      return;
    }

    if (action === "duplicate") {
      void duplicateNotes(contextMenu.noteIds);
      setContextMenu(null);
      return;
    }

    if (action === "copy-link") {
      void copyNoteLink(targetId);
      setContextMenu(null);
      return;
    }

    if (action === "rename") {
      const target = notes.find((note) => note.id === targetId);
      if (target) {
        setNoteRenameDialog({
          noteId: target.id,
          newTitle: target.title
        });
      }
      setContextMenu(null);
      return;
    }

    if (action === "share") {
      void copyNoteLink(targetId);
      setToastMessage("Share link copied");
      setContextMenu(null);
      return;
    }

    if (action === "open-window") {
      openNoteInNewWindow(targetId);
      setContextMenu(null);
      return;
    }

    if (action === "note-info") {
      if (targetId && targetId !== activeId) {
        focusNote(targetId);
      }
      setMetadataOpen(true);
      setAiPanelOpen(false);
      setContextMenu(null);
      return;
    }

    if (action === "move-trash") {
      const trashed = notes.filter((note) => contextMenu.noteIds.includes(note.id));
      if (trashed.length) {
        setLastTrash({ notes: trashed });
        setLastMove(null);
      }
      setNotes((previous) => previous.filter((note) => !contextMenu.noteIds.includes(note.id)));
      setToastMessage(
        `${contextMenu.noteIds.length === 1 ? "1 note" : `${contextMenu.noteIds.length} notes`} moved to Trash`
      );
      setContextMenu(null);
      return;
    }

    if (action === "edit-tags") {
      setTagEditorOpen(true);
      setContextMenu(null);
      window.requestAnimationFrame(() => {
        const input = document.getElementById("tag-input");
        if (input instanceof HTMLInputElement) {
          input.focus();
        }
      });
      return;
    }

    if (action === "find") {
      setSearchScope("current");
      setQuickQuery(activeNote?.title ?? "");
      setSearchOpen(true);
      setContextMenu(null);
      return;
    }

    if (action === "add-shortcuts") {
      const { added, removed } = toggleShortcutNotes(contextMenu.noteIds);
      if (added && removed) {
        setToastMessage(`Shortcuts updated (+${added}/-${removed})`);
      } else if (added) {
        setToastMessage(`${added} added to shortcuts`);
      } else if (removed) {
        setToastMessage(`${removed} removed from shortcuts`);
      } else {
        setToastMessage("No shortcut changes");
      }
      setContextMenu(null);
      return;
    }

    if (action === "note-history") {
      setNoteHistoryDialog({ noteId: targetId });
      setContextMenu(null);
      return;
    }

    if (action === "toggle-template") {
      const { marked, unmarked } = toggleTemplateNotes(contextMenu.noteIds);
      if (marked && unmarked) {
        setToastMessage(`Templates updated (+${marked}/-${unmarked})`);
      } else if (marked) {
        setToastMessage(`${marked} marked as template`);
      } else if (unmarked) {
        setToastMessage(`${unmarked} removed from templates`);
      } else {
        setToastMessage("No template changes");
      }
      setContextMenu(null);
      return;
    }

    if (action === "pin-home") {
      const { pinned, unpinned } = togglePinnedNotes(contextMenu.noteIds, "home");
      if (pinned && unpinned) {
        setToastMessage(`Home pins updated (+${pinned}/-${unpinned})`);
      } else if (pinned) {
        setToastMessage(`${pinned} pinned to Home`);
      } else if (unpinned) {
        setToastMessage(`${unpinned} unpinned from Home`);
      } else {
        setToastMessage("No pin changes");
      }
      setContextMenu(null);
      return;
    }

    if (action === "pin-notebook") {
      const { pinned, unpinned } = togglePinnedNotes(contextMenu.noteIds, "notebook");
      if (pinned && unpinned) {
        setToastMessage(`Notebook pins updated (+${pinned}/-${unpinned})`);
      } else if (pinned) {
        setToastMessage(`${pinned} pinned to notebook`);
      } else if (unpinned) {
        setToastMessage(`${unpinned} unpinned from notebook`);
      } else {
        setToastMessage("No pin changes");
      }
      setContextMenu(null);
      return;
    }

    if (action === "export") {
      exportNote(targetId);
      setContextMenu(null);
      return;
    }

    if (action === "export-pdf") {
      window.print();
      setContextMenu(null);
      return;
    }

    if (action === "print") {
      window.print();
      setContextMenu(null);
      return;
    }

    setContextMenu(null);
  }

  function getContextMenuLabel(action: string, defaultLabel: string): string {
    if (!contextMenu) {
      return defaultLabel;
    }

    const allShortcut = contextMenu.noteIds.every((noteId) => shortcutSet.has(noteId));
    const allHomePinned = contextMenu.noteIds.every((noteId) => homePinnedSet.has(noteId));
    const allNotebookPinned = contextMenu.noteIds.every((noteId) => notebookPinnedSet.has(noteId));
    const allTemplates = contextMenu.noteIds.every((noteId) => {
      const note = notes.find((entry) => entry.id === noteId);
      return Boolean(note?.isTemplate);
    });

    if (action === "add-shortcuts") {
      return allShortcut ? "Remove from Shortcuts" : "Add to Shortcuts";
    }
    if (action === "pin-home") {
      return allHomePinned ? "Unpin from Home" : "Pin to Home";
    }
    if (action === "pin-notebook") {
      return allNotebookPinned ? "Unpin from Notebook" : "Pin to Notebook";
    }
    if (action === "toggle-template") {
      return allTemplates ? "Remove from Templates" : "Set as template";
    }

    return defaultLabel;
  }

  function createNewNote(): void {
    flushActiveDraft();

    const notebook = resolveDefaultNotebook();
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const markdown = "# Untitled\n\n";

    const seed: AppNote = {
      id,
      title: "Untitled",
      snippet: "",
      tags: [],
      linksOut: [],
      createdAt: now,
      updatedAt: now,
      notebook,
      path: `${notebook}/untitled.md`,
      markdown
    };

    const note = noteFromMarkdown(seed, markdown, now);

    setNotes((previous) => [note, ...previous]);
    setSelectedNotebook(notebook);
    focusNote(note.id);
  }

  function confirmNotebookRename(): void {
    if (!renameDialog || !renameDialog.newName.trim()) {
      return;
    }

    const renamed = renameDialog.newName.trim();
    setNotes((previous) =>
      previous.map((note) => {
        if (note.notebook !== renameDialog.oldName) {
          return note;
        }

        return {
          ...note,
          notebook: renamed,
          path: `${renamed}/${toFileName(note.title)}`
        };
      })
    );

    if (selectedNotebook === renameDialog.oldName) {
      setSelectedNotebook(renamed);
    }

    setNotebookStacks((previous) => {
      if (!(renameDialog.oldName in previous)) {
        return previous;
      }
      const next = { ...previous };
      const stack = next[renameDialog.oldName];
      delete next[renameDialog.oldName];
      next[renamed] = stack;
      return next;
    });

    setRenameDialog(null);
    setToastMessage(`Notebook renamed to ${renamed}`);
  }

  function addTagToActiveNote(rawTag: string): void {
    if (!activeNote) {
      return;
    }

    const normalized = rawTag.trim().replace(/^#/, "");
    if (!normalized) {
      return;
    }

    setNotes((previous) =>
      previous.map((note) => {
        if (note.id !== activeNote.id) {
          return note;
        }
        if (note.tags.includes(normalized)) {
          return note;
        }
        const nextTags = [...note.tags, normalized].sort((left, right) => left.localeCompare(right));
        return {
          ...note,
          tags: nextTags,
          updatedAt: new Date().toISOString()
        };
      })
    );

    setTagInput("");
    setTagEditorOpen(false);
    setToastMessage(`Tag #${normalized} added`);
  }

  function removeTagFromActiveNote(tag: string): void {
    if (!activeNote) {
      return;
    }

    setNotes((previous) =>
      previous.map((note) => {
        if (note.id !== activeNote.id) {
          return note;
        }
        return {
          ...note,
          tags: note.tags.filter((entry) => entry !== tag),
          updatedAt: new Date().toISOString()
        };
      })
    );
  }

  function renderInlineWithLinks(text: string): ReactNode {
    const parts = text.split(/(\[\[event:[^\]|]+\|[^\]]+\]\]|\[\[[^\]]+\]\])/gi).filter(Boolean);

    return parts.map((part, index) => {
      const eventMatch = part.match(/^\[\[event:([^\]|]+)\|([^\]]+)\]\]$/i);
      if (eventMatch) {
        const eventId = eventMatch[1].trim();
        const fallbackTitle = eventMatch[2].trim() || "Event";
        const linkedEvent = calendarEventsById.get(eventId) ?? null;
        const label = linkedEvent?.title || fallbackTitle;

        return (
          <button
            key={`event-${eventId}-${index}`}
            type="button"
            className="inline-link"
            onClick={() => {
              if (linkedEvent) {
                openEditEventDialog(linkedEvent.id);
              }
              setSidebarView("calendar");
              setCalendarDialogOpen(true);
            }}
          >
            [{label}]
          </button>
        );
      }

      const noteMatch = part.match(/^\[\[([^\]]+)\]\]$/);
      if (!noteMatch) {
        return <span key={`${part}-${index}`}>{part}</span>;
      }

      const label = noteMatch[1].trim();
      const target = notes.find((note) => note.title.toLowerCase() === label.toLowerCase());

      return (
        <button
          key={`${label}-${index}`}
          type="button"
          className="inline-link"
          onClick={() => {
            if (target) {
              focusNote(target.id);
            } else {
              const created = ensureLinkedNote(label);
              focusNote(created.id);
            }
          }}
        >
          [[{label}]]
        </button>
      );
    });
  }

  function renderNotebookRow(notebook: string, nested = false): ReactNode {
    const count = notes.filter((note) => note.notebook === notebook).length;
    const isDropTarget = dropNotebook === notebook;
    return (
      <li key={notebook} className={nested ? "stack-notebook-row" : ""}>
        <button
          type="button"
          draggable
          className={selectedNotebook === notebook ? "notebook-item active" : "notebook-item"}
          onClick={() => {
            flushActiveDraft();
            setSidebarView("notes");
            setTasksDialogOpen(false);
            setFilesDialogOpen(false);
            setCalendarDialogOpen(false);
            setBrowseMode("all");
            setSelectedNotebook(notebook);
          }}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            setDraggingNotebook(notebook);
          }}
          onDragEnd={() => {
            setDraggingNotebook(null);
            setStackDropTarget(null);
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            const position = clampMenuPosition(event.clientX, event.clientY);
            setNotebookMenu({ notebook, x: position.x, y: position.y });
          }}
          onDragOver={(event) => {
            if (!draggingNoteId) {
              return;
            }
            event.preventDefault();
            setDropNotebook(notebook);
          }}
          onDragLeave={() => setDropNotebook(null)}
          onDrop={(event) => {
            event.preventDefault();
            if (!draggingNoteId) {
              return;
            }
            moveNotes([draggingNoteId], notebook);
            setDraggingNoteId(null);
            setDropNotebook(null);
          }}
        >
          <span>{notebook}</span>
          <small>{count}</small>
          {isDropTarget ? <i className="drop-indicator" /> : null}
        </button>
      </li>
    );
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  function isImageAttachment(file: File): boolean {
    if (file.type.startsWith("image/")) {
      return true;
    }
    return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(file.name);
  }

  function toAttachmentMarkdown(file: File, targetPath: string): string {
    if (isImageAttachment(file)) {
      return `![${file.name}](${targetPath})`;
    }
    return `[${file.name}](${targetPath})`;
  }

  function sanitizeAttachmentFallback(fileName: string): string {
    const cleaned = fileName.replace(/[\\/]/g, "-").trim();
    return cleaned || `attachment-${Date.now()}.bin`;
  }

  async function saveAttachmentForActiveNote(file: File): Promise<string> {
    if (!window.pkmShell?.saveAttachment || !activeNote) {
      return `./attachments/${sanitizeAttachmentFallback(file.name)}`;
    }

    const base64 = await fileToBase64(file);
    const saved = await window.pkmShell.saveAttachment({
      notePath: activeNote.path,
      fileName: file.name,
      base64
    });

    if (!saved?.relativePath) {
      return `./attachments/${sanitizeAttachmentFallback(file.name)}`;
    }
    return saved.relativePath;
  }

  function insertMarkdownAtSelection(content: string): void {
    const editor = markdownEditorRef.current;
    if (!editor) {
      setDraftMarkdown((previous) => `${previous}\n${content}`);
      return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const next = `${draftMarkdown.slice(0, start)}${content}${draftMarkdown.slice(end)}`;
    setDraftMarkdown(next);

    window.requestAnimationFrame(() => {
      const current = markdownEditorRef.current;
      if (!current) {
        return;
      }
      const cursor = start + content.length;
      current.focus();
      current.setSelectionRange(cursor, cursor);
    });
  }

  async function insertAttachmentFiles(files: File[], target: "markdown" | "rich"): Promise<void> {
    if (!activeNote) {
      setToastMessage("Select a note before adding attachments");
      return;
    }

    const candidates = files.filter((file) => file.size > 0);
    if (!candidates.length) {
      return;
    }

    const links: string[] = [];
    for (const file of candidates) {
      const path = await saveAttachmentForActiveNote(file);
      links.push(toAttachmentMarkdown(file, path));
    }

    const block = links.join("\n");
    if (target === "markdown") {
      insertMarkdownAtSelection(block);
    } else {
      richEditorRef.current?.insertContent(block);
    }

    setToastMessage(`${links.length} attachment${links.length > 1 ? "s" : ""} inserted`);
  }

  function runRichToolbarAction(action: "bold" | "italic" | "underline" | "bullet" | "link"): void {
    if (editorMode !== "rich") {
      return;
    }

    if (action === "bold") {
      richEditorRef.current?.toggleBold();
      return;
    }

    if (action === "italic") {
      richEditorRef.current?.toggleItalic();
      return;
    }

    if (action === "underline") {
      richEditorRef.current?.toggleUnderline();
      return;
    }

    if (action === "bullet") {
      richEditorRef.current?.toggleBulletList();
      return;
    }

    const href = window.prompt("Enter a URL for this link");
    if (!href?.trim()) {
      return;
    }

    richEditorRef.current?.setLink(href.trim());
  }

  function promptMediaInsert(commandId: "image" | "file" | "video" | "audio" | "transcribe-media"): string | null {
    if (commandId === "image") {
      const source = window.prompt("Image URL or relative path", "./attachments/image.png");
      if (!source?.trim()) {
        return null;
      }
      return `![image](${source.trim()})`;
    }

    if (commandId === "file") {
      const source = window.prompt("File URL or relative path", "./attachments/file.pdf");
      if (!source?.trim()) {
        return null;
      }
      return `[file](${source.trim()})`;
    }

    if (commandId === "video") {
      const source = window.prompt("Video URL or relative path", "https://");
      if (!source?.trim()) {
        return null;
      }
      return `[video](${source.trim()})`;
    }

    if (commandId === "audio") {
      const source = window.prompt("Audio URL or relative path", "./attachments/audio.m4a");
      if (!source?.trim()) {
        return null;
      }
      return `[audio](${source.trim()})`;
    }

    const source = window.prompt("Media to transcribe (URL or path)", "./attachments/media.mp4");
    if (!source?.trim()) {
      return null;
    }
    return `> Transcribe media\n> Source: ${source.trim()}\n`;
  }

  function openEditorContextMenu(clientX: number, clientY: number): void {
    const position = clampMenuPosition(clientX, clientY);
    setEditorContextMenu(position);
    setContextMenu(null);
    setNotebookMenu(null);
    setSlashMenu(null);
  }

  function applyMarkdownInlineFormat(
    prefix: string,
    suffix: string,
    fallback: string,
    options?: { linePrefix?: string }
  ): void {
    const editor = markdownEditorRef.current;
    if (!editor) {
      return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = draftMarkdown.slice(start, end);

    let replacement = "";
    let cursorStart = start;
    let cursorEnd = start;

    if (options?.linePrefix) {
      const line = selected || fallback;
      replacement = `${options.linePrefix}${line}`;
      cursorStart = start + replacement.length;
      cursorEnd = cursorStart;
    } else if (selected) {
      replacement = `${prefix}${selected}${suffix}`;
      cursorStart = start + replacement.length;
      cursorEnd = cursorStart;
    } else {
      replacement = `${prefix}${fallback}${suffix}`;
      cursorStart = start + prefix.length;
      cursorEnd = cursorStart + fallback.length;
    }

    const next = `${draftMarkdown.slice(0, start)}${replacement}${draftMarkdown.slice(end)}`;
    setDraftMarkdown(next);

    window.requestAnimationFrame(() => {
      const current = markdownEditorRef.current;
      if (!current) {
        return;
      }
      current.focus();
      current.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function handleEditorContextAction(action: string): void {
    if (action === "copy-note-link") {
      if (activeNote) {
        void copyNoteLink(activeNote.id);
      }
      setEditorContextMenu(null);
      return;
    }

    if (editorMode === "rich") {
      if (action === "bold") {
        richEditorRef.current?.toggleBold();
      } else if (action === "italic") {
        richEditorRef.current?.toggleItalic();
      } else if (action === "underline") {
        richEditorRef.current?.toggleUnderline();
      } else if (action === "strikethrough") {
        richEditorRef.current?.toggleStrike();
      } else if (action === "bullet") {
        richEditorRef.current?.toggleBulletList();
      } else if (action === "checklist") {
        richEditorRef.current?.toggleTaskList();
      } else if (action === "link") {
        runRichToolbarAction("link");
      }

      setEditorContextMenu(null);
      return;
    }

    if (action === "bold") {
      applyMarkdownInlineFormat("**", "**", "bold text");
    } else if (action === "italic") {
      applyMarkdownInlineFormat("*", "*", "italic text");
    } else if (action === "underline") {
      applyMarkdownInlineFormat("<u>", "</u>", "underlined text");
    } else if (action === "strikethrough") {
      applyMarkdownInlineFormat("~~", "~~", "struck text");
    } else if (action === "bullet") {
      applyMarkdownInlineFormat("", "", "item", { linePrefix: "- " });
    } else if (action === "checklist") {
      applyMarkdownInlineFormat("", "", "task", { linePrefix: "- [ ] " });
    } else if (action === "link") {
      applyMarkdownInlineFormat("[", "](https://)", "link text");
    }

    setEditorContextMenu(null);
  }

  function applyMarkdownSlashCommand(command: SlashCommand): void {
    const editor = markdownEditorRef.current;
    if (!editor) {
      return;
    }

    const typedRange =
      slashMenu?.editor === "markdown" && slashMenu.source === "typed" ? slashMenu.markdownRange : undefined;
    const selectionStart = editor.selectionStart;
    const selectionEnd = editor.selectionEnd;
    const replaceStart = typedRange ? typedRange.start : selectionStart;
    const replaceEnd = typedRange ? typedRange.end : selectionEnd;
    const selectedText = typedRange ? "" : draftMarkdown.slice(selectionStart, selectionEnd);

    let replacement = "";
    let cursorStart = replaceStart;
    let cursorEnd = replaceStart;

    const insert = (value: string) => {
      replacement = value;
      cursorStart = replaceStart + value.length;
      cursorEnd = cursorStart;
    };

    const wrap = (prefix: string, suffix: string, placeholder: string) => {
      const content = selectedText || placeholder;
      replacement = `${prefix}${content}${suffix}`;
      if (selectedText) {
        cursorStart = replaceStart + replacement.length;
        cursorEnd = cursorStart;
      } else {
        cursorStart = replaceStart + prefix.length;
        cursorEnd = cursorStart + placeholder.length;
      }
    };

    switch (command.id) {
      case "heading-1":
        insert(`# ${selectedText || "Heading"}\n`);
        break;
      case "heading-2":
        insert(`## ${selectedText || "Heading"}\n`);
        break;
      case "heading-3":
        insert(`### ${selectedText || "Heading"}\n`);
        break;
      case "paragraph":
        insert(`${selectedText || "Text"}\n`);
        break;
      case "quote":
        insert(`> ${selectedText || "Quote"}\n`);
        break;
      case "divider":
        insert("\n---\n");
        break;
      case "bold":
        wrap("**", "**", "bold text");
        break;
      case "italic":
        wrap("*", "*", "italic text");
        break;
      case "underline":
        wrap("<u>", "</u>", "underlined text");
        break;
      case "strikethrough":
        wrap("~~", "~~", "struck text");
        break;
      case "superscript":
        wrap("<sup>", "</sup>", "sup");
        break;
      case "subscript":
        wrap("<sub>", "</sub>", "sub");
        break;
      case "bullet-list":
        insert("- ");
        break;
      case "checklist":
      case "new-task":
      case "checkbox":
        insert("- [ ] ");
        break;
      case "numbered-list":
        insert("1. ");
        break;
      case "link":
        wrap("[", "](https://)", "link text");
        break;
      case "new-linked-note":
      case "link-to-note": {
        const title = window.prompt("Linked note title");
        if (!title?.trim()) {
          return;
        }
        const linked = ensureLinkedNote(title.trim());
        insert(`[[${linked.title}]]`);
        break;
      }
      case "table":
        insert("| Column | Value |\n| --- | --- |\n|  |  |\n");
        break;
      case "table-of-contents":
        insert("## Table of contents\n- \n");
        break;
      case "image":
        {
          const value = promptMediaInsert("image");
          if (!value) {
            return;
          }
          insert(value);
        }
        break;
      case "file":
        {
          const value = promptMediaInsert("file");
          if (!value) {
            return;
          }
          insert(value);
        }
        break;
      case "video":
        {
          const value = promptMediaInsert("video");
          if (!value) {
            return;
          }
          insert(value);
        }
        break;
      case "audio":
        {
          const value = promptMediaInsert("audio");
          if (!value) {
            return;
          }
          insert(value);
        }
        break;
      case "transcribe-media":
        {
          const value = promptMediaInsert("transcribe-media");
          if (!value) {
            return;
          }
          insert(value);
        }
        break;
      case "code-block":
        insert("```text\n\n```");
        break;
      case "formula":
        insert("$$\n\n$$");
        break;
      case "event":
        openCreateEventDialog({
          linkedNoteId: activeNote?.id ?? null,
          origin: {
            editor: "markdown",
            markdownRange: { start: replaceStart, end: replaceEnd }
          }
        });
        setSlashMenu(null);
        setLinkSuggestion(null);
        return;
      case "current-date":
        insert(new Date().toLocaleDateString());
        break;
      case "current-time":
        insert(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        break;
      default:
        setToastMessage(`"${command.label}" is planned`);
        return;
    }

    const next = `${draftMarkdown.slice(0, replaceStart)}${replacement}${draftMarkdown.slice(replaceEnd)}`;
    setDraftMarkdown(next);
    setSlashMenu(null);
    setLinkSuggestion(null);

    window.requestAnimationFrame(() => {
      const current = markdownEditorRef.current;
      if (!current) {
        return;
      }
      current.focus();
      current.setSelectionRange(cursorStart, cursorEnd);
    });
  }

  function applyRichSlashCommand(command: SlashCommand): void {
    const typedRange = slashMenu?.editor === "rich" && slashMenu.source === "typed" ? slashMenu.richRange : undefined;
    if (typedRange) {
      richEditorRef.current?.replaceRange(typedRange.from, typedRange.to, "");
    }

    switch (command.id) {
      case "heading-1":
        richEditorRef.current?.setHeading(1);
        break;
      case "heading-2":
        richEditorRef.current?.setHeading(2);
        break;
      case "heading-3":
        richEditorRef.current?.setHeading(3);
        break;
      case "paragraph":
        richEditorRef.current?.setParagraph();
        break;
      case "quote":
        richEditorRef.current?.toggleBlockquote();
        break;
      case "divider":
        richEditorRef.current?.setHorizontalRule();
        break;
      case "bold":
        richEditorRef.current?.toggleBold();
        break;
      case "italic":
        richEditorRef.current?.toggleItalic();
        break;
      case "underline":
        richEditorRef.current?.toggleUnderline();
        break;
      case "strikethrough":
        richEditorRef.current?.toggleStrike();
        break;
      case "superscript":
        richEditorRef.current?.insertContent("<sup>sup</sup>");
        break;
      case "subscript":
        richEditorRef.current?.insertContent("<sub>sub</sub>");
        break;
      case "bullet-list":
        richEditorRef.current?.toggleBulletList();
        break;
      case "checklist":
      case "new-task":
      case "checkbox":
        richEditorRef.current?.toggleTaskList();
        break;
      case "numbered-list":
        richEditorRef.current?.toggleOrderedList();
        break;
      case "link": {
        const href = window.prompt("Enter a URL for this link");
        if (!href?.trim()) {
          return;
        }
        richEditorRef.current?.setLink(href.trim());
        break;
      }
      case "new-linked-note":
      case "link-to-note": {
        const title = window.prompt("Linked note title");
        if (!title?.trim()) {
          return;
        }
        const linked = ensureLinkedNote(title.trim());
        richEditorRef.current?.insertContent(`[[${linked.title}]]`);
        break;
      }
      case "table":
        richEditorRef.current?.insertContent("| Column | Value |\n| --- | --- |\n|  |  |");
        break;
      case "table-of-contents":
        richEditorRef.current?.insertContent("## Table of contents\n- ");
        break;
      case "image":
        {
          const value = promptMediaInsert("image");
          if (!value) {
            return;
          }
          richEditorRef.current?.insertContent(value);
        }
        break;
      case "file":
        {
          const value = promptMediaInsert("file");
          if (!value) {
            return;
          }
          richEditorRef.current?.insertContent(value);
        }
        break;
      case "video":
        {
          const value = promptMediaInsert("video");
          if (!value) {
            return;
          }
          richEditorRef.current?.insertContent(value);
        }
        break;
      case "audio":
        {
          const value = promptMediaInsert("audio");
          if (!value) {
            return;
          }
          richEditorRef.current?.insertContent(value);
        }
        break;
      case "transcribe-media":
        {
          const value = promptMediaInsert("transcribe-media");
          if (!value) {
            return;
          }
          richEditorRef.current?.insertContent(value);
        }
        break;
      case "code-block":
        richEditorRef.current?.toggleCodeBlock();
        break;
      case "formula":
        richEditorRef.current?.insertContent("$$\n\n$$");
        break;
      case "event":
        openCreateEventDialog({
          linkedNoteId: activeNote?.id ?? null,
          origin: {
            editor: "rich",
            richRange: typedRange
          }
        });
        setSlashMenu(null);
        return;
      case "current-date":
        richEditorRef.current?.insertContent(new Date().toLocaleDateString());
        break;
      case "current-time":
        richEditorRef.current?.insertContent(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        break;
      default:
        setToastMessage(`"${command.label}" is planned`);
        return;
    }

    setSlashMenu(null);
  }

  function commitSlashCommand(index: number): void {
    const command = slashResults[index];
    if (!command) {
      return;
    }

    if ((slashMenu?.editor ?? editorMode) === "rich") {
      applyRichSlashCommand(command);
      return;
    }

    applyMarkdownSlashCommand(command);
  }

  const editorMainStyle = {
    "--tag-pane-height": `${tagPaneHeight}px`
  } as CSSProperties;

  return (
    <div
      className="app-shell"
      role="application"
      aria-label="PKM OpenSource Shell"
      onClick={() => {
        setContextMenu(null);
        setNoteListMenu(null);
        setNotebookMenu(null);
        setEditorContextMenu(null);
        setDraggingNotebook(null);
        setStackDropTarget(null);
        setNoteHistoryDialog(null);
        setFilesDialogOpen(false);
        setCalendarDialogOpen(false);
        setEventDialog(null);
        setAttachmentDropTarget(null);
        setSlashMenu(null);
        setMentionSuggestion(null);
      }}
    >
      <aside className="left-sidebar" style={{ width: sidebarWidth }}>
        <div className="sidebar-search" onClick={() => setSearchOpen(true)}>
          <span>Search</span>
          <kbd>cmd+k/p</kbd>
        </div>

        <div className="sidebar-actions">
          <button type="button" className="new-note" onClick={createNewNote}>
            + Note
          </button>
          <button type="button" className="round-action" aria-label="Quick actions" onClick={openCommandPalette}>
            +
          </button>
          <button type="button" className="round-action" aria-label="Create task" onClick={quickCreateTask}>
            T
          </button>
          <button
            type="button"
            className="round-action"
            aria-label="More actions"
            onClick={() => {
              setSearchScope("everywhere");
              setSearchFilters([]);
              setQuickQuery("");
              setSearchOpen(true);
            }}
          >
            ...
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidePinned.map((item) => (
            <button
              key={item}
              type="button"
              className={
                (item === "Home" &&
                  sidebarView === "notes" &&
                  browseMode === "home" &&
                  !tasksDialogOpen &&
                  !filesDialogOpen &&
                  !calendarDialogOpen) ||
                (item === "Notes" &&
                  sidebarView === "notes" &&
                  browseMode === "all" &&
                  !tasksDialogOpen &&
                  !filesDialogOpen &&
                  !calendarDialogOpen) ||
                (item === "Shortcuts" &&
                  sidebarView === "notes" &&
                  browseMode === "shortcuts" &&
                  !tasksDialogOpen &&
                  !filesDialogOpen &&
                  !calendarDialogOpen) ||
                (item === "Tasks" && sidebarView === "tasks") ||
                (item === "Files" && filesDialogOpen) ||
                (item === "Calendar" && calendarDialogOpen) ||
                (item === "Templates" &&
                  browseMode === "templates" &&
                  !filesDialogOpen &&
                  !tasksDialogOpen &&
                  !calendarDialogOpen)
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={() => {
                if (item === "Home") {
                  setSidebarView("notes");
                  setBrowseMode("home");
                  setSelectedNotebook("All Notes");
                  setTasksDialogOpen(false);
                  setFilesDialogOpen(false);
                  setCalendarDialogOpen(false);
                  return;
                }
                if (item === "Notes") {
                  setSidebarView("notes");
                  setBrowseMode("all");
                  setTasksDialogOpen(false);
                  setFilesDialogOpen(false);
                  setCalendarDialogOpen(false);
                  return;
                }
                if (item === "Tasks") {
                  setSidebarView("tasks");
                  setTasksDialogOpen(true);
                  setFilesDialogOpen(false);
                  setCalendarDialogOpen(false);
                  return;
                }
                if (item === "Shortcuts") {
                  setSidebarView("notes");
                  setBrowseMode("shortcuts");
                  setSelectedNotebook("All Notes");
                  setTasksDialogOpen(false);
                  setFilesDialogOpen(false);
                  setCalendarDialogOpen(false);
                  return;
                }
                if (item === "Files") {
                  setSidebarView("notes");
                  setTasksDialogOpen(false);
                  setFilesDialogOpen(true);
                  setCalendarDialogOpen(false);
                  return;
                }
                if (item === "Calendar") {
                  setSidebarView("calendar");
                  setTasksDialogOpen(false);
                  setFilesDialogOpen(false);
                  setCalendarDialogOpen(true);
                  return;
                }
                if (item === "Templates") {
                  setSidebarView("notes");
                  setBrowseMode("templates");
                  setSelectedNotebook("All Notes");
                  setTasksDialogOpen(false);
                  setFilesDialogOpen(false);
                  setCalendarDialogOpen(false);
                  return;
                }
                setToastMessage(`"${item}" is planned`);
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <section className="sidebar-section">
          <h2>Recent notes</h2>
          {recentNotes.length ? (
            <ul className="shortcut-list">
              {recentNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className="recent-item"
                    onClick={() => {
                      setSelectedNotebook(note.notebook);
                      focusNote(note.id);
                    }}
                  >
                    <span>{note.title}</span>
                    <small>{formatRelativeTime(note.updatedAt)}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shortcut-empty">No recent notes yet</p>
          )}
        </section>

        <section className="sidebar-section">
          <h2>Shortcuts</h2>
          {shortcutNotes.length ? (
            <ul className="shortcut-list">
              {shortcutNotes.map((note) => (
                <li key={note.id} className="shortcut-row">
                  <button
                    type="button"
                    className="shortcut-item"
                    onClick={() => {
                      setSelectedNotebook(note.notebook);
                      focusNote(note.id);
                    }}
                  >
                    <span>{note.title}</span>
                    <small>{note.notebook}</small>
                  </button>
                  <button
                    type="button"
                    className="shortcut-remove"
                    aria-label={`Remove shortcut ${note.title}`}
                    onClick={() => removeShortcut(note.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shortcut-empty">No shortcuts yet</p>
          )}
        </section>

        <section className="sidebar-section">
          <h2>Saved Searches</h2>
          {savedSearches.length ? (
            <ul className="shortcut-list">
              {savedSearches.map((saved) => (
                <li key={saved.id} className="shortcut-row">
                  <button type="button" className="shortcut-item" onClick={() => openSavedSearch(saved)}>
                    <span>{saved.label}</span>
                    <small>{saved.scope === "current" ? `In ${selectedNotebook}` : "Everywhere"}</small>
                  </button>
                  <span className="shortcut-actions">
                    <button
                      type="button"
                      className="shortcut-remove"
                      aria-label={`Edit saved search ${saved.label}`}
                      onClick={() => editSavedSearch(saved.id)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="shortcut-remove"
                      aria-label={`Remove saved search ${saved.label}`}
                      onClick={() => removeSavedSearch(saved.id)}
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shortcut-empty">No saved searches yet</p>
          )}
        </section>

        <section className="sidebar-section">
          <h2>Pinned to Home</h2>
          {homePinnedNotes.length ? (
            <ul className="shortcut-list">
              {homePinnedNotes.map((note) => (
                <li key={note.id} className="shortcut-row">
                  <button
                    type="button"
                    className="shortcut-item"
                    onClick={() => {
                      setSelectedNotebook(note.notebook);
                      focusNote(note.id);
                    }}
                  >
                    <span>{note.title}</span>
                    <small>{note.notebook}</small>
                  </button>
                  <button
                    type="button"
                    className="shortcut-remove"
                    aria-label={`Unpin from home ${note.title}`}
                    onClick={() => removePinnedNote(note.id, "home")}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shortcut-empty">No Home pins yet</p>
          )}
        </section>

        <section className="sidebar-section">
          <h2>{selectedNotebook === "All Notes" ? "Pinned to Notebook" : `Pinned in ${selectedNotebook}`}</h2>
          {selectedNotebook === "All Notes" ? (
            <p className="shortcut-empty">Select a notebook to view notebook pins</p>
          ) : notebookPinnedNotes.length ? (
            <ul className="shortcut-list">
              {notebookPinnedNotes.map((note) => (
                <li key={note.id} className="shortcut-row">
                  <button
                    type="button"
                    className="shortcut-item"
                    onClick={() => {
                      setSelectedNotebook(note.notebook);
                      focusNote(note.id);
                    }}
                  >
                    <span>{note.title}</span>
                    <small>{formatRelativeTime(note.updatedAt)}</small>
                  </button>
                  <button
                    type="button"
                    className="shortcut-remove"
                    aria-label={`Unpin from notebook ${note.title}`}
                    onClick={() => removePinnedNote(note.id, "notebook")}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="shortcut-empty">No notebook pins yet</p>
          )}
        </section>

        <section className="sidebar-section">
          <h2>Notebooks</h2>
          <ul>
            {stackedNotebookGroups.stacks.map((group) => {
              const isCollapsed = collapsedStacks.has(group.stack);
              const isStackDrop = stackDropTarget === group.stack;
              return (
                <li key={group.stack} className="stack-group">
                  <button
                    type="button"
                    className={isStackDrop ? "stack-header drop-active" : "stack-header"}
                    onClick={() => toggleStackCollapsed(group.stack)}
                    title={isCollapsed ? "Expand stack" : "Collapse stack"}
                    onDragOver={(event) => {
                      if (!draggingNotebook) {
                        return;
                      }
                      event.preventDefault();
                      setStackDropTarget(group.stack);
                    }}
                    onDragLeave={() => setStackDropTarget((previous) => (previous === group.stack ? null : previous))}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!draggingNotebook) {
                        return;
                      }
                      assignNotebookToStack(draggingNotebook, group.stack);
                      setDraggingNotebook(null);
                      setStackDropTarget(null);
                    }}
                  >
                    <span>{isCollapsed ? "▸" : "▾"} {group.stack}</span>
                    <small>{group.notebooks.length}</small>
                  </button>
                  {!isCollapsed ? <ul>{group.notebooks.map((notebook) => renderNotebookRow(notebook, true))}</ul> : null}
                </li>
              );
            })}
            {stackedNotebookGroups.unstacked.map((notebook) => renderNotebookRow(notebook))}
          </ul>
          <button type="button" className="sidebar-subaction" onClick={createNotebook}>
            + New notebook
          </button>
        </section>
      </aside>

      <div
        className="pane-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        onMouseDown={(event) => startPaneResize("sidebar", event.clientX)}
        onDoubleClick={() => setSidebarWidth(240)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudgePaneWidth("sidebar", "decrease");
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            nudgePaneWidth("sidebar", "increase");
          }
        }}
      />

      <section className="note-column" style={{ width: listWidth }}>
        <header className="note-column-header">
          <div>
            <h1>
              {browseMode === "home"
                ? "Home"
                : browseMode === "templates"
                  ? "Templates"
                  : browseMode === "shortcuts"
                    ? "Shortcuts"
                    : selectedNotebook}
            </h1>
            <small>{browseMode === "home" ? "Dashboard" : visibleNotes.length}</small>
          </div>
          {browseMode !== "home" ? (
            <div className="header-actions">
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode((previous) => (previous === "cards" ? "list" : "cards"))}
              >
                {viewMode === "cards" ? "Cards" : "List"}
              </button>
              <button
                type="button"
                className={noteDensity === "compact" ? "active" : ""}
                onClick={() => setNoteDensity((previous) => (previous === "comfortable" ? "compact" : "comfortable"))}
              >
                {noteDensity === "comfortable" ? "Comfortable" : "Compact"}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  openNoteListMenu("sort", rect.left, rect.bottom + 8);
                }}
              >
                Sort
              </button>
              <button
                type="button"
                className={tagFilters.length ? "active" : ""}
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  openNoteListMenu("filter", rect.left, rect.bottom + 8);
                }}
              >
                Filter
              </button>
            </div>
          ) : null}
        </header>
        {browseMode === "home" ? (
          <div className="home-dashboard" aria-label="Home dashboard">
            <section className="home-panel">
              <header>
                <h2>Scratch pad</h2>
                <div className="home-panel-actions">
                  <small>{homeScratchPad.trim().length ? "Unsaved" : "Empty"}</small>
                  <button type="button" onClick={createNoteFromScratchPad}>
                    Save to note
                  </button>
                </div>
              </header>
              <div className="home-scratchpad-wrap">
                <textarea
                  className="home-scratchpad"
                  placeholder="Capture quick thoughts, todos, or links..."
                  value={homeScratchPad}
                  onChange={(event) => setHomeScratchPad(event.target.value)}
                />
              </div>
            </section>
            <section className="home-panel">
              <header>
                <h2>Pinned to Home</h2>
                <small>{homePinnedNotes.length}</small>
              </header>
              {homePinnedNotes.length ? (
                <ul className="home-list">
                  {homePinnedNotes.map((note) => (
                    <li key={note.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setBrowseMode("all");
                          setSelectedNotebook(note.notebook);
                          focusNote(note.id);
                        }}
                      >
                        <strong>{note.title}</strong>
                        <small>{note.notebook}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-empty">No Home pins yet</p>
              )}
            </section>
            <section className="home-panel">
              <header>
                <h2>Recent notes</h2>
                <small>{homeRecentNotes.length}</small>
              </header>
              {homeRecentNotes.length ? (
                <ul className="home-list">
                  {homeRecentNotes.map((note) => (
                    <li key={note.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setBrowseMode("all");
                          setSelectedNotebook(note.notebook);
                          focusNote(note.id);
                        }}
                      >
                        <strong>{note.title}</strong>
                        <small>{formatRelativeTime(note.updatedAt)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-empty">No recent notes yet</p>
              )}
            </section>
            <section className="home-panel">
              <header>
                <h2>Open tasks</h2>
                <small>{openTasks.length}</small>
              </header>
              {openTasks.length ? (
                <ul className="home-list">
                  {openTasks.slice(0, 8).map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setBrowseMode("all");
                          setSelectedNotebook(task.notebook);
                          focusNote(task.noteId);
                        }}
                      >
                        <strong>{task.text}</strong>
                        <small>{task.noteTitle}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-empty">No open tasks</p>
              )}
            </section>
            <section className="home-panel">
              <header>
                <h2>Upcoming events</h2>
                <small>{upcomingCalendarEvents.length}</small>
              </header>
              {upcomingCalendarEvents.length ? (
                <ul className="home-list">
                  {upcomingCalendarEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => {
                          openEditEventDialog(event.id);
                          setSidebarView("calendar");
                          setCalendarDialogOpen(true);
                        }}
                      >
                        <strong>{event.title}</strong>
                        <small>{formatCalendarTimeRange(event)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-empty">No upcoming events</p>
              )}
            </section>
            <section className="home-panel">
              <header>
                <h2>Notebooks</h2>
                <small>{notebookList.length}</small>
              </header>
              <div className="home-chip-list">
                {notebookList.map((notebook) => (
                  <button
                    key={notebook}
                    type="button"
                    onClick={() => {
                      setBrowseMode("all");
                      setSelectedNotebook(notebook);
                      setTagFilters([]);
                    }}
                  >
                    {notebook}
                  </button>
                ))}
              </div>
            </section>
            <section className="home-panel">
              <header>
                <h2>Saved searches</h2>
                <small>{savedSearches.length}</small>
              </header>
              {savedSearches.length ? (
                <ul className="home-list">
                  {savedSearches.slice(0, 8).map((saved) => (
                    <li key={saved.id}>
                      <button type="button" onClick={() => openSavedSearch(saved)}>
                        <strong>{saved.label}</strong>
                        <small>{saved.scope === "current" ? `In ${selectedNotebook}` : "Everywhere"}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="home-empty">No saved searches yet</p>
              )}
            </section>
            <section className="home-panel">
              <header>
                <h2>Tags</h2>
                <small>{homeTagSuggestions.length}</small>
              </header>
              {homeTagSuggestions.length ? (
                <div className="home-chip-list">
                  {homeTagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setBrowseMode("all");
                        setSelectedNotebook("All Notes");
                        setTagFilters([tag]);
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="home-empty">No tags yet</p>
              )}
            </section>
          </div>
        ) : (
          <>
            {tagFilters.length ? (
              <div className="active-filters">
                <span>Filters:</span>
                {tagFilters.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleTagFilter(tag)}>
                    #{tag} ×
                  </button>
                ))}
                <button type="button" className="clear" onClick={() => setTagFilters([])}>
                  Clear
                </button>
              </div>
            ) : null}

            <div
              className={viewMode === "list" ? `note-grid list-mode ${noteDensity}` : `note-grid ${noteDensity}`}
              aria-label="Notes list"
            >
              {visibleNotes.map((note) => {
                const isSelected = selectedIds.has(note.id);
                const showQuickAction = hoveredCardId === note.id || isSelected;
                const homePinned = homePinnedSet.has(note.id);
                const notebookPinned = notebookPinnedSet.has(note.id);
                return (
                  <button
                    key={note.id}
                    type="button"
                    draggable
                    onMouseEnter={() => setHoveredCardId(note.id)}
                    onMouseLeave={() => setHoveredCardId((previous) => (previous === note.id ? null : previous))}
                    onDragStart={() => setDraggingNoteId(note.id)}
                    onDragEnd={() => {
                      setDraggingNoteId(null);
                      setDropNotebook(null);
                    }}
                    className={isSelected ? "note-card selected" : "note-card"}
                    onClick={(event) => onCardClick(note.id, event)}
                    onDoubleClick={() => focusNote(note.id)}
                    onContextMenu={(event) => {
                      event.preventDefault();
                      openCardMenu(note.id, event.clientX, event.clientY);
                    }}
                  >
                    <span className="note-card-actions">
                      {showQuickAction ? (
                        <span
                          className="note-card-menu"
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            openCardMenu(note.id, event.clientX, event.clientY);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              const target = event.currentTarget.getBoundingClientRect();
                              openCardMenu(note.id, target.left, target.bottom + 6);
                            }
                          }}
                        >
                          ...
                        </span>
                      ) : null}
                    </span>
                    <strong>{note.title}</strong>
                    <p>{note.snippet || "Untitled"}</p>
                    <footer>
                      <span>{formatRelativeTime(note.updatedAt)}</span>
                      {note.isTemplate ? <span className="note-pin">Template</span> : null}
                      {homePinned ? <span className="note-pin">Home pin</span> : null}
                      {notebookPinned ? <span className="note-pin">Notebook pin</span> : null}
                      {viewMode === "list" ? <span>{note.notebook}</span> : null}
                      {isSelected ? <em>{selectedIds.size > 1 ? "Multi" : "Selected"}</em> : null}
                    </footer>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div
        className="pane-resizer"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize note list"
        aria-valuemin={MIN_LIST_WIDTH}
        aria-valuemax={MAX_LIST_WIDTH}
        aria-valuenow={listWidth}
        tabIndex={0}
        onMouseDown={(event) => startPaneResize("list", event.clientX)}
        onDoubleClick={() => setListWidth(520)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudgePaneWidth("list", "decrease");
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            nudgePaneWidth("list", "increase");
          }
        }}
      />

      <main className="editor-shell">
        {activeNote ? (
          <>
            <header className="editor-topbar">
              <div className="crumbs">
                <span>{activeNote.notebook}</span>
                <span>{draftPreview.title}</span>
              </div>
              <div className="editor-top-actions">
                <button
                  type="button"
                  className={metadataOpen ? "link-btn active" : "link-btn"}
                  onClick={() => {
                    setMetadataOpen((previous) => !previous);
                    setAiPanelOpen(false);
                  }}
                >
                  Info
                </button>
                <button type="button" className="share-btn">
                  Share
                </button>
                <button type="button" className="link-btn">
                  Link
                </button>
                <button type="button" className={aiPanelOpen ? "link-btn active" : "link-btn"} onClick={toggleAiPanel}>
                  AI
                </button>
                <button type="button" className="link-btn" onClick={cycleTheme}>
                  Theme
                </button>
                <button
                  ref={editorMenuButtonRef}
                  type="button"
                  className="link-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditorMenu();
                  }}
                >
                  ...
                </button>
              </div>
            </header>

            <div className="editor-toolbar">
              <button
                type="button"
                className={editorMode === "markdown" ? "active" : ""}
                onClick={() => setEditorMode("markdown")}
              >
                Markdown
              </button>
              <button
                type="button"
                className={editorMode === "rich" ? "active" : ""}
                onClick={() => {
                  setEditorMode("rich");
                  window.requestAnimationFrame(() => richEditorRef.current?.focus());
                }}
              >
                Rich
              </button>
              <span className="toolbar-divider" />
              <button type="button" onClick={openSlashMenuFromInsert}>
                Insert
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editorMode === "rich") {
                    richEditorRef.current?.setParagraph();
                  }
                }}
              >
                Aa
              </button>
              <button type="button">Sans Serif</button>
              <button type="button">15</button>
              <button type="button" onClick={() => runRichToolbarAction("bold")}>
                B
              </button>
              <button type="button" onClick={() => runRichToolbarAction("italic")}>
                I
              </button>
              <button type="button" onClick={() => runRichToolbarAction("underline")}>
                U
              </button>
              <button type="button" onClick={() => runRichToolbarAction("bullet")}>
                List
              </button>
              <button type="button" onClick={() => runRichToolbarAction("link")}>
                Link
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editorMode === "rich") {
                    richEditorRef.current?.toggleCodeBlock();
                  }
                }}
              >
                More
              </button>
              <span className={`save-pill ${saveState}`}>
                {saveState === "dirty" ? "Unsaved" : saveState} · {vaultMode}
              </span>
            </div>

            {activeNote.isTemplate ? (
              <div className="template-banner">
                <span>You are editing your "{draftPreview.title}" template</span>
                <button type="button" onClick={() => void useTemplateNote(activeNote)}>
                  Use this template
                </button>
              </div>
            ) : null}

            <div ref={editorMainRef} className="editor-main" style={editorMainStyle}>
              <article className={metadataOpen || aiPanelOpen ? "editor-content with-metadata" : "editor-content"}>
              <div className="editor-workbench">
                {editorMode === "markdown" ? (
                  <section
                    className={attachmentDropTarget === "markdown" ? "markdown-pane drop-active" : "markdown-pane"}
                    aria-label="Markdown editor"
                  >
                    <h3>Markdown</h3>
                    <textarea
                      ref={markdownEditorRef}
                      className="markdown-editor"
                      value={draftMarkdown}
                      onChange={(event) => {
                        setDraftMarkdown(event.target.value);
                        syncLinkSuggestion(event.target.value, event.target.selectionStart);
                        syncMentionSuggestion(event.target.value, event.target.selectionStart);
                        syncSlashSuggestion(event.target.value, event.target.selectionStart);
                      }}
                      onClick={(event) => {
                        const target = event.currentTarget;
                        syncLinkSuggestion(target.value, target.selectionStart);
                        syncMentionSuggestion(target.value, target.selectionStart);
                        syncSlashSuggestion(target.value, target.selectionStart);
                      }}
                      onKeyUp={(event) => {
                        const target = event.currentTarget;
                        syncLinkSuggestion(target.value, target.selectionStart);
                        syncMentionSuggestion(target.value, target.selectionStart);
                        syncSlashSuggestion(target.value, target.selectionStart);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        openEditorContextMenu(event.clientX, event.clientY);
                      }}
                      onDragOver={(event) => {
                        if (!event.dataTransfer?.files?.length) {
                          return;
                        }
                        event.preventDefault();
                        setAttachmentDropTarget("markdown");
                      }}
                      onDragLeave={() => setAttachmentDropTarget((previous) => (previous === "markdown" ? null : previous))}
                      onDrop={async (event) => {
                        event.preventDefault();
                        setAttachmentDropTarget(null);
                        const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
                        await insertAttachmentFiles(files, "markdown");
                      }}
                      onPaste={async (event) => {
                        const files = event.clipboardData?.files ? Array.from(event.clipboardData.files) : [];
                        if (!files.length) {
                          return;
                        }
                        event.preventDefault();
                        await insertAttachmentFiles(files, "markdown");
                      }}
                      onKeyDown={(event) => {
                        if (slashMenu?.editor === "markdown") {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            setSlashMenu(null);
                            return;
                          }

                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setSlashMenu((previous) => {
                              if (!previous) {
                                return previous;
                              }
                              const max = Math.max(0, slashResults.length - 1);
                              return { ...previous, selected: Math.min(previous.selected + 1, max) };
                            });
                            return;
                          }

                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setSlashMenu((previous) =>
                              previous ? { ...previous, selected: Math.max(previous.selected - 1, 0) } : previous
                            );
                            return;
                          }

                          if (event.key === "Tab" || event.key === "Enter") {
                            event.preventDefault();
                            commitSlashCommand(slashMenu.selected);
                            return;
                          }
                        }

                        if (linkSuggestion) {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            setLinkSuggestion(null);
                            return;
                          }

                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setLinkSuggestion((previous) => {
                              if (!previous) {
                                return previous;
                              }
                              const limit = Math.max(0, suggestions.length - 1);
                              return { ...previous, selected: Math.min(previous.selected + 1, limit) };
                            });
                            return;
                          }

                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setLinkSuggestion((previous) =>
                              previous ? { ...previous, selected: Math.max(previous.selected - 1, 0) } : previous
                            );
                            return;
                          }

                          if (event.key === "Tab" || event.key === "Enter") {
                            event.preventDefault();
                            commitLinkSuggestion(linkSuggestion.selected);
                            return;
                          }
                        }

                        if (mentionSuggestion) {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            setMentionSuggestion(null);
                            return;
                          }

                          if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setMentionSuggestion((previous) => {
                              if (!previous) {
                                return previous;
                              }
                              const max = Math.max(0, mentionResults.length - 1);
                              return { ...previous, selected: Math.min(previous.selected + 1, max) };
                            });
                            return;
                          }

                          if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setMentionSuggestion((previous) =>
                              previous ? { ...previous, selected: Math.max(previous.selected - 1, 0) } : previous
                            );
                            return;
                          }

                          if (event.key === "Tab" || event.key === "Enter") {
                            event.preventDefault();
                            commitMentionSuggestion(mentionSuggestion.selected);
                          }
                        }
                      }}
                    />
                    {linkSuggestion ? (
                      <div className="wikilink-suggest" role="listbox" aria-label="Wikilink suggestions">
                        {suggestions.map((note, index) => (
                          <button
                            key={note.id}
                            type="button"
                            className={index === linkSuggestion.selected ? "active" : ""}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              commitLinkSuggestion(index);
                            }}
                          >
                            {note.title}
                            <small>{note.notebook}</small>
                          </button>
                        ))}
                        {linkSuggestion.query.trim() && !suggestions.length ? (
                          <button
                            type="button"
                            className="create-link"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              commitLinkSuggestion(0);
                            }}
                          >
                            Create "{linkSuggestion.query.trim()}"
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {!linkSuggestion && mentionSuggestion ? (
                      <div className="mention-suggest" role="listbox" aria-label="Mention suggestions">
                        {mentionResults.map((entry, index) => (
                          <button
                            key={entry.id}
                            type="button"
                            className={index === mentionSuggestion.selected ? "active" : ""}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              commitMentionSuggestion(index);
                            }}
                          >
                            <span>{entry.label}</span>
                            <small>{mentionSuggestion.kind === "tag" ? "Tag" : "Date"}</small>
                          </button>
                        ))}
                        {mentionSuggestion.kind === "tag" && mentionSuggestion.query.trim() && !mentionResults.length ? (
                          <button
                            type="button"
                            className="create-link"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              commitMentionSuggestion(0);
                            }}
                          >
                            Create #{mentionSuggestion.query.trim().replace(/^#/, "")}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                ) : (
                  <section
                    className={attachmentDropTarget === "rich" ? "markdown-pane rich-pane drop-active" : "markdown-pane rich-pane"}
                    aria-label="Rich editor"
                    onDragOver={(event) => {
                      if (!event.dataTransfer?.files?.length) {
                        return;
                      }
                      event.preventDefault();
                      setAttachmentDropTarget("rich");
                    }}
                    onDragLeave={() => setAttachmentDropTarget((previous) => (previous === "rich" ? null : previous))}
                    onDrop={async (event) => {
                      event.preventDefault();
                      setAttachmentDropTarget(null);
                      const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
                      await insertAttachmentFiles(files, "rich");
                    }}
                    onPaste={async (event) => {
                      const files = event.clipboardData?.files ? Array.from(event.clipboardData.files) : [];
                      if (!files.length) {
                        return;
                      }
                      event.preventDefault();
                      await insertAttachmentFiles(files, "rich");
                    }}
                  >
                    <h3>Rich text</h3>
                    <RichMarkdownEditor
                      ref={richEditorRef}
                      markdown={draftMarkdown}
                      onMarkdownChange={(nextMarkdown) => setDraftMarkdown(nextMarkdown)}
                      onSlashQueryChange={syncRichSlashSuggestion}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        openEditorContextMenu(event.clientX, event.clientY);
                      }}
                    />
                  </section>
                )}

                <section className="preview-pane" aria-label="Rendered preview">
                  <h3>Preview</h3>
                  <div className="preview-document">
                    <h2>{draftPreview.title}</h2>
                    {draftPreview.body.map((line, index) => {
                      const key = `${line}-${index}`;

                      if (!line.trim()) {
                        return <div key={key} className="line-space" />;
                      }

                      if (line.startsWith("## ")) {
                        return <h4 key={key}>{line.slice(3)}</h4>;
                      }

                      if (line.startsWith("- [ ] ")) {
                        return (
                          <p key={key} className="task-line">
                            <span>[ ]</span>
                            {renderInlineWithLinks(line.slice(6))}
                          </p>
                        );
                      }

                      if (line.startsWith("- ")) {
                        return (
                          <p key={key} className="bullet-line">
                            <span>-</span>
                            {renderInlineWithLinks(line.slice(2))}
                          </p>
                        );
                      }

                      return <p key={key}>{renderInlineWithLinks(line)}</p>;
                    })}

                    <div className="link-sections">
                      <section>
                        <h5>Outgoing links</h5>
                        <ul>
                          {outgoingLinks.length ? (
                            outgoingLinks.map((entry, index) => (
                              <li key={`${entry.title}-${index}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (entry.target) {
                                      focusNote(entry.target.id);
                                    } else {
                                      const created = ensureLinkedNote(entry.title);
                                      focusNote(created.id);
                                    }
                                  }}
                                >
                                  {entry.title}
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="muted">No outgoing links</li>
                          )}
                        </ul>
                      </section>
                      <section>
                        <h5>Backlinks</h5>
                        <ul>
                          {backlinks.length ? (
                            backlinks.map((entry) => (
                              <li key={entry.id}>
                                <button type="button" onClick={() => focusNote(entry.id)}>
                                  {entry.title}
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="muted">No backlinks yet</li>
                          )}
                        </ul>
                      </section>
                      <section>
                        <h5>Linked events</h5>
                        <ul>
                          {eventReferences.length ? (
                            eventReferences.map((entry, index) => (
                              <li key={`${entry.id}-${index}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (entry.event) {
                                      openEditEventDialog(entry.event.id);
                                    }
                                    setSidebarView("calendar");
                                    setCalendarDialogOpen(true);
                                  }}
                                >
                                  {entry.event?.title ?? entry.title}
                                </button>
                              </li>
                            ))
                          ) : (
                            <li className="muted">No linked events</li>
                          )}
                        </ul>
                      </section>
                    </div>
                  </div>
                </section>
              </div>

              {slashMenu ? (
                <section className="slash-menu" onMouseDown={(event) => event.preventDefault()}>
                  <header>
                    <span>/ {slashMenu.query || "commands"}</span>
                    <small>{slashResults.length} results</small>
                  </header>
                  <div className="slash-menu-list">
                    {slashResults.length ? (
                      slashSections.map(([section, commands]) => (
                        <div key={section} className="slash-group">
                          <h4>{section}</h4>
                          {commands.map((command) => {
                            const globalIndex = slashResults.findIndex((item) => item.id === command.id);
                            return (
                              <button
                                key={command.id}
                                type="button"
                                className={slashMenu.selected === globalIndex ? "active" : ""}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  commitSlashCommand(globalIndex);
                                }}
                              >
                                {command.label}
                              </button>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <p className="slash-empty">No commands found</p>
                    )}
                  </div>
                </section>
              ) : null}

              {aiPanelOpen ? (
                <aside className="metadata-panel ai-panel">
                  <header>
                    <h4>AI Copilot</h4>
                    <button type="button" onClick={() => setAiPanelOpen(false)}>
                      Close
                    </button>
                  </header>
                  <div className="ai-body">
                    <div className="ai-toolbar">
                      <button type="button" onClick={() => setAiShowSettings((previous) => !previous)}>
                        {aiShowSettings ? "Hide settings" : "Settings"}
                      </button>
                      <button type="button" onClick={clearAiChat}>
                        Clear chat
                      </button>
                    </div>
                    {aiShowSettings ? (
                      <section className="ai-settings">
                        <label>
                          <span>Provider</span>
                          <div className="ai-provider-row">
                            <select
                              value={aiSettings.provider}
                              onChange={(event) => applyAiProvider(event.target.value as AiProvider)}
                            >
                              {aiProviders.map((provider) => (
                                <option key={provider} value={provider}>
                                  {aiProviderLabel(provider)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const defaults = aiProviderDefaults(aiSettings.provider);
                                setAiSettings((previous) => ({
                                  ...previous,
                                  baseUrl: defaults.baseUrl,
                                  model: defaults.model
                                }));
                                setAiModels([]);
                                setAiConnectionState(null);
                              }}
                            >
                              Reset
                            </button>
                          </div>
                          <small>{aiProviderHint(aiSettings.provider)}</small>
                        </label>
                        <label>
                          <span>Base URL</span>
                          <input
                            value={aiSettings.baseUrl}
                            placeholder={currentAiProviderDefaults.baseUrl}
                            onChange={(event) => {
                              setAiSettings({ ...aiSettings, baseUrl: event.target.value });
                              setAiConnectionState(null);
                            }}
                          />
                        </label>
                        <label>
                          <span>Model</span>
                          <input
                            list={aiModels.length ? "ai-model-options" : undefined}
                            value={aiSettings.model}
                            placeholder={currentAiProviderDefaults.model}
                            onChange={(event) => {
                              setAiSettings({ ...aiSettings, model: event.target.value });
                              setAiConnectionState(null);
                            }}
                          />
                          {aiModels.length ? (
                            <datalist id="ai-model-options">
                              {aiModels.map((model) => (
                                <option key={model} value={model} />
                              ))}
                            </datalist>
                          ) : null}
                        </label>
                        <label>
                          <span>API key {aiKeyOptional ? "(optional)" : ""}</span>
                          <input
                            type="password"
                            value={aiSettings.apiKey}
                            placeholder={currentAiProviderDefaults.apiKeyPlaceholder}
                            onChange={(event) => {
                              setAiSettings({ ...aiSettings, apiKey: event.target.value });
                              setAiConnectionState(null);
                            }}
                          />
                        </label>
                        <div className="ai-settings-actions">
                          <button
                            type="button"
                            onClick={() => void testAiConnection()}
                            disabled={aiBusy || aiConnectionBusy || aiModelFetchBusy}
                          >
                            {aiConnectionBusy ? "Testing..." : "Test connection"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void fetchAiModels()}
                            disabled={aiBusy || aiConnectionBusy || aiModelFetchBusy}
                          >
                            {aiModelFetchBusy ? "Fetching..." : "Fetch models"}
                          </button>
                        </div>
                        {aiConnectionState ? (
                          <p className={`ai-connection ${aiConnectionState.tone}`}>{aiConnectionState.message}</p>
                        ) : null}
                        <label>
                          <span>Temperature</span>
                          <input
                            type="number"
                            min={0}
                            max={1.5}
                            step={0.1}
                            value={aiSettings.temperature}
                            onChange={(event) =>
                              setAiSettings({
                                ...aiSettings,
                                temperature: Number.parseFloat(event.target.value) || 0
                              })
                            }
                          />
                        </label>
                        <label>
                          <span>Related notes</span>
                          <input
                            type="number"
                            min={1}
                            max={8}
                            value={aiSettings.relatedCount}
                            onChange={(event) =>
                              setAiSettings({
                                ...aiSettings,
                                relatedCount: Math.max(1, Math.min(8, Number.parseInt(event.target.value || "1", 10)))
                              })
                            }
                          />
                        </label>
                        <label className="ai-toggle">
                          <input
                            type="checkbox"
                            checked={aiSettings.includeActiveNote}
                            onChange={(event) =>
                              setAiSettings({ ...aiSettings, includeActiveNote: event.target.checked })
                            }
                          />
                          Include active note
                        </label>
                        <label className="ai-toggle">
                          <input
                            type="checkbox"
                            checked={aiSettings.includeRelatedNotes}
                            onChange={(event) =>
                              setAiSettings({ ...aiSettings, includeRelatedNotes: event.target.checked })
                            }
                          />
                          Include related notes
                        </label>
                        <label>
                          <span>System prompt</span>
                          <textarea
                            value={aiSettings.systemPrompt}
                            onChange={(event) => setAiSettings({ ...aiSettings, systemPrompt: event.target.value })}
                          />
                        </label>
                      </section>
                    ) : null}
                    <div className="ai-chat-log">
                      {aiMessages.length ? (
                        aiMessages.map((message) => (
                          <article key={message.id} className={message.role === "user" ? "ai-msg user" : "ai-msg assistant"}>
                            <strong>{message.role === "user" ? "You" : "Copilot"}</strong>
                            <p>{message.content}</p>
                          </article>
                        ))
                      ) : (
                        <p className="history-empty">Ask questions about your notes.</p>
                      )}
                      {aiError ? <p className="ai-error">{aiError}</p> : null}
                    </div>
                    <form
                      className="ai-input"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitAiPrompt();
                      }}
                    >
                      <textarea
                        value={aiInput}
                        placeholder="Ask about this note or your vault..."
                        onChange={(event) => setAiInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            void submitAiPrompt();
                          }
                        }}
                      />
                      <button type="submit" disabled={aiBusy || !aiInput.trim()}>
                        {aiBusy ? "Thinking..." : "Send"}
                      </button>
                    </form>
                  </div>
                </aside>
              ) : null}

              {metadataOpen && activeNote ? (
                <aside className="metadata-panel">
                  <header>
                    <h4>Note metadata</h4>
                    <button type="button" onClick={() => setMetadataOpen(false)}>
                      Close
                    </button>
                  </header>
                  <dl>
                    <div>
                      <dt>Title</dt>
                      <dd>{draftPreview.title}</dd>
                    </div>
                    <div>
                      <dt>Notebook</dt>
                      <dd>{activeNote.notebook}</dd>
                    </div>
                    <div>
                      <dt>Path</dt>
                      <dd>{activeNote.path}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{new Date(activeNote.createdAt).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{new Date(activeNote.updatedAt).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Words</dt>
                      <dd>{draftWordCount}</dd>
                    </div>
                    <div>
                      <dt>Characters</dt>
                      <dd>{draftCharCount}</dd>
                    </div>
                    <div>
                      <dt>Outgoing</dt>
                      <dd>{outgoingLinks.length}</dd>
                    </div>
                    <div>
                      <dt>Backlinks</dt>
                      <dd>{backlinks.length}</dd>
                    </div>
                    <div>
                      <dt>Events</dt>
                      <dd>{eventReferences.length}</dd>
                    </div>
                    <div>
                      <dt>Tags</dt>
                      <dd>{activeNote.tags.length ? activeNote.tags.join(", ") : "No tags"}</dd>
                    </div>
                  </dl>
                </aside>
              ) : null}
              </article>

              <footer className="editor-footer">
              <button
                type="button"
                className="tag-pane-resizer"
                role="separator"
                tabIndex={0}
                aria-label="Resize tag pane"
                title="Drag to resize tags area"
                aria-orientation="horizontal"
                aria-valuemin={MIN_TAG_PANE_HEIGHT}
                aria-valuemax={MAX_TAG_PANE_HEIGHT}
                aria-valuenow={tagPaneHeight}
                onPointerDown={startTagPanePointerResize}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    nudgeTagPaneHeight("increase");
                  }
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    nudgeTagPaneHeight("decrease");
                  }
                }}
                onDoubleClick={() => setTagPaneHeight(DEFAULT_TAG_PANE_HEIGHT)}
              />
              <button
                type="button"
                onClick={() => {
                  setTagEditorOpen(true);
                  window.requestAnimationFrame(() => {
                    const input = document.getElementById("tag-input");
                    if (input instanceof HTMLInputElement) {
                      input.focus();
                    }
                  });
                }}
              >
                +
              </button>
              <button type="button" onClick={() => setTagEditorOpen((previous) => !previous)}>
                Add tag
              </button>
              <div className="tag-strip">
                {activeNote.tags.length ? (
                  activeNote.tags.map((tag) => (
                    <button key={tag} type="button" className="tag-chip" onClick={() => removeTagFromActiveNote(tag)}>
                      #{tag}
                    </button>
                  ))
                ) : (
                  <span className="tag-empty">No tags</span>
                )}
              </div>
              {tagEditorOpen ? (
                <form
                  className="tag-input-wrap"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addTagToActiveNote(tagInput);
                  }}
                >
                  <input
                    id="tag-input"
                    value={tagInput}
                    placeholder="new-tag"
                    onChange={(event) => setTagInput(event.target.value)}
                  />
                  <button type="submit">Save</button>
                </form>
              ) : null}
              </footer>
            </div>
          </>
        ) : (
          <p className="empty-editor">Select a note.</p>
        )}
      </main>

      {contextMenu ? (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {noteMenuRows.map((row) =>
            row.divider ? (
              <div key={row.id} className="context-divider" />
            ) : (
              <button key={row.id} type="button" onClick={() => handleMenuAction(row.id)}>
                <span>{getContextMenuLabel(row.id, row.label)}</span>
                {row.shortcut ? <small>{row.shortcut}</small> : null}
              </button>
            )
          )}
        </div>
      ) : null}

      {noteListMenu ? (
        <div
          className="context-menu note-list-menu"
          style={{ left: noteListMenu.x, top: noteListMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {noteListMenu.kind === "sort" ? (
            <>
              {sortModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={sortMode === mode.id ? "active" : ""}
                  onClick={() => {
                    setSortMode(mode.id);
                    setNoteListMenu(null);
                  }}
                >
                  <span>{mode.label}</span>
                </button>
              ))}
            </>
          ) : (
            <>
              {availableTags.length ? (
                availableTags.map((tag) => (
                  <button key={tag} type="button" onClick={() => toggleTagFilter(tag)}>
                    <span>{tagFilters.includes(tag) ? `#${tag} ✓` : `#${tag}`}</span>
                  </button>
                ))
              ) : (
                <div className="context-empty">No tags found</div>
              )}
              <div className="context-divider" />
              <button
                type="button"
                onClick={() => {
                  setTagFilters([]);
                  setNoteListMenu(null);
                }}
              >
                <span>Clear filters</span>
              </button>
            </>
          )}
        </div>
      ) : null}

      {editorContextMenu ? (
        <div
          className="context-menu editor-context-menu"
          style={{ left: editorContextMenu.x, top: editorContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {editorContextRows.map((row) =>
            row.divider ? (
              <div key={row.id} className="context-divider" />
            ) : (
              <button key={row.id} type="button" onClick={() => handleEditorContextAction(row.id)}>
                <span>{row.label}</span>
              </button>
            )
          )}
        </div>
      ) : null}

      {notebookMenu ? (
        <div
          className="context-menu notebook-menu"
          style={{ left: notebookMenu.x, top: notebookMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              setRenameDialog({ oldName: notebookMenu.notebook, newName: notebookMenu.notebook });
              setNotebookMenu(null);
            }}
          >
            <span>Rename notebook</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedNotebook(notebookMenu.notebook);
              setMoveDialog({ noteIds: Array.from(selectedIds), destination: notebookMenu.notebook, mode: "move" });
              setNotebookMenu(null);
            }}
          >
            <span>Move selected here</span>
          </button>
          <div className="context-divider" />
          <button
            type="button"
            onClick={() => {
              setStackDialog({
                notebook: notebookMenu.notebook,
                selectedStack: notebookStacks[notebookMenu.notebook] ?? "",
                newStackName: ""
              });
              setNotebookMenu(null);
            }}
          >
            <span>Move to stack...</span>
          </button>
          {notebookStacks[notebookMenu.notebook] ? (
            <button
              type="button"
              onClick={() => {
                removeNotebookFromStack(notebookMenu.notebook);
                setNotebookMenu(null);
              }}
            >
              <span>Remove from stack</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {searchOpen ? (
        <div className="overlay" onClick={() => setSearchOpen(false)}>
          <section className="search-modal" onClick={(event) => event.stopPropagation()}>
            <input
              autoFocus
              placeholder="Search or ask a question"
              value={quickQuery}
              onChange={(event) => setQuickQuery(event.target.value)}
              onKeyDown={(event) => {
                const resultLength = commandMode ? paletteResults.length : quickResults.length;

                if (event.key === "ArrowDown") {
                  if (!resultLength) {
                    return;
                  }
                  event.preventDefault();
                  setSearchSelected((previous) => Math.min(previous + 1, resultLength - 1));
                  return;
                }

                if (event.key === "ArrowUp") {
                  if (!resultLength) {
                    return;
                  }
                  event.preventDefault();
                  setSearchSelected((previous) => Math.max(previous - 1, 0));
                  return;
                }

                if (event.key === "Enter") {
                  if (!resultLength) {
                    return;
                  }
                  event.preventDefault();
                  if (commandMode) {
                    const action = paletteResults[searchSelected];
                    if (action) {
                      runPaletteAction(action.id);
                    }
                    return;
                  }
                  const note = quickResults[searchSelected];
                  if (note) {
                    openSearchResult(note, "open");
                  }
                }
              }}
            />
            <div className="search-chips">
              <button
                type="button"
                className={searchScope === "everywhere" ? "chip active" : "chip"}
                onClick={() => setSearchScope("everywhere")}
              >
                Everywhere
              </button>
              <button
                type="button"
                className={searchScope === "current" ? "chip active" : "chip"}
                onClick={() => setSearchScope("current")}
              >
                {selectedNotebook}
              </button>
              <button
                type="button"
                className={searchFilters.includes("attachments") ? "chip active" : "chip"}
                onClick={() => toggleSearchFilter("attachments")}
              >
                Has attachments
              </button>
              <button
                type="button"
                className={searchFilters.includes("tasks") ? "chip active" : "chip"}
                onClick={() => toggleSearchFilter("tasks")}
              >
                Has open tasks
              </button>
              {searchFilters.length ? (
                <button type="button" className="chip" onClick={() => setSearchFilters([])}>
                  Clear
                </button>
              ) : null}
            </div>
            <p className="search-hint">Use {'`>`'} for commands. Filters: tag:, notebook:, after:, before:, has:attachment|task|image|pdf</p>
            <div className="search-results">
              <h4>Recent searches</h4>
              <ul>
                {recentSearches.length ? (
                  recentSearches.map((query) => (
                    <li key={query} onClick={() => setQuickQuery(query)}>
                      <strong>{query}</strong>
                    </li>
                  ))
                ) : (
                  <li className="empty-recent">No recent searches</li>
                )}
              </ul>
              {commandMode ? (
                <>
                  <h4>Command palette</h4>
                  <ul>
                    {paletteResults.length ? (
                      paletteResults.map((action, index) => (
                        <li
                          key={action.id}
                          className={index === searchSelected ? "active" : ""}
                          onMouseEnter={() => setSearchSelected(index)}
                          onClick={() => runPaletteAction(action.id)}
                        >
                          <strong>{action.label}</strong>
                          <small>Action</small>
                        </li>
                      ))
                    ) : (
                      <li className="empty-recent">No commands found</li>
                    )}
                  </ul>
                </>
              ) : (
                <>
                  <h4>Results</h4>
                  {quickResultGroups.map((group) => (
                    <div key={group.label} className="search-group">
                      <h5>{group.label}</h5>
                      <ul>
                        {group.entries.map(({ note, index }) => (
                          <li
                            key={note.id}
                            className={index === searchSelected ? "active" : ""}
                            onMouseEnter={() => setSearchSelected(index)}
                            onClick={() => openSearchResult(note, "open")}
                          >
                            <strong>{note.title}</strong>
                            <small>{note.notebook}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </div>
            <footer className="search-actions">
              {commandMode ? (
                <button
                  type="button"
                  disabled={!selectedPaletteAction}
                  onClick={() => {
                    if (selectedPaletteAction) {
                      runPaletteAction(selectedPaletteAction.id);
                    }
                  }}
                >
                  Execute <kbd>↩</kbd>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!selectedSearchResult}
                    onClick={() => {
                      if (selectedSearchResult) {
                        openSearchResult(selectedSearchResult, "open");
                      }
                    }}
                  >
                    Select <kbd>↩</kbd>
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSearchResult}
                    onClick={() => {
                      if (selectedSearchResult) {
                        openSearchResult(selectedSearchResult, "open");
                      }
                    }}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSearchResult}
                    onClick={() => {
                      if (selectedSearchResult) {
                        openSearchResult(selectedSearchResult, "copy-link");
                      }
                    }}
                  >
                    Copy Link
                  </button>
                  <button
                    type="button"
                    disabled={!selectedSearchResult}
                    onClick={() => {
                      if (selectedSearchResult) {
                        openSearchResult(selectedSearchResult, "open-window");
                      }
                    }}
                  >
                    Open in New Window
                  </button>
                </>
              )}
              <button type="button" disabled={!quickQuery.trim()} onClick={saveCurrentSearch}>
                Save Search
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {tasksDialogOpen ? (
        <div
          className="overlay"
          onClick={() => {
            setTasksDialogOpen(false);
            setSidebarView("notes");
          }}
        >
          <section className="move-modal tasks-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Tasks</h3>
              <small>{openTasks.length} open</small>
            </header>
            {openTasks.length ? (
              <ul>
                {openTasks.map((task) => (
                  <li key={task.id} className="task-row">
                    <button
                      type="button"
                      className="task-open"
                      onClick={() => {
                        setSelectedNotebook(task.notebook);
                        focusNote(task.noteId);
                        setTasksDialogOpen(false);
                        setSidebarView("notes");
                      }}
                    >
                      <strong>{task.text}</strong>
                      <small>{task.notebook} - {task.noteTitle}</small>
                    </button>
                    <button
                      type="button"
                      className="task-complete"
                      onClick={() => completeOpenTask(task)}
                    >
                      Done
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">No open tasks</p>
            )}
            <footer>
              <button
                type="button"
                onClick={() => {
                  setTasksDialogOpen(false);
                  setSidebarView("notes");
                }}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {filesDialogOpen ? (
        <div
          className="overlay"
          onClick={() => {
            setFilesDialogOpen(false);
          }}
        >
          <section className="move-modal files-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Files</h3>
              <small>{attachmentItems.length} attachments</small>
            </header>
            {attachmentItems.length ? (
              <ul>
                {attachmentItems.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      className="task-open"
                      onClick={() => {
                        setSelectedNotebook(file.notebook);
                        focusNote(file.noteId);
                        setFilesDialogOpen(false);
                      }}
                    >
                      <strong>{file.label}</strong>
                      <small>{file.target}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">No attachments found</p>
            )}
            <footer>
              <button type="button" onClick={() => setFilesDialogOpen(false)}>
                Close
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {calendarDialogOpen ? (
        <div
          className="overlay"
          onClick={() => {
            setCalendarDialogOpen(false);
            setSidebarView("notes");
          }}
        >
          <section className="move-modal calendar-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Calendar</h3>
              <small>{calendarEvents.length} events</small>
            </header>
            <div className="calendar-actions">
              <button
                type="button"
                className="calendar-new-btn"
                onClick={() => openCreateEventDialog({ linkedNoteId: activeNote?.id ?? null })}
              >
                + New event
              </button>
            </div>
            {calendarGroups.length ? (
              <div className="calendar-groups">
                {calendarGroups.map((group) => (
                  <section key={group.label} className="calendar-group">
                    <h4>{group.label}</h4>
                    <ul>
                      {group.events.map((event) => {
                        const linkedNote = event.noteId ? notes.find((note) => note.id === event.noteId) ?? null : null;
                        return (
                          <li key={event.id} className="calendar-row">
                            <button
                              type="button"
                              className="task-open"
                              onClick={() => openEditEventDialog(event.id)}
                            >
                              <strong>{event.title}</strong>
                              <small>
                                {formatCalendarTimeRange(event)} - {event.calendar}
                              </small>
                            </button>
                            {linkedNote ? (
                              <button
                                type="button"
                                className="task-complete"
                                onClick={() => {
                                  setSelectedNotebook(linkedNote.notebook);
                                  focusNote(linkedNote.id);
                                  setCalendarDialogOpen(false);
                                  setSidebarView("notes");
                                }}
                              >
                                Open note
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <p className="history-empty">No events yet</p>
            )}
            <footer>
              <button
                type="button"
                onClick={() => {
                  setCalendarDialogOpen(false);
                  setSidebarView("notes");
                }}
              >
                Close
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {eventDialog ? (
        <div className="overlay" onClick={closeEventDialog}>
          <section className="rename-modal event-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{eventDialog.mode === "edit" ? "Edit event" : "Create event"}</h3>
            <input
              autoFocus
              placeholder="Event title"
              value={eventDialog.title}
              onChange={(event) => setEventDialog({ ...eventDialog, title: event.target.value })}
            />
            <div className="event-grid">
              <label>
                <span>Start date</span>
                <input
                  type="date"
                  value={eventDialog.startDate}
                  onChange={(event) => setEventDialog({ ...eventDialog, startDate: event.target.value })}
                />
              </label>
              {!eventDialog.allDay ? (
                <label>
                  <span>Start time</span>
                  <input
                    type="time"
                    value={eventDialog.startTime}
                    onChange={(event) => setEventDialog({ ...eventDialog, startTime: event.target.value })}
                  />
                </label>
              ) : null}
              <label>
                <span>End date</span>
                <input
                  type="date"
                  value={eventDialog.endDate}
                  onChange={(event) => setEventDialog({ ...eventDialog, endDate: event.target.value })}
                />
              </label>
              {!eventDialog.allDay ? (
                <label>
                  <span>End time</span>
                  <input
                    type="time"
                    value={eventDialog.endTime}
                    onChange={(event) => setEventDialog({ ...eventDialog, endTime: event.target.value })}
                  />
                </label>
              ) : null}
            </div>
            <label className="event-all-day">
              <input
                type="checkbox"
                checked={eventDialog.allDay}
                onChange={(event) => setEventDialog({ ...eventDialog, allDay: event.target.checked })}
              />
              All day
            </label>
            <input
              placeholder="Calendar"
              value={eventDialog.calendar}
              onChange={(event) => setEventDialog({ ...eventDialog, calendar: event.target.value })}
            />
            {eventDialog.linkedNoteId ? (
              <p className="event-linked-note">
                Linked note: {notes.find((note) => note.id === eventDialog.linkedNoteId)?.title ?? "Unknown note"}
              </p>
            ) : null}
            <footer>
              {eventDialog.mode === "edit" && eventDialog.eventId ? (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (eventDialog.eventId) {
                      deleteCalendarEvent(eventDialog.eventId);
                    }
                  }}
                >
                  Delete
                </button>
              ) : null}
              <button type="button" onClick={closeEventDialog}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={saveEventDialog}>
                {eventDialog.mode === "edit" ? "Save" : "Create event"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {noteRenameDialog ? (
        <div className="overlay" onClick={() => setNoteRenameDialog(null)}>
          <section className="rename-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Rename note</h3>
            <input
              value={noteRenameDialog.newTitle}
              onChange={(event) => setNoteRenameDialog({ ...noteRenameDialog, newTitle: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  renameNote(noteRenameDialog.noteId, noteRenameDialog.newTitle);
                }
              }}
            />
            <footer>
              <button type="button" onClick={() => setNoteRenameDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => renameNote(noteRenameDialog.noteId, noteRenameDialog.newTitle)}
              >
                Save
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {noteHistoryDialog ? (
        <div className="overlay" onClick={() => setNoteHistoryDialog(null)}>
          <section className="move-modal history-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>History · {noteHistoryNote?.title ?? "Note"}</h3>
              <small>{noteHistoryEntries.length} snapshots</small>
            </header>
            {noteHistoryEntries.length ? (
              <ul>
                {noteHistoryEntries.map((entry, index) => (
                  <li key={`${entry.at}-${index}`}>
                    <button type="button" onClick={() => restoreNoteSnapshot(noteHistoryDialog.noteId, index)}>
                      <strong>{new Date(entry.at).toLocaleString()}</strong>
                      <small>{entry.title}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="history-empty">No history yet</p>
            )}
            <footer>
              <button type="button" onClick={() => setNoteHistoryDialog(null)}>
                Close
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {moveDialog ? (
        <div className="overlay" onClick={() => setMoveDialog(null)}>
          <section className="move-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>{moveDialog.mode === "copy" ? "Copy to" : "Move"}</h3>
              <small>{moveDialog.noteIds.length} selected</small>
            </header>
            <input
              placeholder="Find a location"
              value={moveDialog.destination}
              onChange={(event) => setMoveDialog({ ...moveDialog, destination: event.target.value })}
            />
            <ul>
              {notebooks
                .filter((notebook) => notebook !== "All Notes")
                .map((notebook) => (
                  <li key={notebook}>
                    <button
                      type="button"
                      className={moveDialog.destination === notebook ? "active" : ""}
                      onClick={() => setMoveDialog({ ...moveDialog, destination: notebook })}
                    >
                      {notebook}
                    </button>
                  </li>
                ))}
            </ul>
            <footer>
              <button type="button" onClick={() => setMoveDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                disabled={!moveDialog.destination.trim()}
                onClick={() => {
                  if (moveDialog.mode === "copy") {
                    void copyNotes(moveDialog.noteIds, moveDialog.destination.trim());
                  } else {
                    moveNotes(moveDialog.noteIds, moveDialog.destination.trim());
                  }
                  setMoveDialog(null);
                }}
              >
                Done
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {renameDialog ? (
        <div className="overlay" onClick={() => setRenameDialog(null)}>
          <section className="rename-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Rename notebook</h3>
            <input
              value={renameDialog.newName}
              onChange={(event) => setRenameDialog({ ...renameDialog, newName: event.target.value })}
            />
            <footer>
              <button type="button" onClick={() => setRenameDialog(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={confirmNotebookRename}>
                Save
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {stackDialog ? (
        <div className="overlay" onClick={() => setStackDialog(null)}>
          <section className="rename-modal stack-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Move "{stackDialog.notebook}" to stack</h3>
            <input
              placeholder="New stack name"
              value={stackDialog.newStackName}
              onChange={(event) => setStackDialog({ ...stackDialog, newStackName: event.target.value })}
            />
            <ul>
              {stackNames.length ? (
                stackNames.map((stack) => (
                  <li key={stack}>
                    <button
                      type="button"
                      className={stackDialog.selectedStack === stack ? "active" : ""}
                      onClick={() => setStackDialog({ ...stackDialog, selectedStack: stack, newStackName: "" })}
                    >
                      {stack}
                    </button>
                  </li>
                ))
              ) : (
                <li className="stack-empty">No stacks yet</li>
              )}
            </ul>
            <footer>
              <button type="button" onClick={() => setStackDialog(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={confirmStackAssignment}>
                Save
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="toast">
          <span>{toastMessage}</span>
          {lastMove || lastTrash ? (
            <button type="button" onClick={undoLastAction}>
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
