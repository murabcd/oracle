"use client";

import { useReactFlow } from "@xyflow/react";
import type { ChangeEventHandler } from "react";
import { NodeLayout } from "@/components/nodes/layout";
import { Textarea } from "@/components/ui/textarea";
import type { MermaidNodeProps } from ".";
import { MermaidPreview } from "./view";

type MermaidPrimitiveProps = MermaidNodeProps & {
  title: string;
};

const placeholder = "Enter mermaid...";

export const MermaidPrimitive = ({
  data,
  id,
  type,
  title,
}: MermaidPrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const source = data.source ?? "";
  const hasExistingSource = Boolean(data.source?.trim().length);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const nextSource = event.target.value;

    updateNodeData(id, {
      source: nextSource,
      ...(hasExistingSource ? { updatedAt: new Date().toISOString() } : {}),
    });
  };

  return (
    <NodeLayout
      bodyClassName="flex h-full flex-col"
      contentClassName="h-full"
      data={data}
      handles={{
        source: false,
      }}
      id={id}
      title={title}
      type={type}
    >
      <MermaidPreview
        emptyMessage="Write Mermaid syntax below to preview a diagram here."
        source={source}
      />
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! font-mono text-xs shadow-none focus-visible:ring-0"
        onChange={handleChange}
        placeholder={placeholder}
        spellCheck={false}
        value={source}
      />
    </NodeLayout>
  );
};
