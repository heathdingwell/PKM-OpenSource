const TITLE_PATTERN = /^#\s+(.*)$/m;
const TAG_PATTERN = /(^|\s)#([a-zA-Z0-9/_-]+)/g;
const WIKILINK_PATTERN = /\[\[([^\]]+)\]\]/g;

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
    links.add(match[1].trim());
  }
  return [...links.values()];
}
