import { useNodeConnections } from "@xyflow/react";
import type { BaseNodeData, NodeFile, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { ImagePrimitive } from "./primitive";
import { ImageTransform } from "./transform";

export interface ImageNodeConfig {
  [key: string]: unknown;
  height?: number;
  instructions?: string;
  model?: string;
  source?: NodeFile;
  width?: number;
}

export interface ImageNodeResult extends NodeResultBase {
  [key: string]: unknown;
  description?: string;
  image?: NodeFile;
}

export interface ImageNodeProps {
  type: string;
  data: BaseNodeData<ImageNodeConfig, ImageNodeResult>;
  id: string;
}

export const ImageNode = (props: ImageNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? ImageTransform : ImagePrimitive;

  return (
    <Component {...props} data={initializeNodeData(props.data)} title="Image" />
  );
};
