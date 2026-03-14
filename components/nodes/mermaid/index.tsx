import { useNodeConnections } from "@xyflow/react";
import { MermaidPrimitive } from "./primitive";
import { MermaidTransform } from "./transform";

export interface MermaidNodeProps {
  type: string;
  data: {
    createdAt?: string;
    generated?: {
      source: string;
    };
    instructions?: string;
    model?: string;
    source?: string;
    updatedAt?: string;
  };
  id: string;
}

export const MermaidNode = (props: MermaidNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? MermaidTransform : MermaidPrimitive;

  return <Component {...props} title="Mermaid" />;
};
