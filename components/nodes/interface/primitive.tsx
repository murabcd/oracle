import { AlertCircleIcon } from "lucide-react";
import { useMemo } from "react";
import { NodeLayout } from "@/components/nodes/layout";
import { parseJsonRenderSpec } from "@/lib/json-render/catalog";
import type { JsonRenderNodeProps } from ".";
import { JsonRenderPreview } from "./preview";

type JsonRenderPrimitiveProps = JsonRenderNodeProps & {
  title: string;
};

export const JsonRenderPrimitive = ({
  data,
  id,
  type,
  title,
}: JsonRenderPrimitiveProps) => {
  const parsed = useMemo(() => {
    if (!data.config.json?.trim()) {
      return { error: null, spec: null };
    }

    try {
      return {
        error: null,
        spec: parseJsonRenderSpec(data.config.json),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid JSON spec",
        spec: null,
      };
    }
  }, [data.config.json]);

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
            Connect a text, document, image, or video node to generate an
            interface here.
          </p>
        </div>
      )}
      {parsed.error ? (
        <div className="flex items-center gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
          <AlertCircleIcon size={12} />
          <span className="truncate">{parsed.error}</span>
        </div>
      ) : null}
    </NodeLayout>
  );
};
