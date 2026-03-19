import { buildPromptSections, joinPromptBlocks } from "./utils";

export const pdfExtractionPrompt = [
  "Extract the readable text from this document.",
  "Preserve headings, bullets, and section order when possible.",
  "Return plain text only.",
].join("\n");

export const documentSystemPrompt = [
  "You generate polished documents for an embedded document node.",
  "Return plain markdown only.",
  "Do not wrap the result in code fences.",
  "Use concise headings, bullets, and short sections when useful.",
].join("\n");

export const buildDocumentGenerationPrompt = ({
  instructions,
  prompt,
  startingText,
}: {
  instructions?: string;
  prompt?: string;
  startingText?: string;
}) =>
  joinPromptBlocks([
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingText ? `Current document:\n${startingText}` : null,
    "Generate the document.",
  ]);

export const buildDocumentNodeContextPrompt = ({
  documentTexts,
  imageDescriptions,
  linkTexts,
  textPrompts,
}: {
  documentTexts: string[];
  imageDescriptions: string[];
  linkTexts: string[];
  textPrompts: string[];
}) =>
  buildPromptSections([
    { heading: "Text Context", values: textPrompts },
    { heading: "Document Context", values: documentTexts },
    { heading: "Link Context", values: linkTexts },
    { heading: "Image Context", values: imageDescriptions },
  ]);
