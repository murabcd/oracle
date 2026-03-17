import { ChartNode } from "./chart";
import { DocumentNode } from "./document";
import { DropNode } from "./drop";
import { ImageNode } from "./image";
import { JsonRenderNode } from "./interface";
import { LinkNode } from "./link";
import { MermaidNode } from "./mermaid";
import { TextNode } from "./text";
import { VideoNode } from "./video";

export const nodeTypes = {
  chart: ChartNode,
  document: DocumentNode,
  image: ImageNode,
  "json-render": JsonRenderNode,
  link: LinkNode,
  mermaid: MermaidNode,
  text: TextNode,
  drop: DropNode,
  video: VideoNode,
};
