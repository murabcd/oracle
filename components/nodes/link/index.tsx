import type {
  BaseNodeData,
  NodeConfigBase,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { LinkPrimitive } from "./primitive";
import { LinkTransform } from "./transform";

export interface LinkNodeConfig extends NodeConfigBase {
  instructions?: string;
  model?: string;
  url?: string;
}

export interface LinkNodeResult extends NodeResultBase {
  [key: string]: unknown;
  description?: string;
  embedUrl?: string;
  hostname: string;
  image?: string;
  siteName?: string;
  title: string;
  url: string;
}

export interface LinkNodeProps {
  type: string;
  data: BaseNodeData<LinkNodeConfig, LinkNodeResult>;
  id: string;
}

export const LinkNode = (props: LinkNodeProps) => {
  const data = initializeNodeData<LinkNodeConfig, LinkNodeResult>(props.data);
  const Component =
    data.config.mode === "transform" ? LinkTransform : LinkPrimitive;

  return <Component {...props} data={data} title="Source" />;
};
