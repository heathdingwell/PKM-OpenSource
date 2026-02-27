import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SearchIndex } from "@pkm-os/indexer";
import { createDefaultLayout } from "@pkm-os/ui-features";
import { type NoteRecord, VaultService } from "@pkm-os/vault-core";
import RichMarkdownEditor, { type RichMarkdownEditorHandle } from "./RichMarkdownEditor";

interface SeedNote {
  notebook: string;
  fileName: string;
  markdown: string;
  updatedAt: string;
}

interface AppNote extends NoteRecord {
  notebook: string;
  markdown: string;
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

interface NoteHistoryEntry {
  at: string;
  title: string;
  markdown: string;
}

interface NoteHistoryDialogState {
  noteId: string;
}

interface AppPrefs {
  selectedNotebook: string;
  activeId: string;
  viewMode?: NoteViewMode;
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

type EditorMode = "markdown" | "rich";
type NoteViewMode = "cards" | "list";
type NoteSortMode =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc";

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

interface ShellNotesPayload {
  [index: number]: unknown;
  length: number;
}

const NOTES_STORAGE_KEY = "pkm-os.desktop.notes.v2";
const PREFS_STORAGE_KEY = "pkm-os.desktop.prefs.v1";
const SEARCH_RECENTS_KEY = "pkm-os.desktop.search-recents.v1";
const HISTORY_STORAGE_KEY = "pkm-os.desktop.history.v1";

const seedNotes: SeedNote[] = [
  {
    notebook: "Daily Notes",
    fileName: "Agenda.md",
    updatedAt: "2026-02-26T18:00:00.000Z",
    markdown:
      "# Agenda\n\n## Today priorities\n\n1. Priority 1\n2. Priority 2\n3. Priority 3\n\n## Meetings\n- Link a calendar event\n- Add any relevant tasks\n- Add or create any linked notes"
  },
  {
    notebook: "Daily Notes",
    fileName: "To-do list.md",
    updatedAt: "2026-02-26T17:00:00.000Z",
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

const sidePinned = ["Shortcuts", "Notes", "Tasks", "Files", "Calendar", "Templates"];

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
    typeof note.markdown === "string"
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

function loadPrefs(): AppPrefs {
  if (typeof window === "undefined") {
    return {
      selectedNotebook: "Daily Notes",
      activeId: "",
      viewMode: "cards",
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

  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return {
        selectedNotebook: "Daily Notes",
        activeId: "",
        viewMode: "cards",
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

    const parsed = JSON.parse(raw) as Partial<AppPrefs>;
    return {
      selectedNotebook: parsed.selectedNotebook || "Daily Notes",
      activeId: parsed.activeId || "",
      viewMode: parsed.viewMode === "list" ? "list" : "cards",
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
    return {
      selectedNotebook: "Daily Notes",
      activeId: "",
      viewMode: "cards",
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

export default function App() {
  const initialPrefs = useMemo(() => loadPrefs(), []);

  const [layout] = useState(() => ({ ...createDefaultLayout(), sidebarWidth: 240, listWidth: 520 }));
  const [notes, setNotes] = useState<AppNote[]>(() => loadInitialNotes());
  const [selectedNotebook, setSelectedNotebook] = useState<string>(initialPrefs.selectedNotebook);
  const [activeId, setActiveId] = useState<string>(initialPrefs.activeId);
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
  const [stackDialog, setStackDialog] = useState<StackDialogState | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<"everywhere" | "current">("everywhere");
  const [quickQuery, setQuickQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());
  const [searchSelected, setSearchSelected] = useState(0);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dropNotebook, setDropNotebook] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<LastMoveState | null>(null);
  const [draftMarkdown, setDraftMarkdown] = useState<string>("");
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [editorMode, setEditorMode] = useState<EditorMode>("markdown");
  const [viewMode, setViewMode] = useState<NoteViewMode>(initialPrefs.viewMode ?? "cards");
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
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [vaultReady, setVaultReady] = useState(false);
  const [queryNoteHandled, setQueryNoteHandled] = useState(false);
  const [noteHistory, setNoteHistory] = useState<Record<string, NoteHistoryEntry[]>>(() => loadNoteHistory());
  const [vaultMode] = useState<"local" | "desktop">(() =>
    typeof window !== "undefined" && window.pkmShell?.saveVaultState ? "desktop" : "local"
  );
  const [linkSuggestion, setLinkSuggestion] = useState<LinkSuggestionState | null>(null);
  const [slashMenu, setSlashMenu] = useState<SlashMenuState | null>(null);

  const autosaveTimerRef = useRef<number | null>(null);
  const previousNotesRef = useRef<AppNote[] | null>(null);
  const editorMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const markdownEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const richEditorRef = useRef<RichMarkdownEditorHandle | null>(null);

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

    const filtered = tagFilters.length
      ? scoped.filter((note) => tagFilters.every((tag) => note.tags.includes(tag)))
      : scoped;

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
  }, [notes, selectedNotebook, tagFilters, sortMode]);

  const availableTags = useMemo(() => {
    const source = selectedNotebook === "All Notes" ? notes : notes.filter((note) => note.notebook === selectedNotebook);
    return Array.from(new Set(source.flatMap((note) => note.tags))).sort((left, right) => left.localeCompare(right));
  }, [notes, selectedNotebook]);

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

  const quickResults = useMemo(() => {
    const scopedNotes =
      searchScope === "current" && selectedNotebook !== "All Notes"
        ? notes.filter((note) => note.notebook === selectedNotebook)
        : notes;
    const scopedIds = new Set(scopedNotes.map((note) => note.id));

    if (!quickQuery.trim()) {
      return scopedNotes
        .slice()
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 6);
    }

    return searchIndex
      .search(quickQuery)
      .map((result) => notes.find((note) => note.id === result.noteId))
      .filter((note): note is AppNote => {
        if (!note) {
          return false;
        }
        return scopedIds.has(note.id);
      })
      .slice(0, 8);
  }, [notes, quickQuery, searchIndex, searchScope, selectedNotebook]);

  const selectedSearchResult = quickResults[searchSelected] ?? null;
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
      return;
    }

    setDraftMarkdown(activeNote.markdown);
    setSaveState("saved");
    setTagEditorOpen(false);
    setTagInput("");
  }, [activeNote?.id]);

  useEffect(() => {
    if (editorMode === "rich" && linkSuggestion) {
      setLinkSuggestion(null);
    }
  }, [editorMode, linkSuggestion]);

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
    const prefs: AppPrefs = {
      selectedNotebook,
      activeId,
      viewMode,
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
    viewMode,
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

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
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
        setContextMenu(null);
        setNoteListMenu(null);
        setNotebookMenu(null);
        setEditorContextMenu(null);
        setStackDialog(null);
        setNoteHistoryDialog(null);
        setSearchOpen(false);
        setSlashMenu(null);
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
  }, [searchOpen, quickQuery, searchScope]);

  useEffect(() => {
    if (searchSelected < quickResults.length) {
      return;
    }
    setSearchSelected(Math.max(0, quickResults.length - 1));
  }, [searchSelected, quickResults.length]);

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
  }

  function openSlashMenuFromInsert(): void {
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

  function ensureLinkedNote(title: string): AppNote {
    const existing = notes.find((note) => note.title.toLowerCase() === title.toLowerCase());
    if (existing) {
      return existing;
    }

    const notebook = selectedNotebook === "All Notes" ? notebooks[1] || "Inbox" : selectedNotebook;
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
    setActiveId(noteId);
    setSelectedIds(new Set([noteId]));
    setLastSelectedId(noteId);
    touchRecent(noteId);
    setLinkSuggestion(null);
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
    setSearchScope(saved.scope);
    setQuickQuery(saved.query);
    setSearchOpen(true);
  }

  function removeSavedSearch(id: string): void {
    setSavedSearches((previous) => previous.filter((entry) => entry.id !== id));
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

  function addNotesToShortcuts(noteIds: string[]): number {
    const validIds = new Set(notes.map((note) => note.id));
    let added = 0;
    setShortcutNoteIds((previous) => {
      const next = [...previous];
      for (const noteId of noteIds) {
        if (!validIds.has(noteId) || next.includes(noteId)) {
          continue;
        }
        next.push(noteId);
        added += 1;
      }
      return next;
    });
    return added;
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

    setNotebookStacks((previous) => ({
      ...previous,
      [stackDialog.notebook]: chosen
    }));
    setCollapsedStacks((previous) => {
      if (!previous.has(chosen)) {
        return previous;
      }
      const next = new Set(previous);
      next.delete(chosen);
      return next;
    });
    setStackDialog(null);
    setToastMessage(`Moved "${stackDialog.notebook}" to stack "${chosen}"`);
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
    setToastMessage(
      `${changed.length === 1 ? `\"${changed[0].title}\"` : `${changed.length} notes`} moved to ${destination}`
    );
  }

  function copyNotes(noteIds: string[], destination: string): void {
    const selected = notes.filter((note) => noteIds.includes(note.id));
    if (!selected.length) {
      return;
    }

    const now = new Date().toISOString();
    const copies = selected.map((source, index) => {
      const suffix = selected.length > 1 ? ` copy ${index + 1}` : " copy";
      const draft = parseForPreview(source.markdown);
      const copyTitle = `${draft.title}${suffix}`;
      const rewritten = source.markdown.replace(/^#\s+.*$/m, `# ${copyTitle}`);
      const copy: AppNote = {
        ...source,
        id: crypto.randomUUID(),
        notebook: destination,
        markdown: rewritten,
        createdAt: now,
        updatedAt: now,
        path: `${destination}/${toFileName(copyTitle)}`,
        title: copyTitle
      };
      return noteFromMarkdown(copy, rewritten, now);
    });

    setNotes((previous) => [...copies, ...previous]);
    setToastMessage(
      `${copies.length === 1 ? `\"${copies[0].title}\"` : `${copies.length} notes`} copied to ${destination}`
    );
  }

  function undoLastMove(): void {
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

  function duplicateNotes(noteIds: string[]): void {
    const now = new Date().toISOString();
    const duplicates = notes
      .filter((note) => noteIds.includes(note.id))
      .map((note) => {
        const title = `${note.title} copy`;
        const markdown = note.markdown.replace(/^#\s+.*$/m, `# ${title}`);
        const copy: AppNote = {
          ...note,
          id: crypto.randomUUID(),
          title,
          markdown,
          createdAt: now,
          updatedAt: now,
          path: `${note.notebook}/${toFileName(title)}`
        };

        return noteFromMarkdown(copy, markdown, now);
      });

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
      duplicateNotes(contextMenu.noteIds);
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
      setContextMenu(null);
      return;
    }

    if (action === "move-trash") {
      setNotes((previous) => previous.filter((note) => !contextMenu.noteIds.includes(note.id)));
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
      const added = addNotesToShortcuts(contextMenu.noteIds);
      setToastMessage(added ? `${added} added to shortcuts` : "Already in shortcuts");
      setContextMenu(null);
      return;
    }

    if (action === "note-history") {
      setNoteHistoryDialog({ noteId: targetId });
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

  function createNewNote(): void {
    flushActiveDraft();

    const notebook = selectedNotebook === "All Notes" ? notebooks[1] || "Inbox" : selectedNotebook;
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
    const parts = text.split(/(\[\[[^\]]+\]\])/g).filter(Boolean);

    return parts.map((part, index) => {
      const match = part.match(/^\[\[([^\]]+)\]\]$/);
      if (!match) {
        return <span key={`${part}-${index}`}>{part}</span>;
      }

      const label = match[1].trim();
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
          className={selectedNotebook === notebook ? "notebook-item active" : "notebook-item"}
          onClick={() => {
            flushActiveDraft();
            setSelectedNotebook(notebook);
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
        insert("![image](./attachments/image.png)");
        break;
      case "file":
        insert("[file](./attachments/file.pdf)");
        break;
      case "video":
        insert("[video](https://)");
        break;
      case "audio":
        insert("[audio](./attachments/audio.m4a)");
        break;
      case "code-block":
        insert("```text\n\n```");
        break;
      case "formula":
        insert("$$\n\n$$");
        break;
      case "event":
        insert("- [ ] Calendar event: ");
        break;
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
        richEditorRef.current?.insertContent("![image](./attachments/image.png)");
        break;
      case "file":
        richEditorRef.current?.insertContent("[file](./attachments/file.pdf)");
        break;
      case "video":
        richEditorRef.current?.insertContent("[video](https://)");
        break;
      case "audio":
        richEditorRef.current?.insertContent("[audio](./attachments/audio.m4a)");
        break;
      case "code-block":
        richEditorRef.current?.toggleCodeBlock();
        break;
      case "formula":
        richEditorRef.current?.insertContent("$$\n\n$$");
        break;
      case "event":
        richEditorRef.current?.insertContent("- [ ] Calendar event: ");
        break;
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
        setNoteHistoryDialog(null);
        setSlashMenu(null);
      }}
    >
      <aside className="left-sidebar" style={{ width: layout.sidebarWidth }}>
        <div className="sidebar-search" onClick={() => setSearchOpen(true)}>
          <span>Search</span>
          <kbd>cmd+k</kbd>
        </div>

        <div className="sidebar-actions">
          <button type="button" className="new-note" onClick={createNewNote}>
            + Note
          </button>
          <button type="button" className="round-action" aria-label="Quick actions">
            +
          </button>
          <button type="button" className="round-action" aria-label="Create task">
            T
          </button>
          <button type="button" className="round-action" aria-label="More actions">
            ...
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidePinned.map((item) => (
            <button key={item} type="button" className="sidebar-link">
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
                  <button
                    type="button"
                    className="shortcut-remove"
                    aria-label={`Remove saved search ${saved.label}`}
                    onClick={() => removeSavedSearch(saved.id)}
                  >
                    ×
                  </button>
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
              return (
                <li key={group.stack} className="stack-group">
                  <button
                    type="button"
                    className="stack-header"
                    onClick={() => toggleStackCollapsed(group.stack)}
                    title={isCollapsed ? "Expand stack" : "Collapse stack"}
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

      <section className="note-column" style={{ width: layout.listWidth }}>
        <header className="note-column-header">
          <div>
            <h1>{selectedNotebook}</h1>
            <small>{visibleNotes.length}</small>
          </div>
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
        </header>

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

        <div className={viewMode === "list" ? "note-grid list-mode" : "note-grid"} aria-label="Notes list">
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
                  {homePinned ? <span className="note-pin">Home pin</span> : null}
                  {notebookPinned ? <span className="note-pin">Notebook pin</span> : null}
                  {viewMode === "list" ? <span>{note.notebook}</span> : null}
                  {isSelected ? <em>{selectedIds.size > 1 ? "Multi" : "Selected"}</em> : null}
                </footer>
              </button>
            );
          })}
        </div>
      </section>

      <main className="editor-shell">
        {activeNote ? (
          <>
            <header className="editor-topbar">
              <div className="crumbs">
                <span>{activeNote.notebook}</span>
                <span>{draftPreview.title}</span>
              </div>
              <div className="editor-top-actions">
                <button type="button" className="link-btn" onClick={() => setMetadataOpen((previous) => !previous)}>
                  Info
                </button>
                <button type="button" className="share-btn">
                  Share
                </button>
                <button type="button" className="link-btn">
                  Link
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

            <div className="template-banner">
              <span>You are editing your "{draftPreview.title}" template</span>
              <button type="button">Use this template</button>
            </div>

            <article className={metadataOpen ? "editor-content with-metadata" : "editor-content"}>
              <div className="editor-workbench">
                {editorMode === "markdown" ? (
                  <section className="markdown-pane" aria-label="Markdown editor">
                    <h3>Markdown</h3>
                    <textarea
                      ref={markdownEditorRef}
                      className="markdown-editor"
                      value={draftMarkdown}
                      onChange={(event) => {
                        setDraftMarkdown(event.target.value);
                        syncLinkSuggestion(event.target.value, event.target.selectionStart);
                        syncSlashSuggestion(event.target.value, event.target.selectionStart);
                      }}
                      onClick={(event) => {
                        const target = event.currentTarget;
                        syncLinkSuggestion(target.value, target.selectionStart);
                        syncSlashSuggestion(target.value, target.selectionStart);
                      }}
                      onKeyUp={(event) => {
                        const target = event.currentTarget;
                        syncLinkSuggestion(target.value, target.selectionStart);
                        syncSlashSuggestion(target.value, target.selectionStart);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        openEditorContextMenu(event.clientX, event.clientY);
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

                        if (!linkSuggestion) {
                          return;
                        }

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
                  </section>
                ) : (
                  <section className="markdown-pane rich-pane" aria-label="Rich editor">
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
                <span>{row.label}</span>
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
                if (!quickResults.length) {
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setSearchSelected((previous) => Math.min(previous + 1, quickResults.length - 1));
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setSearchSelected((previous) => Math.max(previous - 1, 0));
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
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
            </div>
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
            </div>
            <footer className="search-actions">
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
              <button type="button" disabled={!quickQuery.trim()} onClick={saveCurrentSearch}>
                Save Search
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
                    copyNotes(moveDialog.noteIds, moveDialog.destination.trim());
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
          {lastMove ? (
            <button type="button" onClick={undoLastMove}>
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
