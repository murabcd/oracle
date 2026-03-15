import { getMermaidRenderOptions, normalizeMermaidSource } from "@/lib/mermaid";
import type { GenerateMermaidInput, GenerateMermaidSuccess } from "./types";

async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: unknown };

    if (typeof payload?.error === "string") {
      return payload.error;
    }
  }

  const text = await response.text();

  return text || "Request failed";
}

export async function generateMermaidRequest(
  input: GenerateMermaidInput
): Promise<GenerateMermaidSuccess> {
  const response = await fetch("/api/mermaid/create", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return (await response.json()) as GenerateMermaidSuccess;
}

export async function downloadMermaidSvg({
  id,
  resolvedTheme,
  source,
}: {
  id: string;
  resolvedTheme?: string;
  source: string;
}) {
  const normalizedSource = normalizeMermaidSource(source);

  if (!normalizedSource) {
    throw new Error("No Mermaid source to download.");
  }

  const { renderMermaid } = await import("@vercel/beautiful-mermaid");
  const svg = await renderMermaid(
    normalizedSource,
    getMermaidRenderOptions(resolvedTheme)
  );
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `oracle-${id}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
