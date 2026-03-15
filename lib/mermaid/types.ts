export interface GenerateMermaidInput {
  prompt: string;
  modelId: string;
  instructions?: string;
  startingSource?: string;
  videos?: {
    url: string;
    type: string;
  }[];
}

export interface GenerateMermaidSuccess {
  source: string;
}
