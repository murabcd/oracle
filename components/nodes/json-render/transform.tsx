import { getIncomers, useReactFlow } from "@xyflow/react";
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
import { handleError } from "@/lib/error/handle";
import { generateJsonRenderStreamRequest } from "@/lib/json-render/client";
import {
  getDescriptionsFromImageNodes,
  getTextFromTextNodes,
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

export const JsonRenderTransform = ({
  data,
  id,
  type,
  title,
}: JsonRenderTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const { models } = useModels();
  const [loading, setLoading] = useState(false);
  const modelId = data.model ?? getDefaultModel(models);
  const previewSpec = data.previewSpec ?? data.generated?.spec;

  const handleGenerate = useCallback(async () => {
    if (loading) {
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    const textPrompts = getTextFromTextNodes(incomers);
    const imageDescriptions = getDescriptionsFromImageNodes(incomers);

    if (
      !(textPrompts.length || imageDescriptions.length || data.instructions)
    ) {
      handleError("Error generating UI", "No prompts found");
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

      updateNodeData(id, {
        previewSpec: data.generated?.spec,
      });

      const response = await generateJsonRenderStreamRequest(
        {
          prompt: content.join("\n"),
          modelId,
          instructions: data.instructions,
          startingSpec: data.generated?.spec,
        },
        {
          onSpec: (spec) => {
            if (
              typeof spec.root !== "string" ||
              !spec.elements ||
              typeof spec.elements !== "object" ||
              !(spec.root in spec.elements)
            ) {
              return;
            }

            updateNodeData(id, {
              previewSpec: spec,
            });
          },
        }
      );

      updateNodeData(id, {
        generated: {
          json: response.json,
          spec: response.spec,
        },
        previewSpec: undefined,
        updatedAt: new Date().toISOString(),
      });

      toast.success("UI generated");
    } catch (error) {
      updateNodeData(id, {
        previewSpec: undefined,
      });
      handleError("Error generating UI", error);
    } finally {
      setLoading(false);
    }
  }, [
    data.generated?.spec,
    data.instructions,
    getEdges,
    getNodes,
    id,
    loading,
    modelId,
    updateNodeData,
  ]);

  const handleCopy = useCallback(() => {
    if (!data.generated?.json) {
      return;
    }

    navigator.clipboard.writeText(data.generated.json);
    toast.success("JSON copied");
  }, [data.generated?.json]);

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
    const items: ComponentProps<typeof NodeLayout>["toolbar"] = [
      {
        id: `model-${id}`,
        children: (
          <ModelSelector
            className="w-[200px] rounded-full"
            id={id}
            onChange={(value) => updateNodeData(id, { model: value })}
            options={models}
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
            tooltip: data.generated?.spec ? "Regenerate" : "Generate",
            children: (
              <Button
                className="rounded-full"
                onClick={handleGenerate}
                size="icon"
              >
                {data.generated?.spec ? (
                  <RotateCcwIcon size={12} />
                ) : (
                  <PlayIcon size={12} />
                )}
              </Button>
            ),
          }
    );

    if (data.generated?.json) {
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
    data.generated?.json,
    data.generated?.spec,
    handleCopy,
    handleGenerate,
    id,
    loading,
    modelId,
    models,
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
        <div className="flex min-h-72 flex-1 items-center justify-center rounded-t-3xl rounded-b-xl bg-secondary px-4 text-center">
          <p className="max-w-56 text-pretty text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate a JSON-powered UI preview.
          </p>
        </div>
      )}
      <Textarea
        className="min-h-24 shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        onChange={handleInstructionsChange}
        placeholder="Enter instruction..."
        value={data.instructions ?? ""}
      />
    </NodeLayout>
  );
};
