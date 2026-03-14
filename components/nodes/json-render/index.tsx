import type { Spec } from "@json-render/core";
import { useNodeConnections } from "@xyflow/react";
import type { JsonRenderSpec } from "@/lib/json-render/catalog";
import { JsonRenderPrimitive } from "./primitive";
import { JsonRenderTransform } from "./transform";

export interface JsonRenderNodeProps {
  type: string;
  data: {
    createdAt?: string;
    updatedAt?: string;
    model?: string;
    instructions?: string;
    json?: string;
    spec?: JsonRenderSpec;
    previewSpec?: Spec;
    generated?: {
      json: string;
      spec: JsonRenderSpec;
    };
  };
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

  return <Component {...props} title="Interface" />;
};
