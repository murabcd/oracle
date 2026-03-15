import { useNodeConnections } from "@xyflow/react";
import type { BaseNodeData, NodeFile, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { VideoPrimitive } from "./primitive";
import { VideoTransform } from "./transform";

export interface VideoNodeConfig {
  [key: string]: unknown;
  height?: number;
  instructions?: string;
  model?: string;
  source?: NodeFile;
  width?: number;
}

export interface VideoNodeResult extends NodeResultBase {
  [key: string]: unknown;
  video?: NodeFile;
}

export interface VideoNodeProps {
  type: string;
  data: BaseNodeData<VideoNodeConfig, VideoNodeResult>;
  id: string;
}

export const VideoNode = (props: VideoNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? VideoTransform : VideoPrimitive;

  return (
    <Component {...props} data={initializeNodeData(props.data)} title="Video" />
  );
};
