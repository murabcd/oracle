import type { Node } from "@xyflow/react";
import type { FileUIPart, UIMessage } from "ai";
import type { TextNodeConfig, TextNodeResult } from "@/components/nodes/text";
import {
  getDescriptionsFromImageNodes,
  getDocumentsFromDocumentNodes,
  getImagesFromImageNodes,
  getTextFromDocumentNodes,
  getTextFromLinkNodes,
  getTextFromTextNodes,
  getVideosFromVideoNodes,
} from "@/lib/xyflow";

interface TextNodeExecutionInput {
  attachments: FileUIPart[];
  prompt: string;
}

export const buildTextNodeExecutionInput = ({
  incomers,
  instructions,
}: {
  incomers: Node[];
  instructions?: TextNodeConfig["instructions"];
}): TextNodeExecutionInput => {
  const textPrompts = getTextFromTextNodes(incomers);
  const documentTexts = getTextFromDocumentNodes(incomers);
  const linkTexts = getTextFromLinkNodes(incomers);
  const documents = getDocumentsFromDocumentNodes(incomers);
  const images = getImagesFromImageNodes(incomers);
  const imageDescriptions = getDescriptionsFromImageNodes(incomers);
  const videos = getVideosFromVideoNodes(incomers);

  if (
    !(
      textPrompts.length ||
      documentTexts.length ||
      linkTexts.length ||
      imageDescriptions.length ||
      images.length ||
      documents.length ||
      videos.length ||
      instructions
    )
  ) {
    throw new Error("No prompts found");
  }

  const content: string[] = [];

  if (instructions) {
    content.push("--- Instructions ---", instructions);
  }

  if (textPrompts.length) {
    content.push("--- Text Prompts ---", ...textPrompts);
  }

  if (documentTexts.length) {
    content.push("--- Document Text ---", ...documentTexts);
  }

  if (linkTexts.length) {
    content.push("--- Link Context ---", ...linkTexts);
  }

  if (imageDescriptions.length) {
    content.push("--- Image Descriptions ---", ...imageDescriptions);
  }

  const attachments: FileUIPart[] = [];

  for (const image of images) {
    attachments.push({
      mediaType: image.type,
      type: "file",
      url: image.url,
    });
  }

  for (const video of videos) {
    attachments.push({
      mediaType: video.type,
      type: "file",
      url: video.url,
    });
  }

  for (const document of documents) {
    attachments.push({
      mediaType: document.type,
      type: "file",
      url: document.url,
    });
  }

  return {
    attachments,
    prompt: content.join("\n") || "Use the provided media as context.",
  };
};

export const getTextResultFromMessage = (
  message: UIMessage
): TextNodeResult => ({
  output: {
    text: message.parts.find((part) => part.type === "text")?.text ?? "",
  },
  sources: message.parts
    .filter((part) => part.type === "source-url")
    .map((part) => ({
      title: part.title,
      type: "source-url" as const,
      url: part.url,
    })),
  text: message.parts.find((part) => part.type === "text")?.text ?? "",
});
