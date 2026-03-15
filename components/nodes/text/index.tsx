import type { JSONContent } from "@tiptap/core";
import { useNodeConnections } from "@xyflow/react";
import type { BaseNodeData, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { TextPrimitive } from "./primitive";
import { TextTransform } from "./transform";

export interface TextNodeConfig {
  [key: string]: unknown;
  content?: JSONContent;
  instructions?: string;
  model?: string;
  text?: string;
  webSearchEnabled?: boolean;
}

export interface TextNodeResult extends NodeResultBase {
  [key: string]: unknown;
  sources?: Array<{
    title?: string;
    type: "source-url";
    url: string;
  }>;
  text: string;
}

export interface TextNodeProps {
  type: string;
  data: BaseNodeData<TextNodeConfig, TextNodeResult>;
  id: string;
}

export const TextNode = (props: TextNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? TextTransform : TextPrimitive;

  return (
    <Component {...props} data={initializeNodeData(props.data)} title="Text" />
  );
};
