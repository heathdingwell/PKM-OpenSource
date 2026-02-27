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
});
