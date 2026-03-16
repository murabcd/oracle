import type { ChartSpec } from "./catalog";

export interface GenerateChartInput {
  prompt: string;
  modelId: string;
  instructions?: string;
  startingSpec?: ChartSpec;
  videos?: {
    url: string;
    type: string;
  }[];
}

export interface GeneratedChartSuccess {
  json: string;
  spec: ChartSpec;
}

export interface ErrorResponse {
  error: string;
}
