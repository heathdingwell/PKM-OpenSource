import { describe, expect, it } from "vitest";
import { VaultService } from "./vaultService";

describe("VaultService", () => {
  it("extracts key metadata from markdown", () => {
    const vault = new VaultService();
    const note = vault.upsertNoteFromMarkdown(
      "Inbox/First.md",
      "# First note\n\nHello world with [[Second note]] and #tag"
    );

    expect(note.title).toBe("First note");
    expect(note.tags).toContain("tag");
    expect(note.linksOut).toContain("Second note");
  });

  it("uses first non-empty line as title when heading is absent", () => {
    const vault = new VaultService();
    const note = vault.upsertNoteFromMarkdown("Inbox/First.md", "- [ ] Follow up with vendor");
    expect(note.title).toBe("Follow up with vendor");
  });

  it("normalizes aliased and anchored wikilinks in note metadata", () => {
    const vault = new VaultService();
    const note = vault.upsertNoteFromMarkdown(
      "Inbox/First.md",
      "# First note\n\n[[Second note|Alias]] [[Second note#Heading]] [[event:abc123|Standup]]"
    );

    expect(note.linksOut).toEqual(["Second note"]);
  });
});
