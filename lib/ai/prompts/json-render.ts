import { joinPromptBlocks } from "./utils";

export const jsonRenderRules = [
  "Generate only interfaces that fit inside a compact embedded preview, not a full page app.",
  "Prefer Card, Stack, Grid, Heading, Text, Input, Checkbox, Select, Switch, Radio, Progress, Badge, Button, and Alert.",
  "For forms, use Card as the root element with a vertical Stack inside it.",
  "Keep copy concise and realistic. Use complete placeholder and label text.",
  "Do not generate authentication side effects, navigation, or data fetching flows.",
  "Buttons may exist visually, but keep the interface safe and self-contained.",
];

export const buildJsonRenderContextPrompt = ({
  instructions,
  prompt,
}: {
  instructions?: string;
  prompt?: string;
}) =>
  joinPromptBlocks([
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
  ]);

export const defaultJsonRenderPrompt = "Generate a compact embedded interface.";
