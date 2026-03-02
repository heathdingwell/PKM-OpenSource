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

  it("boosts exact title matches over partial title matches", () => {
    const index = new SearchIndex();

    index.upsert(
      {
        id: "exact",
        title: "Agenda",
        snippet: "Template",
        tags: ["daily"],
        updatedAt: "2026-03-01T10:00:00.000Z"
      },
      "Body text"
    );

    index.upsert(
      {
        id: "partial",
        title: "Weekly Agenda Review",
        snippet: "Longer planning note",
        tags: ["review"],
        updatedAt: "2026-03-02T10:00:00.000Z"
      },
      "Body text"
    );

    const results = index.search("agenda");
    expect(results[0]?.noteId).toBe("exact");
  });

  it("uses recency as a tie-breaker for equally relevant results", () => {
    const index = new SearchIndex();

    index.upsert(
      {
        id: "older",
        title: "Research log",
        snippet: "Weekly capture",
        tags: [],
        updatedAt: "2026-02-01T09:00:00.000Z"
      },
      "Notes about transformers"
    );

    index.upsert(
      {
        id: "newer",
        title: "Research log",
        snippet: "Weekly capture",
        tags: [],
        updatedAt: "2026-03-01T09:00:00.000Z"
      },
      "Notes about transformers"
    );

    const results = index.search("research");
    expect(results[0]?.noteId).toBe("newer");
  });

  it("matches multi-term queries across title and body", () => {
    const index = new SearchIndex();

    index.upsert(
      {
        id: "match",
        title: "Project planning",
        snippet: "Roadmap",
        tags: [],
        updatedAt: "2026-03-01T10:00:00.000Z"
      },
      "Milestone tracking for Q2"
    );

    index.upsert(
      {
        id: "no-match",
        title: "Project planning",
        snippet: "Roadmap",
        tags: [],
        updatedAt: "2026-03-01T10:00:00.000Z"
      },
      "General notes only"
    );

    const results = index.search("project milestone");
    expect(results.map((entry) => entry.noteId)).toEqual(["match"]);
  });
});
