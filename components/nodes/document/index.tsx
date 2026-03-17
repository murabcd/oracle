import { useNodeConnections } from "@xyflow/react";
import type { BaseNodeData, NodeFile, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { DocumentPrimitive } from "./primitive";
import { DocumentTransform } from "./transform";

export interface DocumentNodeConfig {
  [key: string]: unknown;
  instructions?: string;
  model?: string;
  source?: NodeFile;
}

export interface DocumentNodeResult extends NodeResultBase {
  [key: string]: unknown;
  generated?: boolean;
  text: string;
}

export interface DocumentNodeProps {
  type: string;
  data: BaseNodeData<DocumentNodeConfig, DocumentNodeResult>;
  id: string;
}

export const DocumentNode = (props: DocumentNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? DocumentTransform : DocumentPrimitive;

  return (
    <Component
      {...props}
      data={initializeNodeData(props.data)}
      title="Document"
    />
  );
};
