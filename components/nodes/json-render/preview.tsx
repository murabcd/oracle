"use client";

import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import type { JsonRenderSpec } from "@/lib/json-render/catalog";
import { jsonRenderRegistry } from "@/lib/json-render/registry";
import { cn } from "@/lib/utils";

export const JsonRenderPreview = ({
  className,
  spec,
}: {
  className?: string;
  spec: JsonRenderSpec;
}) => (
  <div
    className={cn(
      "nowheel overflow-auto rounded-t-3xl rounded-b-xl bg-[radial-gradient(circle_at_top_left,_rgba(18,171,116,0.18),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.06),_rgba(255,255,255,0.02))] p-3",
      className
    )}
  >
    <div className="min-h-56 rounded-[22px] border border-white/10 bg-[#101312]/90 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <JSONUIProvider initialState={{}} registry={jsonRenderRegistry}>
        <Renderer registry={jsonRenderRegistry} spec={spec as Spec} />
      </JSONUIProvider>
    </div>
  </div>
);
