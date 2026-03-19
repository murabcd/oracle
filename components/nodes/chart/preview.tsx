"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartSpec } from "@/lib/chart/catalog";
import { cn } from "@/lib/utils";

const getSeriesColor = (index: number, color?: string) =>
  color ?? `var(--color-chart-${(index % 5) + 1})`;

const buildChartConfig = (spec: ChartSpec) =>
  Object.fromEntries(
    spec.series.map((series, index) => [
      series.key,
      {
        color: getSeriesColor(index, series.color ?? undefined),
        label: series.label,
      },
    ])
  );

const toChartRows = (spec: ChartSpec) =>
  spec.data.map((datum) => ({
    ...Object.fromEntries(
      spec.series.map((series, index) => [series.key, datum.values[index] ?? 0])
    ),
    label: datum.label,
  }));

const renderSeries = (spec: ChartSpec) =>
  spec.series.map((series, index) => {
    const color = getSeriesColor(index, series.color ?? undefined);

    switch (spec.type) {
      case "area":
        return (
          <Area
            dataKey={series.key}
            fill={color}
            fillOpacity={0.24}
            key={series.key}
            stackId={spec.stacked ? "chart-stack" : undefined}
            stroke={color}
            strokeWidth={2}
            type="monotone"
          />
        );
      case "line":
        return (
          <Line
            dataKey={series.key}
            dot={false}
            key={series.key}
            stroke={color}
            strokeWidth={2}
            type="monotone"
          />
        );
      case "bar":
        return (
          <Bar
            dataKey={series.key}
            fill={color}
            key={series.key}
            radius={[8, 8, 0, 0]}
            stackId={spec.stacked ? "chart-stack" : undefined}
          />
        );
      default:
        return null;
    }
  });

export const ChartPreview = ({
  className,
  emptyMessage,
  spec,
}: {
  className?: string;
  emptyMessage?: string;
  spec?: ChartSpec;
}) => {
  const chartPaddingStyle = {
    padding: "calc(1rem * var(--node-scale, 1))",
  } as const;

  if (!spec) {
    return (
      <div
        className={cn(
          "flex min-h-0 flex-1 items-center justify-center rounded-t-3xl rounded-b-xl bg-secondary/60 px-4 text-center",
          className
        )}
      >
        <p className="max-w-56 text-pretty text-muted-foreground text-sm">
          {emptyMessage ?? "No chart data to preview yet."}
        </p>
      </div>
    );
  }

  const chartConfig = buildChartConfig(spec);
  const chartRows = toChartRows(spec);
  let ChartRoot: typeof BarChart | typeof LineChart | typeof AreaChart =
    AreaChart;

  if (spec.type === "bar") {
    ChartRoot = BarChart;
  } else if (spec.type === "line") {
    ChartRoot = LineChart;
  }

  return (
    <div
      className={cn(
        "nowheel flex min-h-0 flex-1 flex-col overflow-auto rounded-t-3xl rounded-b-xl bg-secondary/60",
        className
      )}
      style={chartPaddingStyle}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {spec.title || spec.description ? (
          <header className="space-y-1">
            {spec.title ? (
              <p
                className="font-medium text-foreground"
                style={{ fontSize: "calc(0.875rem * var(--node-scale, 1))" }}
              >
                {spec.title}
              </p>
            ) : null}
            {spec.description ? (
              <p
                className="text-muted-foreground"
                style={{ fontSize: "calc(0.75rem * var(--node-scale, 1))" }}
              >
                {spec.description}
              </p>
            ) : null}
          </header>
        ) : null}
        <ChartContainer
          className="h-full min-h-0 w-full flex-1"
          config={chartConfig}
          fitContainer
        >
          <ChartRoot accessibilityLayer data={chartRows}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              minTickGap={24}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={36}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={spec.type !== "line"}
            />
            <ChartLegend content={<ChartLegendContent />} />
            {renderSeries(spec)}
          </ChartRoot>
        </ChartContainer>
      </div>
    </div>
  );
};
