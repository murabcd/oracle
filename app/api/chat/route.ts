import { google } from "@ai-sdk/google";
import {
  type OpenAILanguageModelResponsesOptions,
  openai,
} from "@ai-sdk/openai";
import { convertToModelMessages, streamText } from "ai";
import { textModels } from "@/lib/model-catalog";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export const POST = async (req: Request) => {
  const { messages, modelId } = await req.json();

  if (typeof modelId !== "string") {
    return new Response("Model must be a string", { status: 400 });
  }

  if (!(modelId in textModels)) {
    return new Response("Invalid model", { status: 400 });
  }

  const selectedModelId = modelId as keyof typeof textModels;
  const selectedModel = textModels[selectedModelId];

  const result = streamText({
    model:
      selectedModel.chef.id === "google"
        ? google(selectedModelId)
        : openai(selectedModelId),
    ...(selectedModel.chef.id === "openai"
      ? {
          providerOptions: {
            openai: {
              reasoningSummary: "auto",
            } satisfies OpenAILanguageModelResponsesOptions,
          },
        }
      : {}),
    system: [
      "You are a helpful assistant that synthesizes an answer or content.",
      "The user will provide a collection of data from disparate sources.",
      "They may also provide instructions for how to synthesize the content.",
      "If the instructions are a question, then your goal is to answer the question based on the context provided.",
      "You will then synthesize the content based on the user's instructions and the context provided.",
      "The output should be a concise summary of the content, no more than 100 words.",
    ].join("\n"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
};
