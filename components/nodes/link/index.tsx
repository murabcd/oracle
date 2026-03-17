import { useNodeConnections } from "@xyflow/react";
import type { BaseNodeData, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { LinkPrimitive } from "./primitive";
import { LinkTransform } from "./transform";

export interface LinkNodeConfig {
  [key: string]: unknown;
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
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? LinkTransform : LinkPrimitive;

  return (
    <Component
      {...props}
      data={initializeNodeData(props.data)}
      title="Source"
    />
  );
};
