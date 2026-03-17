import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { parseError } from "@/lib/error/parse";
import { documentExtractionModelId, textModels } from "@/lib/model-catalog";
import { assertBlobUrl } from "@/lib/url";
import type {
  ErrorResponse,
  ExtractDocumentInput,
  ExtractDocumentSuccess,
  GenerateDocumentInput,
  GenerateDocumentSuccess,
} from "./types";

const pdfExtractionPrompt = [
  "Extract the readable text from this document.",
  "Preserve headings, bullets, and section order when possible.",
  "Return plain text only.",
].join("\n");

const normalizeExtractedText = (value: string) =>
  value.replace(/\r\n/g, "\n").trim();

const getTextModel = (modelId: string) => {
  if (!(modelId in textModels)) {
    throw new Error("Invalid text model");
  }

  const model = textModels[modelId as keyof typeof textModels];

  return model.chef.id === "google" ? google(modelId) : openai(modelId);
};

const extractTextDocument = async (url: URL) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }

  return normalizeExtractedText(await response.text());
};

const extractPdfDocument = async (url: URL) => {
  const { text } = await generateText({
    model: openai(documentExtractionModelId),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: pdfExtractionPrompt,
          },
          {
            type: "file",
            mediaType: "application/pdf",
            data: url,
          },
        ],
      },
    ],
  });

  return normalizeExtractedText(text);
};

export async function extractDocumentText(
  input: ExtractDocumentInput
): Promise<ExtractDocumentSuccess | ErrorResponse> {
  try {
    const validatedUrl = assertBlobUrl(input.source.url);
    let text = "";

    if (input.source.type === "application/pdf") {
      text = await extractPdfDocument(validatedUrl);
    } else if (input.source.type.startsWith("text/")) {
      text = await extractTextDocument(validatedUrl);
    }

    if (!text) {
      throw new Error(
        input.source.type.startsWith("text/")
          ? "Document is empty"
          : "Unsupported document type"
      );
    }

    return { text };
  } catch (error) {
    return { error: parseError(error) };
  }
}

const documentSystemPrompt = [
  "You generate polished documents for an embedded document node.",
  "Return plain markdown only.",
  "Do not wrap the result in code fences.",
  "Use concise headings, bullets, and short sections when useful.",
].join("\n");

const buildGeneratePrompt = ({
  instructions,
  prompt,
  startingText,
}: GenerateDocumentInput) =>
  [
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingText ? `Current document:\n${startingText}` : null,
    "Generate the document.",
  ]
    .filter(Boolean)
    .join("\n\n");

export async function generateDocument(
  input: GenerateDocumentInput
): Promise<GenerateDocumentSuccess | ErrorResponse> {
  try {
    const result = await generateText({
      model: getTextModel(input.modelId),
      system: documentSystemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildGeneratePrompt(input),
            },
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

    const text = result.text.trim();

    if (!text) {
      throw new Error("No document generated");
    }

    return { text };
  } catch (error) {
    return { error: parseError(error) };
  }
}
