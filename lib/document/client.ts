import type {
  ErrorResponse,
  ExtractDocumentInput,
  ExtractDocumentSuccess,
  GenerateDocumentInput,
  GenerateDocumentSuccess,
} from "./types";

async function postJson<TResponse extends object>(
  url: string,
  body: unknown
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as TResponse | ErrorResponse;

  if (
    !response.ok &&
    payload !== null &&
    typeof payload === "object" &&
    "error" in payload
  ) {
    throw new Error(payload.error);
  }

  return payload as TResponse;
}

export function extractDocumentTextRequest(
  input: ExtractDocumentInput
): Promise<ExtractDocumentSuccess | ErrorResponse> {
  return postJson("/api/document/extract", input);
}

export function generateDocumentRequest(
  input: GenerateDocumentInput
): Promise<GenerateDocumentSuccess | ErrorResponse> {
  return postJson("/api/document/create", input);
}
