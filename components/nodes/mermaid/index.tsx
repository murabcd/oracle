import { useNodeConnections } from "@xyflow/react";
import type { BaseNodeData, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { MermaidPrimitive } from "./primitive";
import { MermaidTransform } from "./transform";

export interface MermaidNodeConfig {
  [key: string]: unknown;
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
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? MermaidTransform : MermaidPrimitive;

  return (
    <Component
      {...props}
      data={initializeNodeData(props.data)}
      title="Mermaid"
    />
  );
};
