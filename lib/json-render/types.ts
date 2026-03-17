import type { JsonRenderSpec } from "./catalog";

export interface GenerateJsonRenderInput {
  documents?: {
    url: string;
    type: string;
  }[];
  prompt: string;
  modelId: string;
  instructions?: string;
  startingSpec?: JsonRenderSpec;
  videos?: {
    url: string;
    type: string;
  }[];
}

export interface GeneratedJsonRenderSuccess {
  spec: JsonRenderSpec;
  json: string;
}

export interface ErrorResponse {
  error: string;
}
