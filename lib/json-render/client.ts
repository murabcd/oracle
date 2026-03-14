import type {
  ErrorResponse,
  GeneratedJsonRenderSuccess,
  GenerateJsonRenderInput,
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

export const generateJsonRenderRequest = (
  input: GenerateJsonRenderInput
): Promise<GeneratedJsonRenderSuccess | ErrorResponse> =>
  postJson("/api/json-render/create", input);
