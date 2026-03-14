import type { JsonRenderSpec } from "./catalog";

export interface GenerateJsonRenderInput {
  prompt: string;
  modelId: string;
  instructions?: string;
  startingSpec?: JsonRenderSpec;
}

export interface GeneratedJsonRenderSuccess {
  spec: JsonRenderSpec;
  json: string;
}

export interface ErrorResponse {
  error: string;
}
