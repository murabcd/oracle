import { type RenderOptions, THEMES } from "@vercel/beautiful-mermaid";

const MERMAID_FENCE_PATTERN = /^```(?:mermaid)?\s*([\s\S]*?)\s*```$/i;

export const MERMAID_PREVIEW_THEMES = {
  dark: {
    ...THEMES["vercel-dark"],
  },
  light: {
    ...THEMES["vercel-light"],
  },
} satisfies Record<"dark" | "light", RenderOptions>;

export const getMermaidRenderOptions = (resolvedTheme?: string) =>
  resolvedTheme === "light"
    ? MERMAID_PREVIEW_THEMES.light
    : MERMAID_PREVIEW_THEMES.dark;

export const normalizeMermaidSource = (value: string) => {
  const trimmed = value.trim();
  const fenced = trimmed.match(MERMAID_FENCE_PATTERN);

  return (fenced?.[1] ?? trimmed).trim();
};
