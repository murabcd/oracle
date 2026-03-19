import type {
  BaseNodeData,
  NodeConfigBase,
  NodeFile,
  NodeResultBase,
} from "@/lib/node-data";
import { initializeNodeData } from "@/lib/node-data";
import { DocumentPrimitive } from "./primitive";
import { DocumentTransform } from "./transform";

export interface DocumentNodeConfig extends NodeConfigBase {
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
  const data = initializeNodeData<DocumentNodeConfig, DocumentNodeResult>(
    props.data
  );
  const Component =
    data.config.mode === "transform" ? DocumentTransform : DocumentPrimitive;

  return <Component {...props} data={data} title="Document" />;
};
