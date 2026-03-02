import type { NoteRecord } from "./types";

const TITLE_PATTERN = /^#\s+(.*)$/m;
const TAG_PATTERN = /(^|\s)#([a-zA-Z0-9/_-]+)/g;
const WIKILINK_PATTERN = /\[\[([^\]]+)\]\]/g;

function normalizeTitleCandidate(line: string): string {
  const cleaned = line
    .trim()
    .replace(/^[-*+]\s+\[[ xX]\]\s+/, "")
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^>\s+/, "")
    .replace(/^#+\s+/, "")
    .trim();

  if (!cleaned) {
    return "";
  }

  const wikilink = cleaned.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);
  if (wikilink) {
    const alias = wikilink[2]?.trim();
    const target = wikilink[1]?.trim();
    return alias || target || "";
  }

  return cleaned;
}

function parseWikiLinkTarget(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /^event:/i.test(trimmed)) {
    return null;
  }

  const aliasIndex = trimmed.indexOf("|");
  const target = (aliasIndex === -1 ? trimmed : trimmed.slice(0, aliasIndex)).trim();
  if (!target) {
    return null;
  }

  const anchorIndex = target.search(/[#^]/);
  const title = (anchorIndex === -1 ? target : target.slice(0, anchorIndex)).trim();
  return title || null;
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function extractTitleAndSnippet(markdown: string): { title: string; snippet: string } {
  const content = markdown.replace(/^---[\s\S]*?---\n?/m, "");
  const titleMatch = content.match(TITLE_PATTERN);
  const fallbackTitle =
    content
      .split("\n")
      .map((line) => normalizeTitleCandidate(line))
      .find((candidate) => candidate.length > 0) || "Untitled";
  const title = titleMatch?.[1]?.trim() || fallbackTitle;
  const snippet = markdown
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(TITLE_PATTERN, "")
    .replace(/[#>*`\-\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return { title, snippet };
}

function extractTags(markdown: string): string[] {
  const tags = new Set<string>();
  for (const match of markdown.matchAll(TAG_PATTERN)) {
    tags.add(match[2].toLowerCase());
  }
  return [...tags.values()];
}

function extractWikiLinks(markdown: string): string[] {
  const links = new Set<string>();
  for (const match of markdown.matchAll(WIKILINK_PATTERN)) {
    const target = parseWikiLinkTarget(match[1] ?? "");
    if (target) {
      links.add(target);
    }
  }
  return [...links.values()];
}

export class VaultService {
  private readonly notes = new Map<string, NoteRecord>();
  private readonly markdownById = new Map<string, string>();

  upsertNoteFromMarkdown(path: string, markdown: string): NoteRecord {
    const existing = [...this.notes.values()].find((note) => note.path === path);
    const now = new Date().toISOString();
    const normalized = normalizeMarkdown(markdown);
    const { title, snippet } = extractTitleAndSnippet(normalized);

    const note: NoteRecord = {
      id: existing?.id ?? crypto.randomUUID(),
      path,
      title,
      snippet,
      tags: extractTags(normalized),
      linksOut: extractWikiLinks(normalized),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.notes.set(note.id, note);
    this.markdownById.set(note.id, normalized);
    return note;
  }

  listNotes(): NoteRecord[] {
    return [...this.notes.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  getNoteById(id: string): NoteRecord | undefined {
    return this.notes.get(id);
  }

  getMarkdownById(id: string): string | undefined {
    return this.markdownById.get(id);
  }
}
