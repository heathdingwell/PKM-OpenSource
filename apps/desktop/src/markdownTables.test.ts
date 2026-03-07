import { describe, expect, it } from "vitest";
import { applyMarkdownTableAction } from "./markdownTables";

describe("applyMarkdownTableAction", () => {
  it("adds a row below the current row", () => {
    const markdown = ["# Note", "", "| Name | Status |", "| --- | --- |", "| Alpha | Open |", "| Beta | Closed |"].join("\n");
    const cursor = markdown.indexOf("Alpha");

    const result = applyMarkdownTableAction(markdown, cursor, cursor, "add-row-after");

    expect(result.changed).toBe(true);
    expect(result.markdown).toContain("| Alpha | Open |\n|  |  |\n| Beta | Closed |");
  });

  it("adds a column to the right of the cursor", () => {
    const markdown = ["| Name | Status |", "| --- | --- |", "| Alpha | Open |"].join("\n");
    const cursor = markdown.indexOf("Status");

    const result = applyMarkdownTableAction(markdown, cursor, cursor, "add-column-after");

    expect(result.changed).toBe(true);
    expect(result.markdown).toBe(["| Name | Status |  |", "| --- | --- | --- |", "| Alpha | Open |  |"].join("\n"));
  });

  it("deletes the full table block", () => {
    const markdown = ["Before", "", "| Name | Status |", "| --- | --- |", "| Alpha | Open |", "", "After"].join("\n");
    const cursor = markdown.indexOf("Alpha");

    const result = applyMarkdownTableAction(markdown, cursor, cursor, "delete-table");

    expect(result.changed).toBe(true);
    expect(result.markdown).toBe(["Before", "", "", "After"].join("\n"));
  });

  it("aligns the active column to the center", () => {
    const markdown = ["| Name | Status |", "| --- | --- |", "| Alpha | Open |"].join("\n");
    const cursor = markdown.indexOf("Status");

    const result = applyMarkdownTableAction(markdown, cursor, cursor, "align-column-center");

    expect(result.changed).toBe(true);
    expect(result.markdown).toBe(["| Name | Status |", "| --- | :---: |", "| Alpha | Open |"].join("\n"));
  });

  it("aligns the active column to the right", () => {
    const markdown = ["| Name | Status |", "| --- | --- |", "| Alpha | Open |"].join("\n");
    const cursor = markdown.indexOf("Open");

    const result = applyMarkdownTableAction(markdown, cursor, cursor, "align-column-right");

    expect(result.changed).toBe(true);
    expect(result.markdown).toBe(["| Name | Status |", "| --- | ---: |", "| Alpha | Open |"].join("\n"));
  });

  it("returns unchanged content when cursor is outside a table", () => {
    const markdown = "# Note\n\nNo table here";
    const cursor = markdown.indexOf("No table");

    const result = applyMarkdownTableAction(markdown, cursor, cursor, "add-row-after");

    expect(result.changed).toBe(false);
    expect(result.markdown).toBe(markdown);
  });
});
