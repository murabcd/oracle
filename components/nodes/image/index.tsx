import type {
  BaseNodeData,
  NodeConfigBase,
  NodeFile,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { ImagePrimitive } from "./primitive";
import { ImageTransform } from "./transform";

export interface ImageNodeConfig extends NodeConfigBase {
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
  const data = initializeNodeData<ImageNodeConfig, ImageNodeResult>(props.data);
  const Component =
    data.config.mode === "transform" ? ImageTransform : ImagePrimitive;

  return <Component {...props} data={data} title="Image" />;
};
