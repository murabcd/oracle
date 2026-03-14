"use client";

import { defineRegistry } from "@json-render/react";
import { shadcnComponents } from "@json-render/shadcn";
import { jsonRenderCatalog } from "./catalog";

export const { registry: jsonRenderRegistry } = defineRegistry(
  jsonRenderCatalog,
  {
    components: {
      Alert: shadcnComponents.Alert,
      Badge: shadcnComponents.Badge,
      Button: shadcnComponents.Button,
      Card: shadcnComponents.Card,
      Checkbox: shadcnComponents.Checkbox,
      Grid: shadcnComponents.Grid,
      Heading: shadcnComponents.Heading,
      Input: shadcnComponents.Input,
      Progress: shadcnComponents.Progress,
      Radio: shadcnComponents.Radio,
      Select: shadcnComponents.Select,
      Separator: shadcnComponents.Separator,
      Stack: shadcnComponents.Stack,
      Switch: shadcnComponents.Switch,
      Tabs: shadcnComponents.Tabs,
      Text: shadcnComponents.Text,
      Textarea: shadcnComponents.Textarea,
    },
  }
);
