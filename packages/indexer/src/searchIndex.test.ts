import { describe, expect, it } from "vitest";
import { SearchIndex } from "./searchIndex";

describe("SearchIndex", () => {
  it("scores title matches above body-only matches", () => {
    const index = new SearchIndex();

    index.upsert(
      {
        id: "1",
        title: "Product direction",
        snippet: "Strategy note",
        tags: ["plan"]
      },
      "Body text"
    );

    index.upsert(
      {
        id: "2",
        title: "Random",
        snippet: "Contains direction in snippet",
        tags: []
      },
      "Body"
    );

    const results = index.search("direction");
    expect(results[0]?.noteId).toBe("1");
  });
});
