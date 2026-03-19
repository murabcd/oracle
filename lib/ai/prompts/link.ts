import { buildPromptSections, joinPromptBlocks } from "./utils";

export const linkSystemPrompt = [
  "You generate a single best URL for a link node.",
  "Return exactly one absolute http or https URL.",
  "Do not include markdown, labels, commentary, or code fences.",
  "Prefer official, stable, primary-source URLs when possible.",
].join("\n");

export const buildLinkGenerationPrompt = ({
  instructions,
  prompt,
  startingUrl,
}: {
  instructions?: string;
  prompt?: string;
  startingUrl?: string;
}) =>
  joinPromptBlocks([
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingUrl ? `Current URL:\n${startingUrl}` : null,
    "Return the single best URL for this link node.",
  ]);

export const buildLinkNodeContextPrompt = ({
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
