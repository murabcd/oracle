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
import { download } from "@/lib/download";
import { handleError } from "@/lib/error/handle";
import { editImageRequest, generateImageRequest } from "@/lib/media/client";
import { getImagesFromImageNodes, getTextFromTextNodes } from "@/lib/xyflow";
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
  const modelId = data.model ?? getDefaultModel(imageModels);

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textNodes = getTextFromTextNodes(incomers);
    const imageNodes = getImagesFromImageNodes(incomers);

    try {
      if (!(textNodes.length || imageNodes.length)) {
        throw new Error("No input provided");
      }

      setLoading(true);

      const response = imageNodes.length
        ? await editImageRequest({
            images: imageNodes,
            instructions: data.instructions,
            modelId,
          })
        : await generateImageRequest({
            prompt: textNodes.join("\n"),
            modelId,
            instructions: data.instructions,
          });

      if ("error" in response) {
        throw new Error(response.error);
      }

      updateNodeData(id, {
        updatedAt: new Date().toISOString(),
        generated: {
          url: response.url,
          type: response.type,
        },
        description: response.description,
      });

      toast.success("Image generated");
    } catch (error) {
      handleError("Error generating image", error);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    id,
    data.instructions,
    getEdges,
    modelId,
    getNodes,
    updateNodeData,
  ]);

  const handleInstructionsChange: ChangeEventHandler<HTMLTextAreaElement> = (
    event
  ) => {
    const nextInstructions = event.target.value;
    const hasExistingInstructions = Boolean(data.instructions?.trim().length);

    updateNodeData(id, {
      instructions: nextInstructions,
      ...(hasExistingInstructions
        ? { updatedAt: new Date().toISOString() }
        : {}),
    });
  };

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
            onChange={(value) => updateNodeData(id, { model: value })}
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
            tooltip: data.generated?.url ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                disabled={loading}
                onClick={handleGenerate}
                size="icon"
              >
                {data.generated?.url ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.generated) {
      items.push({
        id: `download-${id}`,
        tooltip: "Download",
        children: (
          <Button
            className="rounded-full"
            onClick={() => download(data.generated, id, "png")}
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
    modelId,
    imageModels,
    id,
    updateNodeData,
    loading,
    data.generated,
    handleGenerate,
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
      {loading ? (
        <Skeleton className="flex min-h-72 flex-1 animate-pulse items-center justify-center rounded-b-xl bg-secondary/60">
          <Loader2Icon
            className="size-4 animate-spin text-muted-foreground"
            size={16}
          />
        </Skeleton>
      ) : null}
      {!(loading || data.generated?.url) && (
        <div className="flex min-h-72 flex-1 items-center justify-center rounded-b-xl bg-secondary/60 p-4">
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            create an image
          </p>
        </div>
      )}
      {!loading && data.generated?.url && (
        <div className="flex min-h-72 flex-1 items-center justify-center rounded-b-xl bg-secondary/60 p-4">
          <Image
            alt="Generated image"
            className="max-h-full min-h-0 w-full object-contain"
            height={1000}
            src={data.generated.url}
            width={1000}
          />
        </div>
      )}
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        onChange={handleInstructionsChange}
        placeholder="Enter instruction..."
        value={data.instructions ?? ""}
      />
    </NodeLayout>
  );
};
