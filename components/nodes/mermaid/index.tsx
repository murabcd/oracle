import type {
  BaseNodeData,
  NodeConfigBase,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { MermaidPrimitive } from "./primitive";
import { MermaidTransform } from "./transform";

export interface MermaidNodeConfig extends NodeConfigBase {
  instructions?: string;
  model?: string;
  source?: string;
}

export interface MermaidNodeResult extends NodeResultBase {
  [key: string]: unknown;
  source: string;
}

export interface MermaidNodeProps {
  type: string;
  data: BaseNodeData<MermaidNodeConfig, MermaidNodeResult>;
  id: string;
}

export const MermaidNode = (props: MermaidNodeProps) => {
  const data = initializeNodeData<MermaidNodeConfig, MermaidNodeResult>(
    props.data
  );
  const Component =
    data.config.mode === "transform" ? MermaidTransform : MermaidPrimitive;

  return <Component {...props} data={data} title="Mermaid" />;
};
