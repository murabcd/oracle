import { AlertCircleIcon } from "lucide-react";
import { useMemo } from "react";
import { NodeLayout } from "@/components/nodes/layout";
import { parseChartSpec } from "@/lib/chart/catalog";
import type { ChartNodeProps } from ".";
import { ChartPreview } from "./preview";

type ChartPrimitiveProps = ChartNodeProps & {
  title: string;
};

export const ChartPrimitive = ({
  data,
  id,
  type,
  title,
}: ChartPrimitiveProps) => {
  const parsed = useMemo(() => {
    if (!data.config.json?.trim()) {
      return { error: null, spec: data.config.spec ?? null };
    }

    try {
      return {
        error: null,
        spec: parseChartSpec(data.config.json),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid chart spec",
        spec: null,
      };
    }
  }, [data.config.json, data.config.spec]);

  return (
    <NodeLayout
      bodyClassName="flex h-full flex-col"
      contentClassName="h-full"
      data={data}
      id={id}
      title={title}
      type={type}
    >
      <ChartPreview
        emptyMessage="Connect a text, image, or video node to generate a chart here."
        spec={parsed.spec ?? undefined}
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
