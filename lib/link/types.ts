import type { NodeFile } from "@/lib/node-data";

export interface FetchLinkPreviewInput {
  url: string;
}

export interface FetchLinkPreviewSuccess {
  description?: string;
  embedUrl?: string;
  hostname: string;
  image?: string;
  siteName?: string;
  title: string;
  url: string;
}

export interface ErrorResponse {
  error: string;
}

export interface GenerateLinkInput {
  documents?: NodeFile[];
  instructions?: string;
  modelId: string;
  prompt: string;
  startingUrl?: string;
  videos?: NodeFile[];
}
