import type {
  DescribeImageSuccess,
  EditImageInput,
  ErrorResponse,
  GeneratedMediaSuccess,
  GeneratedVideoSuccess,
  GenerateImageInput,
  GenerateVideoInput,
} from "@/lib/media/types";

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

export function describeImageRequest(
  url: string
): Promise<DescribeImageSuccess | ErrorResponse> {
  return postJson("/api/image/describe", { url });
}

export function generateImageRequest(
  input: GenerateImageInput
): Promise<GeneratedMediaSuccess | ErrorResponse> {
  return postJson("/api/image/create", input);
}

export function editImageRequest(
  input: EditImageInput
): Promise<GeneratedMediaSuccess | ErrorResponse> {
  return postJson("/api/image/edit", input);
}

export function generateVideoRequest(
  input: GenerateVideoInput
): Promise<GeneratedVideoSuccess | ErrorResponse> {
  return postJson("/api/video/create", input);
}
