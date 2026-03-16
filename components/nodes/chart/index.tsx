import { useNodeConnections } from "@xyflow/react";
import type { ChartSpec } from "@/lib/chart/catalog";
import type { BaseNodeData, NodeResultBase } from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { ChartPrimitive } from "./primitive";
import { ChartTransform } from "./transform";

export interface ChartNodeConfig {
  [key: string]: unknown;
  instructions?: string;
  json?: string;
  model?: string;
  spec?: ChartSpec;
}

export interface ChartNodeResult extends NodeResultBase {
  [key: string]: unknown;
  json: string;
  spec: ChartSpec;
}

export interface ChartNodeProps {
  type: string;
  data: BaseNodeData<ChartNodeConfig, ChartNodeResult>;
  id: string;
}

export const ChartNode = (props: ChartNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? ChartTransform : ChartPrimitive;

  return (
    <Component {...props} data={initializeNodeData(props.data)} title="Chart" />
  );
};
