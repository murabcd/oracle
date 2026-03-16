import { z } from "zod";

export const chartTypeSchema = z.enum(["area", "bar", "line"]);

export const chartSeriesSchema = z.object({
  color: z.string().nullable(),
  key: z.string().min(1),
  label: z.string().min(1),
});

export const chartDatumSchema = z.object({
  label: z.string().min(1),
  values: z.array(z.number()).min(1).max(5),
});

export const chartSpecSchema = z
  .object({
    data: z.array(chartDatumSchema).min(1),
    description: z.string().min(1).nullable(),
    series: z.array(chartSeriesSchema).min(1).max(5),
    stacked: z.boolean().nullable(),
    title: z.string().min(1).nullable(),
    type: chartTypeSchema,
  })
  .superRefine((spec, context) => {
    for (const [index, datum] of spec.data.entries()) {
      if (datum.values.length !== spec.series.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "each data point must provide one value per series",
          path: ["data", index, "values"],
        });
      }
    }
  });

export type ChartSpec = z.infer<typeof chartSpecSchema>;

export const parseChartSpec = (value: string): ChartSpec =>
  chartSpecSchema.parse(JSON.parse(value));

export const serializeChartSpec = (value: ChartSpec) =>
  JSON.stringify(value, null, 2);
