import { getIncomers, useNodeConnections, useReactFlow } from "@xyflow/react";
import { CopyIcon, Loader2Icon, PlayIcon, RotateCcwIcon } from "lucide-react";
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
import { serializeChartSpec } from "@/lib/chart/catalog";
import { generateChartRequest } from "@/lib/chart/client";
import { handleError } from "@/lib/error/handle";
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
import type { ChartNodeProps } from ".";
import { ChartPreview } from "./preview";

type ChartTransformProps = ChartNodeProps & {
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

export const ChartTransform = ({
  data,
  id,
  type,
  title,
}: ChartTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const incomingConnections = useNodeConnections({
    id,
    handleType: "target",
  });
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
  const currentSpec = data.result?.spec ?? data.config.spec;
  const previewJson =
    data.result?.json ??
    data.config.json ??
    (currentSpec ? serializeChartSpec(currentSpec) : undefined);

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!hasAvailableModels) {
      handleError("Error generating chart", "No compatible models found");
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
        data.config.instructions ||
        currentSpec
      )
    ) {
      handleError("Error generating chart", "No prompts found");
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

      const response = await generateChartRequest({
        prompt: content.join("\n"),
        modelId,
        instructions: data.config.instructions,
        startingSpec: currentSpec,
        videos,
      });

      updateNodeData(
        id,
        replaceNodeResult(data, {
          json: response.json,
          output: {
            json: response.spec,
            text: response.json,
          },
          spec: response.spec,
        })
      );

      toast.success("Chart generated");
    } catch (error) {
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error ? error.message : "Failed to generate chart"
        )
      );
      handleError("Error generating chart", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentSpec,
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
    if (!previewJson) {
      return;
    }

    navigator.clipboard.writeText(previewJson);
    toast.success("Chart JSON copied");
  }, [previewJson]);

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
            tooltip: currentSpec ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={!hasAvailableModels}
                onClick={handleGenerate}
                size="icon"
              >
                {currentSpec ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (previewJson) {
      items.push({
        id: `copy-${id}`,
        tooltip: "Copy chart JSON",
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
    }

    return items;
  }, [
    availableModels,
    currentSpec,
    data,
    handleCopy,
    handleGenerate,
    hasAvailableModels,
    id,
    loading,
    modelId,
    previewJson,
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
      <ChartPreview
        emptyMessage="Press play to generate a chart."
        spec={currentSpec}
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
