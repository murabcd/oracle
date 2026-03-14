import { describe, expect, it } from "vitest";
import {
  getMermaidRenderOptions,
  MERMAID_PREVIEW_THEMES,
  normalizeMermaidSource,
} from "@/lib/mermaid";

describe("mermaid helpers", () => {
  it("falls back to the dark preview theme", () => {
    expect(getMermaidRenderOptions()).toEqual(MERMAID_PREVIEW_THEMES.dark);
    expect(getMermaidRenderOptions("dark")).toEqual(
      MERMAID_PREVIEW_THEMES.dark
    );
  });

  it("returns the light preview theme when requested", () => {
    expect(getMermaidRenderOptions("light")).toEqual(
      MERMAID_PREVIEW_THEMES.light
    );
  });

  it("strips markdown fences from generated output", () => {
    expect(normalizeMermaidSource("```mermaid\ngraph TD\n  A --> B\n```")).toBe(
      "graph TD\n  A --> B"
    );
  });
});
