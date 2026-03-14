import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
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

const mermaidSystemPrompt = [
  "You generate Mermaid diagram source code.",
  "Return only valid Mermaid syntax with no markdown fences, no prose, and no explanations.",
  "Prefer concise diagrams that communicate structure clearly.",
  "Use supported diagram types from beautiful-mermaid: flowcharts, state diagrams, sequence diagrams, class diagrams, and er diagrams.",
  "If the request is ambiguous, choose the clearest flowchart representation.",
  "Do not emit HTML, JSON, or surrounding commentary.",
].join("\n");

const buildPrompt = ({
  instructions,
  prompt,
  startingSource,
}: GenerateMermaidInput) =>
  [
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingSource ? `Current Mermaid:\n${startingSource}` : null,
    "Output raw Mermaid only.",
  ]
    .filter(Boolean)
    .join("\n\n");

export const generateMermaid = async (input: GenerateMermaidInput) => {
  const result = await generateText({
    model: getTextModel(input.modelId),
    system: mermaidSystemPrompt,
    prompt: buildPrompt(input),
  });

  return {
    source: normalizeMermaidSource(result.text),
  };
};
