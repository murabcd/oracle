import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
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

const chartSystemPrompt = [
  "You generate compact chart specifications for an embedded chart node.",
  "Use only line, bar, or area charts.",
  "Prefer 4 to 8 data points unless the context clearly provides more.",
  "Choose readable labels and realistic values.",
  "Each data point uses a label plus a values array aligned to the series array.",
  "Every data point values array must have exactly one numeric value per series.",
  "Return a chart spec that is immediately renderable.",
].join("\n");

const buildPrompt = ({
  instructions,
  prompt,
  startingSpec,
}: GenerateChartInput) =>
  [
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingSpec
      ? `Current chart spec:\n${serializeChartSpec(startingSpec)}`
      : null,
    "Generate a compact chart spec.",
  ]
    .filter(Boolean)
    .join("\n\n");

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
          { type: "text", text: buildPrompt(input) },
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
