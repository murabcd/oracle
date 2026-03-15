"use client";

import { getIncomers, useNodeConnections, useReactFlow } from "@xyflow/react";
import {
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { NodeLayout } from "@/components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNodeGenerateHotkeys } from "@/hooks/use-node-generate-hotkeys";
import { handleError } from "@/lib/error/handle";
import {
  downloadMermaidSvg,
  generateMermaidRequest,
} from "@/lib/mermaid/client";
import { filterModelsByVideoInput } from "@/lib/model-catalog";
import {
  markNodeError,
  markNodeRunning,
  patchNodeConfig,
  replaceNodeResult,
} from "@/lib/node-data";
import {
  getDescriptionsFromImageNodes,
  getTextFromTextNodes,
  getVideosFromVideoNodes,
} from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ModelSelector } from "../model-selector";
import type { MermaidNodeProps } from ".";
import { MermaidPreview } from "./view";

type MermaidTransformProps = MermaidNodeProps & {
  title: string;
};

const getDefaultModel = (
  models: ReturnType<typeof useModels>["models"]
): string => {
  const defaultModel = Object.entries(models).find(
    ([, model]) => model.default
  );

  if (defaultModel) {
    return defaultModel[0];
  }

  const firstModel = Object.keys(models)[0];

  if (!firstModel) {
    throw new Error("No text models available");
  }

  return firstModel;
};

const getSelectedModelId = ({
  availableModels,
  model,
}: {
  availableModels: ReturnType<typeof useModels>["models"];
  model?: string;
}) => {
  if (model && availableModels[model]) {
    return model;
  }

  if (!Object.keys(availableModels).length) {
    return "";
  }

  return getDefaultModel(availableModels);
};

export const MermaidTransform = ({
  data,
  id,
  type,
  title,
}: MermaidTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const incomingConnections = useNodeConnections({
    id,
    handleType: "target",
  });
  const { resolvedTheme } = useTheme();
  const { models } = useModels();
  const [loading, setLoading] = useState(false);
  const hasVideoInput = useMemo(
    () =>
      incomingConnections.some((connection) => {
        const sourceNode = getNodes().find(
          (node) => node.id === connection.source
        );

        return sourceNode?.type === "video";
      }),
    [getNodes, incomingConnections]
  );
  const availableModels = useMemo(
    () => filterModelsByVideoInput(models, hasVideoInput),
    [hasVideoInput, models]
  );
  const hasAvailableModels = Object.keys(availableModels).length > 0;
  const modelId = getSelectedModelId({
    availableModels,
    model: data.config.model,
  });
  const previewSource = data.result?.source ?? data.config.source;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!hasAvailableModels) {
      handleError("Error generating diagram", "No compatible models found");
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);
    const videos = getVideosFromVideoNodes(incomers);

    if (
      !(
        textPrompts.length ||
        imageDescriptions.length ||
        videos.length ||
        data.config.instructions
      )
    ) {
      handleError("Error generating diagram", "No prompts found");
      return;
    }

    const content: string[] = [];

    if (textPrompts.length) {
      content.push("--- Text Context ---", ...textPrompts);
    }

    if (imageDescriptions.length) {
      content.push("--- Image Context ---", ...imageDescriptions);
    }

    try {
      setLoading(true);
      updateNodeData(id, markNodeRunning(data));

      const response = await generateMermaidRequest({
        prompt: content.join("\n"),
        modelId,
        instructions: data.config.instructions,
        startingSource: data.result?.source ?? data.config.source,
        videos,
      });

      updateNodeData(
        id,
        replaceNodeResult(data, {
          output: {
            text: response.source,
          },
          source: response.source,
        })
      );

      toast.success("Diagram generated");
    } catch (error) {
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error ? error.message : "Failed to generate diagram"
        )
      );
      handleError("Error generating diagram", error);
    } finally {
      setLoading(false);
    }
  }, [
    data,
    getEdges,
    getNodes,
    hasAvailableModels,
    id,
    loading,
    modelId,
    updateNodeData,
  ]);

  const handleCopy = useCallback(() => {
    const value = data.result?.source ?? data.config.source;

    if (!value) {
      return;
    }

    navigator.clipboard.writeText(value);
    toast.success("Mermaid copied");
  }, [data.config.source, data.result?.source]);

  const handleDownload = useCallback(async () => {
    try {
      await downloadMermaidSvg({
        id,
        resolvedTheme,
        source: previewSource ?? "",
      });
    } catch (error) {
      handleError("Error downloading Mermaid", error);
    }
  }, [id, previewSource, resolvedTheme]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    const nextInstructions = event.target.value;
    const hasExistingInstructions = Boolean(
      data.config.instructions?.trim().length
    );

    updateNodeData(
      id,
      patchNodeConfig(
        data,
        {
          instructions: nextInstructions,
        },
        hasExistingInstructions ? new Date().toISOString() : data.meta.updatedAt
      )
    );
  };
  const textareaHotkeysRef = useNodeGenerateHotkeys({
    disabled: loading || !hasAvailableModels,
    onGenerate: handleGenerate,
  });

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>["toolbar"]>(() => {
    const items: ComponentProps<typeof NodeLayout>["toolbar"] = [
      {
        id: `model-${id}`,
        children: (
          <ModelSelector
            className="w-[200px] rounded-full"
            disabled={!hasAvailableModels}
            id={id}
            onChange={(value) =>
              updateNodeData(
                id,
                patchNodeConfig(data, {
                  model: value,
                })
              )
            }
            options={availableModels}
            value={modelId}
          />
        ),
      },
    ];

    items.push(
      loading
        ? {
            id: `status-${id}`,
            tooltip: "Generating...",
            children: (
              <Button className="rounded-full" disabled size="icon">
                <Loader2Icon className="animate-spin" size={12} />
              </Button>
            ),
          }
        : {
            id: `generate-${id}`,
            tooltip: data.result?.source ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={!hasAvailableModels}
                onClick={handleGenerate}
                size="icon"
              >
                {data.result?.source ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.result?.source || data.config.source) {
      items.push({
        id: `copy-${id}`,
        tooltip: "Copy Mermaid",
        children: (
          <Button
            className="rounded-full"
            onClick={handleCopy}
            size="icon"
            variant="ghost"
          >
            <CopyIcon size={12} />
          </Button>
        ),
      });
      items.push({
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
      });
    }

    return items;
  }, [
    data,
    handleCopy,
    handleDownload,
    handleGenerate,
    id,
    loading,
    modelId,
    availableModels,
    hasAvailableModels,
    updateNodeData,
  ]);

  return (
    <NodeLayout
      bodyClassName="flex h-full flex-col"
      contentClassName="h-full"
      data={data}
      id={id}
      title={title}
      toolbar={toolbar}
      type={type}
    >
      <MermaidPreview
        emptyContent={
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate mermaid.
          </p>
        }
        source={previewSource ?? ""}
      />
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        onChange={handleInstructionsChange}
        placeholder="Enter instruction..."
        ref={textareaHotkeysRef}
        value={data.config.instructions ?? ""}
      />
    </NodeLayout>
  );
};
