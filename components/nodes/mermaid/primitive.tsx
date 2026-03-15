"use client";

import { useReactFlow } from "@xyflow/react";
import { DownloadIcon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useMemo,
} from "react";
import { NodeLayout } from "@/components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { handleError } from "@/lib/error/handle";
import { downloadMermaidSvg } from "@/lib/mermaid/client";
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
  const { resolvedTheme } = useTheme();
  const source = data.source ?? "";
  const hasExistingSource = Boolean(data.source?.trim().length);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const nextSource = event.target.value;

    updateNodeData(id, {
      source: nextSource,
      ...(hasExistingSource ? { updatedAt: new Date().toISOString() } : {}),
    });
  };

  const handleDownload = useCallback(async () => {
    try {
      await downloadMermaidSvg({
        id,
        resolvedTheme,
        source,
      });
    } catch (error) {
      handleError("Error downloading Mermaid", error);
    }
  }, [id, resolvedTheme, source]);

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>["toolbar"]>(() => {
    if (!source.trim()) {
      return undefined;
    }

    return [
      {
        id: `download-${id}`,
        tooltip: "Download SVG",
        children: (
          <Button
            className="rounded-full"
            onClick={handleDownload}
            size="icon"
            variant="ghost"
          >
            <DownloadIcon size={12} />
          </Button>
        ),
      },
    ];
  }, [handleDownload, id, source]);

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
      toolbar={toolbar}
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
