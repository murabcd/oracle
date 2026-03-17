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
import { generateDocumentRequest } from "@/lib/document/client";
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
  getDocumentsFromDocumentNodes,
  getTextFromDocumentNodes,
  getTextFromLinkNodes,
  getTextFromTextNodes,
  getVideosFromVideoNodes,
  hasVideoLikeInput,
} from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ModelSelector } from "../model-selector";
import type { DocumentNodeProps } from ".";
import { DocumentPreview } from "./preview";

type DocumentTransformProps = DocumentNodeProps & {
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

const buildPrompt = ({
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

export const DocumentTransform = ({
  data,
  id,
  type,
  title,
}: DocumentTransformProps) => {
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
  const previewText =
    data.result?.generated && !data.config.source
      ? data.result.text
      : undefined;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!hasAvailableModels) {
      handleError("Error generating document", "No compatible models found");
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const documentTexts = getTextFromDocumentNodes(incomers);
    const linkTexts = getTextFromLinkNodes(incomers);
    const documents = getDocumentsFromDocumentNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);
    const videos = getVideosFromVideoNodes(incomers);
    const prompt = buildPrompt({
      documentTexts,
      imageDescriptions,
      linkTexts,
      textPrompts,
    });

    if (
      !(prompt || documents.length || videos.length || data.config.instructions)
    ) {
      handleError("Error generating document", "No prompts found");
      return;
    }

    try {
      setLoading(true);
      updateNodeData(id, markNodeRunning(data));

      const response = await generateDocumentRequest({
        documents,
        prompt,
        modelId,
        instructions: data.config.instructions,
        startingText: previewText,
        videos,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      updateNodeData(
        id,
        replaceNodeResult(data, {
          generated: true,
          output: {
            text: response.text,
          },
          text: response.text,
        })
      );

      toast.success("Document generated");
    } catch (error) {
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error ? error.message : "Failed to generate document"
        )
      );
      handleError("Error generating document", error);
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
    previewText,
    updateNodeData,
  ]);

  const handleCopy = useCallback(() => {
    const text = data.result?.text;

    if (!text) {
      return;
    }

    navigator.clipboard.writeText(text);
    toast.success("Document copied");
  }, [data.result?.text]);

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
            tooltip: data.result?.generated ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={!hasAvailableModels}
                onClick={handleGenerate}
                size="icon"
              >
                {data.result?.generated ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.result?.generated && data.result.text) {
      items.push({
        id: `copy-${id}`,
        tooltip: "Copy document",
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
      <DocumentPreview
        emptyMessage="Press play to generate a document."
        source={data.config.source}
        text={previewText}
        title={title}
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
