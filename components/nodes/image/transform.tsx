import { getIncomers, useReactFlow } from "@xyflow/react";
import {
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import Image from "next/image";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNodeGenerateHotkeys } from "@/hooks/use-node-generate-hotkeys";
import { download } from "@/lib/download";
import { handleError } from "@/lib/error/handle";
import { editImageRequest, generateImageRequest } from "@/lib/media/client";
import {
  markNodeError,
  markNodeRunning,
  patchNodeConfig,
  replaceNodeResult,
} from "@/lib/node-data";
import {
  getImagesFromImageNodes,
  getTextFromDocumentNodes,
  getTextFromLinkNodes,
  getTextFromTextNodes,
} from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ModelSelector } from "../model-selector";
import type { ImageNodeProps } from ".";

type ImageTransformProps = ImageNodeProps & {
  title: string;
};

const getDefaultModel = (
  models: Record<string, { default?: boolean }>
): string => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
  );

  if (defaultModel) {
    return defaultModel[0];
  }

  const firstModel = Object.keys(models)[0];

  if (!firstModel) {
    throw new Error("No image models available");
  }

  return firstModel;
};

export const ImageTransform = ({
  data,
  id,
  type,
  title,
}: ImageTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const { imageModels } = useModels();
  const modelId = data.config.model ?? getDefaultModel(imageModels);

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textNodes = getTextFromTextNodes(incomers);
    const documentTexts = getTextFromDocumentNodes(incomers);
    const linkTexts = getTextFromLinkNodes(incomers);
    const imageNodes = getImagesFromImageNodes(incomers);
    const hasInstructions = Boolean(data.config.instructions?.trim().length);

    try {
      if (
        !(
          textNodes.length ||
          documentTexts.length ||
          linkTexts.length ||
          imageNodes.length ||
          hasInstructions
        )
      ) {
        throw new Error("No input provided");
      }

      setLoading(true);
      updateNodeData(id, markNodeRunning(data));

      const response = imageNodes.length
        ? await editImageRequest({
            images: imageNodes,
            instructions: data.config.instructions,
            modelId,
          })
        : await generateImageRequest({
            prompt: [...textNodes, ...documentTexts, ...linkTexts].join("\n"),
            modelId,
            instructions: data.config.instructions,
          });

      if ("error" in response) {
        throw new Error(response.error);
      }

      updateNodeData(
        id,
        replaceNodeResult(data, {
          description: response.description,
          image: {
            type: response.type,
            url: response.url,
          },
          output: {
            files: [
              {
                type: response.type,
                url: response.url,
              },
            ],
            text: response.description,
          },
        })
      );

      toast.success("Image generated");
    } catch (error) {
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error ? error.message : "Failed to generate image"
        )
      );
      handleError("Error generating image", error);
    } finally {
      setLoading(false);
    }
  }, [loading, id, data, getEdges, modelId, getNodes, updateNodeData]);

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
    disabled: loading,
    onGenerate: handleGenerate,
  });

  const toolbar = useMemo<ComponentProps<typeof NodeLayout>["toolbar"]>(() => {
    const availableModels = Object.fromEntries(
      Object.entries(imageModels).map(([key, model]) => [
        key,
        {
          ...model,
          disabled: model.disabled,
        },
      ])
    );

    const items: ComponentProps<typeof NodeLayout>["toolbar"] = [
      {
        id: `model-${id}`,
        children: (
          <ModelSelector
            className="w-[200px] rounded-full"
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
            tooltip: data.result?.image?.url ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={loading}
                onClick={handleGenerate}
                size="icon"
              >
                {data.result?.image?.url ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.result?.image) {
      const generatedImage = data.result.image;

      items.push({
        id: `download-${id}`,
        tooltip: "Download",
        children: (
          <Button
            className="rounded-full"
            onClick={() => download(generatedImage, id, "png")}
            size="icon"
            variant="ghost"
          >
            <DownloadIcon size={12} />
          </Button>
        ),
      });
    }

    return items;
  }, [modelId, imageModels, id, updateNodeData, loading, data, handleGenerate]);

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
      {loading ? (
        <Skeleton className="flex min-h-0 flex-1 animate-pulse items-center justify-center rounded-b-xl bg-secondary/60">
          <Loader2Icon
            className="size-4 animate-spin text-muted-foreground"
            size={16}
          />
        </Skeleton>
      ) : null}
      {!(loading || data.result?.image?.url) && (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-b-xl bg-secondary/60 p-4">
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            create an image
          </p>
        </div>
      )}
      {!loading && data.result?.image?.url && (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-b-xl bg-secondary/60 p-4">
          <Image
            alt="Generated image"
            className="size-full min-h-0 object-contain"
            height={1000}
            src={data.result.image.url}
            width={1000}
          />
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
