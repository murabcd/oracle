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
