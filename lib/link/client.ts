import type {
  ErrorResponse,
  FetchLinkPreviewInput,
  FetchLinkPreviewSuccess,
  GenerateLinkInput,
} from "./types";

const HTTP_PROTOCOL_RE = /^https?:$/;

export const normalizeLinkUrl = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const directUrl = new URL(trimmed);

    return HTTP_PROTOCOL_RE.test(directUrl.protocol)
      ? directUrl.toString()
      : "";
  } catch {
    try {
      const withProtocol = new URL(`https://${trimmed}`);

      return withProtocol.hostname.includes(".") ? withProtocol.toString() : "";
    } catch {
      return "";
    }
  }
};

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

export function fetchLinkPreviewRequest(
  input: FetchLinkPreviewInput
): Promise<FetchLinkPreviewSuccess | ErrorResponse> {
  return postJson("/api/link/preview", input);
}

export function generateLinkRequest(
  input: GenerateLinkInput
): Promise<FetchLinkPreviewSuccess | ErrorResponse> {
  return postJson("/api/link/create", input);
}
