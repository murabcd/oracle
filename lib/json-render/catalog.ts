import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import type { infer as zInfer } from "zod";

const componentDefinitions = {
  Alert: shadcnComponentDefinitions.Alert,
  Badge: shadcnComponentDefinitions.Badge,
  Button: shadcnComponentDefinitions.Button,
  Card: shadcnComponentDefinitions.Card,
  Checkbox: shadcnComponentDefinitions.Checkbox,
  Grid: shadcnComponentDefinitions.Grid,
  Heading: shadcnComponentDefinitions.Heading,
  Input: shadcnComponentDefinitions.Input,
  Progress: shadcnComponentDefinitions.Progress,
  Radio: shadcnComponentDefinitions.Radio,
  Select: shadcnComponentDefinitions.Select,
  Separator: shadcnComponentDefinitions.Separator,
  Stack: shadcnComponentDefinitions.Stack,
  Switch: shadcnComponentDefinitions.Switch,
  Tabs: shadcnComponentDefinitions.Tabs,
  Text: shadcnComponentDefinitions.Text,
  Textarea: shadcnComponentDefinitions.Textarea,
} as const;

export const jsonRenderCatalog = defineCatalog(schema, {
  components: componentDefinitions,
  actions: {},
});

const jsonRenderRules = [
  "Generate only interfaces that fit inside a compact embedded preview, not a full page app.",
  "Prefer Card, Stack, Grid, Heading, Text, Input, Checkbox, Select, Switch, Radio, Progress, Badge, Button, and Alert.",
  "For forms, use Card as the root element with a vertical Stack inside it.",
  "Keep copy concise and realistic. Use complete placeholder and label text.",
  "Do not generate authentication side effects, navigation, or data fetching flows.",
  "Buttons may exist visually, but keep the interface safe and self-contained.",
];

export const jsonRenderSystemPrompt = jsonRenderCatalog.prompt({
  customRules: jsonRenderRules,
});

export const jsonRenderSchema = jsonRenderCatalog.zodSchema();

export type JsonRenderSpec = zInfer<typeof jsonRenderSchema>;

export const parseJsonRenderSpec = (input: string) =>
  jsonRenderSchema.parse(JSON.parse(input));

export const serializeJsonRenderSpec = (spec: JsonRenderSpec) =>
  JSON.stringify(spec, null, 2);
