"use client";

import type { renderMermaid as RenderMermaidFn } from "@vercel/beautiful-mermaid";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { getMermaidRenderOptions } from "@/lib/mermaid";
import { cn } from "@/lib/utils";

interface MermaidPreviewProps {
  source: string;
  emptyMessage?: string;
  emptyContent?: ReactNode;
}

let mermaidRendererPromise: Promise<typeof RenderMermaidFn> | undefined;

const loadMermaidRenderer = () => {
  mermaidRendererPromise ??= import("@vercel/beautiful-mermaid").then(
    ({ renderMermaid }) => renderMermaid
  );

  return mermaidRendererPromise;
};

export const MermaidPreview = ({
  source,
  emptyMessage,
  emptyContent,
}: MermaidPreviewProps) => {
  const { resolvedTheme } = useTheme();
  const [state, setState] = useState<{
    error: string | null;
    loading: boolean;
    svg: string;
  }>({
    error: null,
    loading: true,
    svg: "",
  });

  useEffect(() => {
    const controller = new AbortController();

    const render = async () => {
      if (!source.trim()) {
        setState({
          error: null,
          loading: false,
          svg: "",
        });
        return;
      }

      setState((current) => ({
        ...current,
        error: null,
        loading: true,
      }));

      try {
        const renderMermaid = await loadMermaidRenderer();

        if (controller.signal.aborted) {
          return;
        }

        const svg = await renderMermaid(
          source,
          getMermaidRenderOptions(resolvedTheme)
        );

        if (!controller.signal.aborted) {
          setState({
            error: null,
            loading: false,
            svg,
          });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          error:
            error instanceof Error ? error.message : "Failed to render diagram",
          loading: false,
          svg: "",
        });
      }
    };

    render();

    return () => {
      controller.abort();
    };
  }, [resolvedTheme, source]);

  const content = (() => {
    if (state.loading) {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Loader2Icon
            className="size-4 animate-spin text-muted-foreground"
            size={16}
          />
        </div>
      );
    }

    if (state.svg) {
      return (
        <div
          className={cn(
            "nowheel flex flex-1 items-start justify-center overflow-auto p-4",
            "[&_svg]:h-full [&_svg]:max-h-full [&_svg]:w-full [&_svg]:max-w-full [&_svg]:rounded-2xl"
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG is produced by @vercel/beautiful-mermaid from local node input.
          dangerouslySetInnerHTML={{ __html: state.svg }}
        />
      );
    }

    return (
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center">
        {emptyContent ?? (
          <p className="max-w-56 text-pretty text-muted-foreground text-sm">
            {emptyMessage}
          </p>
        )}
      </div>
    );
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl rounded-b-xl bg-secondary/60">
      {content}
      {state.error ? (
        <div className="flex items-center gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
          <AlertCircleIcon size={12} />
          <span className="truncate">{state.error}</span>
        </div>
      ) : null}
    </div>
  );
};
