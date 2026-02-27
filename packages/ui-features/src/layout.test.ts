import { describe, expect, it } from "vitest";
import { createDefaultLayout, normalizeLayout } from "./layout";

describe("layout", () => {
  it("clamps panel widths", () => {
    const normalized = normalizeLayout({
      ...createDefaultLayout(),
      sidebarWidth: 10,
      listWidth: 2000
    });

    expect(normalized.sidebarWidth).toBe(220);
    expect(normalized.listWidth).toBe(560);
  });
});
