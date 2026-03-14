import {
  FilmIcon,
  ImageIcon,
  PaintbrushIcon,
  TextIcon,
  WorkflowIcon,
} from "lucide-react";

export const nodeButtons = [
  {
    id: "text",
    label: "Text",
    icon: TextIcon,
  },
  {
    id: "image",
    label: "Image",
    icon: ImageIcon,
  },
  {
    id: "video",
    label: "Video",
    icon: FilmIcon,
  },
  {
    id: "json-render",
    label: "Interface",
    icon: PaintbrushIcon,
  },
  {
    id: "mermaid",
    label: "Mermaid",
    icon: WorkflowIcon,
  },
];
