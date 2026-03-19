import type { JSONContent } from "@tiptap/core";
import type {
  BaseNodeData,
  NodeConfigBase,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { TextPrimitive } from "./primitive";
import { TextTransform } from "./transform";

export interface TextNodeConfig extends NodeConfigBase {
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
  const data = initializeNodeData<TextNodeConfig, TextNodeResult>(props.data);
  const Component =
    data.config.mode === "transform" ? TextTransform : TextPrimitive;

  return <Component {...props} data={data} title="Text" />;
};
