import type { Node } from "@xyflow/react";
import {
  getDescriptionsFromImageNodes,
  getDocumentsFromDocumentNodes,
  getImagesFromImageNodes,
  getTextFromDocumentNodes,
  getTextFromLinkNodes,
  getTextFromTextNodes,
  getVideosFromVideoNodes,
} from "@/lib/xyflow";
import { buildPromptSections } from "./utils";

export const defaultTextNodePrompt = "Use the provided media as context.";

export const buildTextNodePrompt = ({
  incomers,
  instructions,
}: {
  incomers: Node[];
  instructions?: string;
}) => {
  const textPrompts = getTextFromTextNodes(incomers);
  const documentTexts = getTextFromDocumentNodes(incomers);
  const linkTexts = getTextFromLinkNodes(incomers);
  const imageDescriptions = getDescriptionsFromImageNodes(incomers);

  const prompt = buildPromptSections([
    {
      heading: "Instructions",
      values: instructions ? [instructions] : [],
    },
    { heading: "Text Prompts", values: textPrompts },
    { heading: "Document Text", values: documentTexts },
    { heading: "Link Context", values: linkTexts },
    { heading: "Image Descriptions", values: imageDescriptions },
  ]);

  return {
    documentTexts,
    documents: getDocumentsFromDocumentNodes(incomers),
    imageDescriptions,
    images: getImagesFromImageNodes(incomers),
    linkTexts,
    prompt,
    textPrompts,
    videos: getVideosFromVideoNodes(incomers),
  };
};
