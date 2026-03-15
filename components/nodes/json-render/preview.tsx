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
  spec: JsonRenderSpec | Spec;
}) => (
  <div
    className={cn(
      "nowheel overflow-auto rounded-t-3xl rounded-b-xl bg-secondary/60 p-3",
      className
    )}
  >
    <div className="min-h-full p-1 text-white">
      <JSONUIProvider initialState={{}} registry={jsonRenderRegistry}>
        <Renderer registry={jsonRenderRegistry} spec={spec as Spec} />
      </JSONUIProvider>
    </div>
  </div>
);
