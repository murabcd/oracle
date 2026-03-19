import { buildPromptSections, joinPromptBlocks } from "./utils";

export const mermaidSystemPrompt = [
  "You generate Mermaid diagram source code.",
  "Return only valid Mermaid syntax with no markdown fences, no prose, and no explanations.",
  "Prefer concise diagrams that communicate structure clearly.",
  "Use supported diagram types from beautiful-mermaid: flowcharts, state diagrams, sequence diagrams, class diagrams, and er diagrams.",
  "If the request is ambiguous, choose the clearest flowchart representation.",
  "Do not emit HTML, JSON, or surrounding commentary.",
].join("\n");

export const buildMermaidGenerationPrompt = ({
  instructions,
  prompt,
  startingSource,
}: {
  instructions?: string;
  prompt?: string;
  startingSource?: string;
}) =>
  joinPromptBlocks([
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingSource ? `Current Mermaid:\n${startingSource}` : null,
    "Output raw Mermaid only.",
  ]);

export const buildMermaidNodeContextPrompt = ({
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
