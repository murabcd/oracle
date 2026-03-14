import { getIncomers, useReactFlow } from "@xyflow/react";
import {
  DownloadIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import { type ChangeEventHandler, type ComponentProps, useState } from "react";
import { toast } from "sonner";
import { NodeLayout } from "@/components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { download } from "@/lib/download";
import { handleError } from "@/lib/error/handle";
import { generateVideoRequest } from "@/lib/media/client";
import { getImagesFromImageNodes, getTextFromTextNodes } from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ModelSelector } from "../model-selector";
import type { VideoNodeProps } from ".";

type VideoTransformProps = VideoNodeProps & {
  title: string;
};

type Toolbar = ComponentProps<typeof NodeLayout>["toolbar"];

const getDefaultModel = (models: Record<string, { default?: boolean }>) => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
  );

  if (defaultModel) {
    return defaultModel[0];
  }

  const firstModel = Object.keys(models)[0];

  if (!firstModel) {
    throw new Error("No video models available");
  }

  return firstModel;
};

const getSelectedModelId = ({
  hasVideoGeneration,
  model,
  videoModels,
}: {
  hasVideoGeneration: boolean;
  model?: string;
  videoModels: Record<string, { default?: boolean }>;
}) => {
  if (!hasVideoGeneration) {
    return "";
  }

  if (model) {
    return model;
  }

  return getDefaultModel(videoModels);
};

const getGenerateTooltip = ({
  hasGeneratedVideo,
  hasVideoGeneration,
}: {
  hasGeneratedVideo: boolean;
  hasVideoGeneration: boolean;
}) => {
  if (!hasVideoGeneration) {
    return "Unavailable";
  }

  if (hasGeneratedVideo) {
    return "Regenerate";
  }

  return "Generate";
};

const buildToolbar = ({
  data,
  handleGenerate,
  hasGeneratedVideo,
  hasVideoGeneration,
  id,
  loading,
  modelId,
  updateNodeData,
  videoModels,
}: {
  data: VideoNodeProps["data"];
  handleGenerate: () => void;
  hasGeneratedVideo: boolean;
  hasVideoGeneration: boolean;
  id: string;
  loading: boolean;
  modelId: string;
  updateNodeData: ReturnType<typeof useReactFlow>["updateNodeData"];
  videoModels: ReturnType<typeof useModels>["videoModels"];
}): Toolbar => {
  const toolbar: Toolbar = [];

  if (hasVideoGeneration) {
    toolbar.push({
      id: `model-${id}`,
      children: (
        <ModelSelector
          className="w-[200px] rounded-full"
          key={id}
          onChange={(value) => updateNodeData(id, { model: value })}
          options={videoModels}
          value={modelId}
        />
      ),
    });
  }

  if (loading) {
    toolbar.push({
      id: `status-${id}`,
      tooltip: "Generating...",
      children: (
        <Button className="rounded-full" disabled size="icon">
          <Loader2Icon className="animate-spin" size={12} />
        </Button>
      ),
    });
  } else {
    toolbar.push({
      id: `generate-${id}`,
      tooltip: getGenerateTooltip({ hasGeneratedVideo, hasVideoGeneration }),
      children: (
        <Button
          className="rounded-full"
          disabled={!hasVideoGeneration}
          onClick={handleGenerate}
          size="icon"
        >
          {hasGeneratedVideo ? (
            <RotateCcwIcon size={12} />
          ) : (
            <PlayIcon size={12} />
          )}
        </Button>
      ),
    });
  }

  if (data.generated?.url) {
    const generatedVideo = data.generated;

    toolbar.push({
      id: `download-${id}`,
      tooltip: "Download",
      children: (
        <Button
          className="rounded-full"
          onClick={() => download(generatedVideo, id, "mp4")}
          size="icon"
          variant="ghost"
        >
          <DownloadIcon size={12} />
        </Button>
      ),
    });
  }

  return toolbar;
};

export const VideoTransform = ({
  data,
  id,
  type,
  title,
}: VideoTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const { videoModels } = useModels();
  const hasVideoGeneration = Object.keys(videoModels).length > 0;
  const modelId = getSelectedModelId({
    hasVideoGeneration,
    model: data.model,
    videoModels,
  });
  const hasGeneratedVideo = typeof data.generated?.url === "string";

  const handleGenerate = async () => {
    if (loading) {
      return;
    }

    try {
      if (!hasVideoGeneration) {
        throw new Error("Video generation is not configured in this app.");
      }

      const incomers = getIncomers({ id }, getNodes(), getEdges());
      const textPrompts = getTextFromTextNodes(incomers);
      const images = getImagesFromImageNodes(incomers);

      if (!(textPrompts.length || images.length)) {
        throw new Error("No prompts found");
      }

      setLoading(true);

      const response = await generateVideoRequest({
        modelId,
        prompt: [data.instructions ?? "", ...textPrompts].join("\n"),
        image: images.at(0)?.url,
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
      });

      toast.success("Video generated");
    } catch (error) {
      handleError("Error generating video", error);
    } finally {
      setLoading(false);
    }
  };

  const toolbar = buildToolbar({
    data,
    handleGenerate,
    hasGeneratedVideo,
    hasVideoGeneration,
    id,
    loading,
    modelId,
    updateNodeData,
    videoModels,
  });

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

  return (
    <NodeLayout data={data} id={id} title={title} toolbar={toolbar} type={type}>
      {loading ? (
        <Skeleton className="flex aspect-video w-full animate-pulse items-center justify-center rounded-b-xl">
          <Loader2Icon
            className="size-4 animate-spin text-muted-foreground"
            size={16}
          />
        </Skeleton>
      ) : null}
      {!(loading || data.generated?.url || hasVideoGeneration) && (
        <div className="flex aspect-video w-full items-center justify-center rounded-b-xl bg-secondary px-4 text-center">
          <p className="text-muted-foreground text-sm">
            Video generation is not configured in this app.
          </p>
        </div>
      )}
      {!(loading || hasGeneratedVideo) && hasVideoGeneration && (
        <div className="flex aspect-video w-full items-center justify-center rounded-b-xl bg-secondary">
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate video
          </p>
        </div>
      )}
      {hasGeneratedVideo && !loading ? (
        <video
          autoPlay
          className="w-full rounded-b-xl object-cover"
          height={data.height ?? 450}
          loop
          muted
          playsInline
          src={data.generated?.url}
          width={data.width ?? 800}
        />
      ) : null}
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        onChange={handleInstructionsChange}
        placeholder="Enter instructions"
        value={data.instructions ?? ""}
      />
    </NodeLayout>
  );
};
