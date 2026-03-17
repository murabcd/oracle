import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { buildUserPrompt, type Spec } from "@json-render/core";
import { streamText } from "ai";
import { textModels } from "@/lib/model-catalog";
import { jsonRenderSystemPrompt } from "./catalog";
import type { GenerateJsonRenderInput } from "./types";

const getTextModel = (modelId: string) => {
  if (!(modelId in textModels)) {
    throw new Error("Invalid text model");
  }

  const model = textModels[modelId as keyof typeof textModels];

  return model.chef.id === "google" ? google(modelId) : openai(modelId);
};

const buildContextPrompt = ({
  instructions,
  prompt,
}: Pick<GenerateJsonRenderInput, "instructions" | "prompt">) =>
  [
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

const buildStreamingPrompt = (input: GenerateJsonRenderInput) => {
  const contextPrompt = buildContextPrompt(input);

  return buildUserPrompt({
    prompt: contextPrompt || "Generate a compact embedded interface.",
    ...(input.startingSpec
      ? {
          currentSpec: input.startingSpec as Spec,
          editModes: ["patch"] as const,
        }
      : {}),
  });
};

export const streamJsonRender = (input: GenerateJsonRenderInput) =>
  streamText({
    model: getTextModel(input.modelId),
    system: jsonRenderSystemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildStreamingPrompt(input) },
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
