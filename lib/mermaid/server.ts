import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  buildMermaidGenerationPrompt,
  mermaidSystemPrompt,
} from "@/lib/ai/prompts/mermaid";
import { normalizeMermaidSource } from "@/lib/mermaid";
import { textModels } from "@/lib/model-catalog";
import type { GenerateMermaidInput } from "./types";

const getTextModel = (modelId: string) => {
  if (!(modelId in textModels)) {
    throw new Error("Invalid text model");
  }

  const model = textModels[modelId as keyof typeof textModels];

  return model.chef.id === "google" ? google(modelId) : openai(modelId);
};

export const generateMermaid = async (input: GenerateMermaidInput) => {
  const result = await generateText({
    model: getTextModel(input.modelId),
    system: mermaidSystemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildMermaidGenerationPrompt(input) },
          ...(input.documents ?? []).map((document) => ({
            type: "file" as const,
            mediaType: document.type,
            data: new URL(document.url),
          })),
          ...(input.videos ?? []).map((video) => ({
            type: "file" as const,
            mediaType: video.type,
            data: new URL(video.url),
          })),
        ],
      },
    ],
  });

  return {
    source: normalizeMermaidSource(result.text),
  };
};
