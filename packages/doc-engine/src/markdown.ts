const TITLE_PATTERN = /^#\s+(.*)$/m;
const TAG_PATTERN = /(^|\s)#([a-zA-Z0-9/_-]+)/g;
const WIKILINK_PATTERN = /\[\[([^\]]+)\]\]/g;

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

export function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

export function extractTitleAndSnippet(markdown: string): { title: string; snippet: string } {
  const titleMatch = markdown.match(TITLE_PATTERN);
  const title = titleMatch?.[1]?.trim() || "Untitled";
  const snippet = markdown
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(TITLE_PATTERN, "")
    .replace(/[#>*`\-\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return { title, snippet };
}

export function extractTags(markdown: string): string[] {
  const tags = new Set<string>();
  for (const match of markdown.matchAll(TAG_PATTERN)) {
    tags.add(match[2].toLowerCase());
  }
  return [...tags.values()];
}

export function extractWikiLinks(markdown: string): string[] {
  const links = new Set<string>();
  for (const match of markdown.matchAll(WIKILINK_PATTERN)) {
    const target = parseWikiLinkTarget(match[1] ?? "");
    if (target) {
      links.add(target);
    }
  }
  return [...links.values()];
}
