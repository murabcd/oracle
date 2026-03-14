import {
  applySpecPatch,
  parseSpecStreamLine,
  type Spec,
} from "@json-render/core";
import {
  type JsonRenderSpec,
  jsonRenderSchema,
  serializeJsonRenderSpec,
} from "./catalog";
import type {
  ErrorResponse,
  GeneratedJsonRenderSuccess,
  GenerateJsonRenderInput,
} from "./types";

async function parseErrorResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as ErrorResponse;

    if (
      payload !== null &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      return payload.error;
    }
  }

  const text = await response.text();

  return text || "Request failed";
}

export interface GenerateJsonRenderStreamOptions {
  onSpec?: (spec: Spec) => void;
}

const parseFinalSpec = (spec: Spec, patchCount: number): JsonRenderSpec => {
  if (patchCount === 0) {
    throw new Error("No json-render patches generated.");
  }

  return jsonRenderSchema.parse(spec);
};

export async function generateJsonRenderStreamRequest(
  input: GenerateJsonRenderInput,
  options: GenerateJsonRenderStreamOptions = {}
): Promise<GeneratedJsonRenderSuccess> {
  const response = await fetch("/api/json-render/create", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  if (!response.body) {
    throw new Error("Streaming response body is unavailable.");
  }

  const currentSpec = structuredClone(input.startingSpec ?? {}) as Spec;
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let patchCount = 0;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const patch = parseSpecStreamLine(line.trim());

      if (!patch) {
        continue;
      }

      applySpecPatch(currentSpec, patch);
      patchCount += 1;
      options.onSpec?.(structuredClone(currentSpec));
    }
  }

  const finalPatch = parseSpecStreamLine(buffer.trim());

  if (finalPatch) {
    applySpecPatch(currentSpec, finalPatch);
    patchCount += 1;
    options.onSpec?.(structuredClone(currentSpec));
  }

  const spec = parseFinalSpec(currentSpec, patchCount);

  return {
    json: serializeJsonRenderSpec(spec),
    spec,
  };
}
