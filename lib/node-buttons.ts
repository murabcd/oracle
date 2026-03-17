import {
  BarChart3Icon,
  FileTextIcon,
  FilmIcon,
  GlobeIcon,
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
    id: "chart",
    label: "Chart",
    icon: BarChart3Icon,
  },
  {
    id: "document",
    label: "Document",
    icon: FileTextIcon,
  },
  {
    id: "link",
    label: "Source",
    icon: GlobeIcon,
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
