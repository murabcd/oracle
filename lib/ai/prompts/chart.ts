import type { ChartSpec } from "@/lib/chart/catalog";
import { serializeChartSpec } from "@/lib/chart/catalog";
import { buildPromptSections, joinPromptBlocks } from "./utils";

export const chartSystemPrompt = [
  "You generate compact chart specifications for an embedded chart node.",
  "Use only line, bar, or area charts.",
  "Prefer 4 to 8 data points unless the context clearly provides more.",
  "Choose readable labels and realistic values.",
  "Each data point uses a label plus a values array aligned to the series array.",
  "Every data point values array must have exactly one numeric value per series.",
  "Return a chart spec that is immediately renderable.",
].join("\n");

export const buildChartGenerationPrompt = ({
  instructions,
  prompt,
  startingSpec,
}: {
  instructions?: string;
  prompt?: string;
  startingSpec?: ChartSpec;
}) =>
  joinPromptBlocks([
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
    startingSpec
      ? `Current chart spec:\n${serializeChartSpec(startingSpec)}`
      : null,
    "Generate a compact chart spec.",
  ]);

export const buildChartNodeContextPrompt = ({
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
