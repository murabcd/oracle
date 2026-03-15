import type { Spec } from "@json-render/core";
import { useNodeConnections } from "@xyflow/react";
import type { JsonRenderSpec } from "@/lib/json-render/catalog";
import type { BaseNodeData, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { JsonRenderPrimitive } from "./primitive";
import { JsonRenderTransform } from "./transform";

export interface JsonRenderNodeConfig {
  [key: string]: unknown;
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
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length
    ? JsonRenderTransform
    : JsonRenderPrimitive;

  return (
    <Component
      {...props}
      data={initializeNodeData(props.data)}
      title="Interface"
    />
  );
};
