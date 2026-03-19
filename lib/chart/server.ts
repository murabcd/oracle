import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import {
  buildChartGenerationPrompt,
  chartSystemPrompt,
} from "@/lib/ai/prompts/chart";
import { chartSpecSchema, serializeChartSpec } from "@/lib/chart/catalog";
import { textModels } from "@/lib/model-catalog";
import type { GenerateChartInput } from "./types";

const getTextModel = (modelId: string) => {
  if (!(modelId in textModels)) {
    throw new Error("Invalid text model");
  }

  const model = textModels[modelId as keyof typeof textModels];

  return model.chef.id === "google" ? google(modelId) : openai(modelId);
};

export const generateChart = async (input: GenerateChartInput) => {
  const result = await generateText({
    model: getTextModel(input.modelId),
    output: Output.object({
      schema: chartSpecSchema,
    }),
    system: chartSystemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildChartGenerationPrompt(input) },
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
  const spec = result.output;

  return {
    json: serializeChartSpec(spec),
    spec,
  };
};
