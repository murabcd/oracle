import type { Spec } from "@json-render/core";
import type { JsonRenderSpec } from "@/lib/json-render/catalog";
import type {
  BaseNodeData,
  NodeConfigBase,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { JsonRenderPrimitive } from "./primitive";
import { JsonRenderTransform } from "./transform";

export interface JsonRenderNodeConfig extends NodeConfigBase {
  instructions?: string;
  json?: string;
  model?: string;
  spec?: JsonRenderSpec;
}

export interface JsonRenderNodeResult extends NodeResultBase {
  [key: string]: unknown;
  json: string;
  previewSpec?: Spec;
  spec: JsonRenderSpec;
}

export interface JsonRenderNodeProps {
  type: string;
  data: BaseNodeData<JsonRenderNodeConfig, JsonRenderNodeResult>;
  id: string;
}

export const JsonRenderNode = (props: JsonRenderNodeProps) => {
  const data = initializeNodeData<JsonRenderNodeConfig, JsonRenderNodeResult>(
    props.data
  );
  const Component =
    data.config.mode === "transform"
      ? JsonRenderTransform
      : JsonRenderPrimitive;

  return <Component {...props} data={data} title="Interface" />;
};
