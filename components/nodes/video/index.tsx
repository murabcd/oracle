import type {
  BaseNodeData,
  NodeConfigBase,
  NodeFile,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { VideoPrimitive } from "./primitive";
import { VideoTransform } from "./transform";

export interface VideoNodeConfig extends NodeConfigBase {
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
  const data = initializeNodeData<VideoNodeConfig, VideoNodeResult>(props.data);
  const Component =
    data.config.mode === "transform" ? VideoTransform : VideoPrimitive;

  return <Component {...props} data={data} title="Video" />;
};
