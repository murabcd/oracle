import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import type { infer as zInfer } from "zod";
import { jsonRenderRules } from "@/lib/ai/prompts/json-render";

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

export const jsonRenderSystemPrompt = jsonRenderCatalog.prompt({
  customRules: jsonRenderRules,
});

export const jsonRenderSchema = jsonRenderCatalog.zodSchema();

export type JsonRenderSpec = zInfer<typeof jsonRenderSchema>;

export const parseJsonRenderSpec = (input: string) =>
  jsonRenderSchema.parse(JSON.parse(input));

export const serializeJsonRenderSpec = (spec: JsonRenderSpec) =>
  JSON.stringify(spec, null, 2);
