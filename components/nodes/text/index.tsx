import type { JSONContent } from "@tiptap/core";
import { useNodeConnections } from "@xyflow/react";
import { TextPrimitive } from "./primitive";
import { TextTransform } from "./transform";

export interface TextNodeProps {
  type: string;
  data: {
    createdAt?: string;
    generated?: {
      text: string;
    };
    model?: string;
    updatedAt?: string;
    instructions?: string;
    webSearchEnabled?: boolean;

    // Tiptap generated JSON content
    content?: JSONContent;

    // Tiptap text content
    text?: string;
  };
  id: string;
}

export const TextNode = (props: TextNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? TextTransform : TextPrimitive;

  return <Component {...props} title="Text" />;
};
