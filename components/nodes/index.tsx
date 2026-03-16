import { ChartNode } from "./chart";
import { DropNode } from "./drop";
import { ImageNode } from "./image";
import { JsonRenderNode } from "./json-render";
import { MermaidNode } from "./mermaid";
import { TextNode } from "./text";
import { VideoNode } from "./video";

export const nodeTypes = {
  chart: ChartNode,
  image: ImageNode,
  "json-render": JsonRenderNode,
  mermaid: MermaidNode,
  text: TextNode,
  drop: DropNode,
  video: VideoNode,
};
