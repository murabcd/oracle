export interface GenerateMermaidInput {
  documents?: {
    url: string;
    type: string;
  }[];
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
