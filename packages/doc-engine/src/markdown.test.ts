import { describe, expect, it } from "vitest";
import { extractTags, extractTitleAndSnippet, extractWikiLinks, normalizeMarkdown } from "./markdown";

describe("doc-engine markdown helpers", () => {
  it("normalizes line endings", () => {
    expect(normalizeMarkdown("a\r\nb")).toBe("a\nb\n");
  });

  it("extracts title and snippet", () => {
    const parsed = extractTitleAndSnippet("# Plan\n\nShip parity.");
    expect(parsed.title).toBe("Plan");
    expect(parsed.snippet).toContain("Ship parity");
  });

  it("extracts tags and wikilinks", () => {
    const markdown = "# T\n\n#Tag [[Next Note]]";
    expect(extractTags(markdown)).toEqual(["tag"]);
    expect(extractWikiLinks(markdown)).toEqual(["Next Note"]);
  });
});
