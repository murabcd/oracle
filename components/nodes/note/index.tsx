import { useReactFlow } from "@xyflow/react";
import { Textarea } from "@/components/ui/textarea";
import type { BaseNodeData, NodeConfigBase } from "@/lib/node-data";
import { initializeNodeData, patchNodeConfig } from "@/lib/node-data";
import { NodeLayout } from "../layout";

export interface NoteNodeConfig extends NodeConfigBase {
  text?: string;
}

export interface NoteNodeProps {
  data: BaseNodeData<NoteNodeConfig>;
  id: string;
  type: string;
}

export const NoteNode = ({ data: rawData, id, type }: NoteNodeProps) => {
  const { updateNodeData } = useReactFlow();
  const data = initializeNodeData<NoteNodeConfig>(rawData);

  return (
    <NodeLayout
      allowModeChange={false}
      bodyClassName="h-full bg-transparent"
      className="p-0"
      contentClassName="h-full rounded-[26px] border-none bg-transparent p-0 shadow-none ring-0"
      data={data}
      handles={{ source: false, target: false }}
      id={id}
      title="Note"
      type={type}
    >
      <div className="h-full rounded-[24px] border border-border/70 bg-card text-foreground shadow-[0_20px_40px_-28px_rgba(0,0,0,0.28)]">
        <div className="flex h-full flex-col p-4">
          <Textarea
            className="h-full max-h-none resize-none border-none bg-transparent px-0 py-0 text-[calc(1rem*var(--node-scale,1))] leading-[calc(1.6rem*var(--node-scale,1))] shadow-none focus-visible:ring-0 dark:bg-transparent"
            onChange={(event) => {
              updateNodeData(
                id,
                patchNodeConfig(data, {
                  text: event.target.value,
                })
              );
            }}
            placeholder="Capture a thought..."
            value={data.config.text ?? ""}
          />
        </div>
      </div>
    </NodeLayout>
  );
};
