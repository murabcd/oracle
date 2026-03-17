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
import { handleError } from "@/lib/error/handle";
import { generateJsonRenderStreamRequest } from "@/lib/json-render/client";
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
} from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ModelSelector } from "../model-selector";
import type { JsonRenderNodeProps } from ".";
import { JsonRenderPreview } from "./preview";

type JsonRenderTransformProps = JsonRenderNodeProps & {
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

const buildContextPrompt = ({
  documentTexts,
  imageDescriptions,
  linkTexts,
  textPrompts,
}: {
  documentTexts: string[];
  imageDescriptions: string[];
  linkTexts: string[];
  textPrompts: string[];
}) => {
  const content: string[] = [];

  if (textPrompts.length) {
    content.push("--- Text Context ---", ...textPrompts);
  }

  if (documentTexts.length) {
    content.push("--- Document Context ---", ...documentTexts);
  }

  if (linkTexts.length) {
    content.push("--- Link Context ---", ...linkTexts);
  }

  if (imageDescriptions.length) {
    content.push("--- Image Context ---", ...imageDescriptions);
  }

  return content.join("\n");
};

const isRenderablePreviewSpec = (spec: {
  elements?: unknown;
  root?: unknown;
}) => {
  if (
    typeof spec.root !== "string" ||
    !spec.elements ||
    typeof spec.elements !== "object"
  ) {
    return false;
  }

  return spec.root in spec.elements;
};

export const JsonRenderTransform = ({
  data,
  id,
  type,
  title,
}: JsonRenderTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const incomingConnections = useNodeConnections({
    id,
    handleType: "target",
  });
  const { models } = useModels();
  const [loading, setLoading] = useState(false);
  const hasVideoInput = useMemo(
    () =>
      incomingConnections.length > 0 &&
      hasVideoLikeInput(getIncomers({ id }, getNodes(), getEdges())),
    [getEdges, getNodes, id, incomingConnections]
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
  const previewSpec = data.result?.previewSpec ?? data.result?.spec;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!hasAvailableModels) {
      handleError("Error generating interface", "No compatible models found");
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const documentTexts = getTextFromDocumentNodes(incomers);
    const linkTexts = getTextFromLinkNodes(incomers);
    const documents = getDocumentsFromDocumentNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);
    const videos = getVideosFromVideoNodes(incomers);
    const prompt = buildContextPrompt({
      documentTexts,
      imageDescriptions,
      linkTexts,
      textPrompts,
    });

    if (
      !(prompt || documents.length || videos.length || data.config.instructions)
    ) {
      handleError("Error generating interface", "No prompts found");
      return;
    }

    try {
      setLoading(true);
      updateNodeData(id, markNodeRunning(data));

      updateNodeData(id, {
        result: {
          ...data.result,
          previewSpec: data.result?.spec,
        },
      });

      const response = await generateJsonRenderStreamRequest(
        {
          documents,
          prompt,
          modelId,
          instructions: data.config.instructions,
          startingSpec: data.result?.spec,
          videos,
        },
        {
          onSpec: (spec) => {
            if (!isRenderablePreviewSpec(spec)) {
              return;
            }

            updateNodeData(id, {
              result: {
                ...data.result,
                previewSpec: spec,
              },
            });
          },
        }
      );

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

      toast.success("Interface generated");
    } catch (error) {
      updateNodeData(id, {
        result: data.result
          ? {
              ...data.result,
              previewSpec: undefined,
            }
          : undefined,
      });
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error
            ? error.message
            : "Failed to generate interface"
        )
      );
      handleError("Error generating interface", error);
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
    if (!data.result?.json) {
      return;
    }

    navigator.clipboard.writeText(data.result.json);
    toast.success("JSON copied");
  }, [data.result?.json]);

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
            tooltip: data.result?.spec ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={!hasAvailableModels}
                onClick={handleGenerate}
                size="icon"
              >
                {data.result?.spec ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.result?.json) {
      items.push({
        id: `copy-${id}`,
        tooltip: "Copy JSON",
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
    data,
    handleCopy,
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
      {previewSpec ? (
        <JsonRenderPreview className="min-h-72 flex-1" spec={previewSpec} />
      ) : (
        <div className="flex min-h-72 flex-1 items-center justify-center rounded-t-3xl rounded-b-xl bg-secondary/60 px-4 text-center">
          <p className="max-w-56 text-pretty text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate an interface.
          </p>
        </div>
      )}
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
