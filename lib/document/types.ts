import type { NodeFile } from "@/lib/node-data";

export interface ExtractDocumentInput {
  source: NodeFile;
}

export interface ExtractDocumentSuccess {
  text: string;
}

export interface GenerateDocumentInput {
  documents?: {
    url: string;
    type: string;
  }[];
  prompt: string;
  modelId: string;
  instructions?: string;
  startingText?: string;
  videos?: {
    url: string;
    type: string;
  }[];
}

export interface GenerateDocumentSuccess {
  text: string;
}

export interface ErrorResponse {
  error: string;
}
