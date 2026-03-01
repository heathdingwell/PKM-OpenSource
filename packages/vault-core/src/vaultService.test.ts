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

  it("normalizes aliased and anchored wikilinks in note metadata", () => {
    const vault = new VaultService();
    const note = vault.upsertNoteFromMarkdown(
      "Inbox/First.md",
      "# First note\n\n[[Second note|Alias]] [[Second note#Heading]] [[event:abc123|Standup]]"
    );

    expect(note.linksOut).toEqual(["Second note"]);
  });
});
