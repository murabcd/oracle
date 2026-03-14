export interface GenerateMermaidInput {
  prompt: string;
  modelId: string;
  instructions?: string;
  startingSource?: string;
}

export interface GenerateMermaidSuccess {
  source: string;
}
