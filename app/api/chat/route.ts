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
  const { messages, modelId, webSearchEnabled } = await req.json();

  if (typeof modelId !== "string") {
    return new Response("Model must be a string", { status: 400 });
  }

  if (
    typeof webSearchEnabled !== "undefined" &&
    typeof webSearchEnabled !== "boolean"
  ) {
    return new Response("Web search flag must be a boolean", { status: 400 });
  }

  if (!(modelId in textModels)) {
    return new Response("Invalid model", { status: 400 });
  }

  const selectedModelId = modelId as keyof typeof textModels;
  const selectedModel = textModels[selectedModelId];
  const useWebSearch = webSearchEnabled === true;
  let tools:
    | {
        google_search?: ReturnType<typeof google.tools.googleSearch>;
        web_search?: ReturnType<typeof openai.tools.webSearch>;
      }
    | undefined;

  if (useWebSearch) {
    if (selectedModel.chef.id === "google") {
      tools = {
        google_search: google.tools.googleSearch({}),
      };
    } else {
      tools = {
        web_search: openai.tools.webSearch({}),
      };
    }
  }

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
      useWebSearch
        ? "Web search is enabled. Use it when it would improve freshness or factual accuracy."
        : null,
      "The output should be a concise summary of the content, no more than 100 words.",
    ]
      .filter(Boolean)
      .join("\n"),
    messages: await convertToModelMessages(messages),
    tools,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
    sendSources: true,
  });
};
