import { useReactFlow } from "@xyflow/react";
import { AlertCircleIcon } from "lucide-react";
import { type ChangeEventHandler, useMemo } from "react";
import { NodeLayout } from "@/components/nodes/layout";
import { Textarea } from "@/components/ui/textarea";
import { parseJsonRenderSpec } from "@/lib/json-render/catalog";
import type { JsonRenderNodeProps } from ".";
import { JsonRenderPreview } from "./preview";

type JsonRenderPrimitiveProps = JsonRenderNodeProps & {
  title: string;
};

const placeholder = "Enter JSON...";

export const JsonRenderPrimitive = ({
  data,
  id,
  type,
  title,
}: JsonRenderPrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const parsed = useMemo(() => {
    if (!data.json?.trim()) {
      return { error: null, spec: null };
    }

    try {
      return {
        error: null,
        spec: parseJsonRenderSpec(data.json),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid JSON spec",
        spec: null,
      };
    }
  }, [data.json]);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const nextJson = event.target.value;

    try {
      const nextSpec = nextJson.trim()
        ? parseJsonRenderSpec(nextJson)
        : undefined;

      updateNodeData(id, {
        json: nextJson,
        spec: nextSpec,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      updateNodeData(id, {
        json: nextJson,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <NodeLayout
      bodyClassName="flex h-full flex-col"
      contentClassName="h-full"
      data={data}
      id={id}
      title={title}
      type={type}
    >
      {parsed.spec ? (
        <JsonRenderPreview className="min-h-72 flex-1" spec={parsed.spec} />
      ) : (
        <div className="flex min-h-72 flex-1 items-center justify-center rounded-t-3xl rounded-b-xl bg-secondary/60 px-4 text-center">
          <p className="max-w-52 text-pretty text-muted-foreground text-sm">
            Paste a valid JSON UI spec to preview it here.
          </p>
        </div>
      )}
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! font-mono text-xs shadow-none focus-visible:ring-0"
        onChange={handleChange}
        placeholder={placeholder}
        value={data.json ?? ""}
      />
      {parsed.error ? (
        <div className="flex items-center gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
          <AlertCircleIcon size={12} />
          <span className="truncate">{parsed.error}</span>
        </div>
      ) : null}
    </NodeLayout>
  );
};
