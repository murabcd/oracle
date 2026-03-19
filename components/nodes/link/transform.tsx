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
import { buildLinkNodeContextPrompt } from "@/lib/ai/prompts/link";
import { handleError } from "@/lib/error/handle";
import { generateLinkRequest } from "@/lib/link/client";
import { filterModelsByVideoInput } from "@/lib/model-catalog";
import {
  markNodeError,
  markNodeRunning,
  patchNodeConfig,
  replaceNodeResult,
} from "@/lib/node-data";
import {
  getDescriptionsFromImageNodes,
  getDocumentsFromDocumentNodes,
  getTextFromDocumentNodes,
  getTextFromLinkNodes,
  getTextFromTextNodes,
  getVideosFromVideoNodes,
  hasVideoLikeInput,
  isVideoLikeUrl,
} from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ModelSelector } from "../model-selector";
import type { LinkNodeProps } from ".";
import { LinkPreview } from "./preview";

type LinkTransformProps = LinkNodeProps & {
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

export const LinkTransform = ({
  data,
  id,
  type,
  title,
}: LinkTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const incomingConnections = useNodeConnections({
    id,
    handleType: "target",
  });
  const { models } = useModels();
  const [loading, setLoading] = useState(false);
  const currentUrl = data.result?.url ?? data.config.url;
  const hasVideoInput = useMemo(
    () =>
      isVideoLikeUrl(currentUrl) ||
      (incomingConnections.length > 0 &&
        hasVideoLikeInput(getIncomers({ id }, getNodes(), getEdges()))),
    [currentUrl, getEdges, getNodes, id, incomingConnections]
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

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!hasAvailableModels) {
      handleError("Error generating source", "No compatible models found");
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const documentTexts = getTextFromDocumentNodes(incomers);
    const linkTexts = getTextFromLinkNodes(incomers);
    const documents = getDocumentsFromDocumentNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);
    const videos = getVideosFromVideoNodes(incomers);
    const prompt = buildLinkNodeContextPrompt({
      documentTexts,
      imageDescriptions,
      linkTexts,
      textPrompts,
    });

    if (
      !(prompt || documents.length || videos.length || data.config.instructions)
    ) {
      handleError("Error generating source", "No prompts found");
      return;
    }

    try {
      setLoading(true);
      updateNodeData(id, markNodeRunning(data));

      const response = await generateLinkRequest({
        documents,
        prompt,
        modelId,
        instructions: data.config.instructions,
        startingUrl: data.result?.url ?? data.config.url,
        videos,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      updateNodeData(id, {
        ...replaceNodeResult(data, {
          ...response,
          output: {
            json: response,
            text: [response.title, response.description, response.url]
              .filter(Boolean)
              .join("\n"),
          },
        }),
        config: {
          ...data.config,
          url: response.url,
        },
      });

      toast.success("Source generated");
    } catch (error) {
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error ? error.message : "Failed to generate source"
        )
      );
      handleError("Error generating source", error);
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
    if (!data.result?.url) {
      return;
    }

    navigator.clipboard.writeText(data.result.url);
    toast.success("Source copied");
  }, [data.result?.url]);

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
            tooltip: data.result?.url ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={!hasAvailableModels}
                onClick={handleGenerate}
                size="icon"
              >
                {data.result?.url ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.result?.url) {
      items.push({
        id: `copy-${id}`,
        tooltip: "Copy source",
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
    data,
    handleCopy,
    handleGenerate,
    hasAvailableModels,
    id,
    loading,
    modelId,
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
      <LinkPreview result={data.result} />
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
