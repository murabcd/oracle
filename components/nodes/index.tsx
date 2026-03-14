import { DropNode } from "./drop";
import { ImageNode } from "./image";
import { JsonRenderNode } from "./json-render";
import { TextNode } from "./text";
import { VideoNode } from "./video";

export const nodeTypes = {
  image: ImageNode,
  "json-render": JsonRenderNode,
  text: TextNode,
  drop: DropNode,
  video: VideoNode,
};
