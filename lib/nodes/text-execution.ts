import type { Node } from "@xyflow/react";
import type { FileUIPart, UIMessage } from "ai";
import type { TextNodeConfig, TextNodeResult } from "@/components/nodes/text";
import {
  buildTextNodePrompt,
  defaultTextNodePrompt,
} from "@/lib/ai/prompts/text";

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
  const {
    documents,
    documentTexts,
    imageDescriptions,
    images,
    linkTexts,
    prompt,
    textPrompts,
    videos,
  } = buildTextNodePrompt({
    incomers,
    instructions,
  });

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
    prompt: prompt || defaultTextNodePrompt,
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
