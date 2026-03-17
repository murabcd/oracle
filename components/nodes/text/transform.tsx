import { useChat } from "@ai-sdk/react";
import { getIncomers, useNodeConnections, useReactFlow } from "@xyflow/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  CopyIcon,
  GlobeIcon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react";
import {
  type ChangeEventHandler,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import { NodeLayout } from "@/components/nodes/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNodeGenerateHotkeys } from "@/hooks/use-node-generate-hotkeys";
import { useReasoning } from "@/hooks/use-reasoning";
import { handleError } from "@/lib/error/handle";
import {
  filterModelsByVideoInput,
  filterModelsByWebSearch,
} from "@/lib/model-catalog";
import {
  markNodeError,
  markNodeRunning,
  patchNodeConfig,
  replaceNodeResult,
} from "@/lib/node-data";
import {
  buildTextNodeExecutionInput,
  getTextResultFromMessage,
} from "@/lib/nodes/text-execution";
import { hasVideoLikeInput } from "@/lib/xyflow";
import { useModels } from "@/providers/models/client";
import { ReasoningTunnel } from "@/tunnels/reasoning";
import { ModelSelector } from "../model-selector";
import type { TextNodeProps } from ".";

type TextTransformProps = TextNodeProps & {
  title: string;
};

type TextToolbar = ComponentProps<typeof NodeLayout>["toolbar"];

const getDefaultModel = (models: ReturnType<typeof useModels>["models"]) => {
  const defaultModel = Object.entries(models).find(
    ([_, model]) => model.default
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

const getMessageText = (message: UIMessage) =>
  message.parts.find((part) => part.type === "text")?.text ?? "";

const buildTextToolbar = ({
  data,
  handleCopy,
  handleGenerate,
  handleToggleWebSearch,
  id,
  messages,
  modelId,
  models,
  hasAvailableModels,
  webSearchEnabled,
  status,
  stop,
  updateNodeData,
}: {
  data: TextNodeProps["data"];
  handleCopy: (text: string) => void;
  handleGenerate: () => Promise<void>;
  handleToggleWebSearch: () => void;
  id: string;
  messages: UIMessage[];
  modelId: string;
  models: ReturnType<typeof useModels>["models"];
  hasAvailableModels: boolean;
  webSearchEnabled: boolean;
  status: ReturnType<typeof useChat>["status"];
  stop: ReturnType<typeof useChat>["stop"];
  updateNodeData: ReturnType<typeof useReactFlow>["updateNodeData"];
}): TextToolbar => {
  const items: TextToolbar = [
    {
      id: `model-${id}`,
      children: (
        <ModelSelector
          className="w-[200px] rounded-full"
          disabled={!hasAvailableModels}
          key={id}
          onChange={(value) =>
            updateNodeData(
              id,
              patchNodeConfig(data, {
                model: value,
              })
            )
          }
          options={models}
          value={modelId}
        />
      ),
    },
  ];

  if (!hasAvailableModels) {
    items.push({
      id: `generate-${id}`,
      tooltip: "No compatible models",
      children: (
        <Button className="rounded-full" disabled size="icon">
          <PlayIcon size={12} />
        </Button>
      ),
    });

    return items;
  }

  if (status === "submitted" || status === "streaming") {
    items.push({
      id: `stop-${id}`,
      tooltip: "Stop",
      children: (
        <Button className="rounded-full" onClick={stop} size="icon">
          <SquareIcon size={12} />
        </Button>
      ),
    });
  } else if (messages.length || data.result?.text) {
    const text = messages.length
      ? messages
          .filter((message) => message.role === "assistant")
          .map(getMessageText)
          .join("\n")
      : data.result?.text;

    items.push(
      {
        id: `generate-${id}`,
        tooltip: "Regenerate",
        children: (
          <Button className="rounded-full" onClick={handleGenerate} size="icon">
            <RotateCcwIcon size={12} />
          </Button>
        ),
      },
      {
        id: `copy-${id}`,
        tooltip: "Copy",
        children: (
          <Button
            className="rounded-full"
            disabled={!text}
            onClick={() => handleCopy(text ?? "")}
            size="icon"
            variant="ghost"
          >
            <CopyIcon size={12} />
          </Button>
        ),
      }
    );
  } else {
    items.push({
      id: `generate-${id}`,
      tooltip: "Generate",
      children: (
        <Button className="rounded-full" onClick={handleGenerate} size="icon">
          <PlayIcon size={12} />
        </Button>
      ),
    });
  }

  items.push({
    id: `web-search-${id}`,
    tooltip: webSearchEnabled ? "Disable web" : "Enable web",
    children: (
      <Button
        className="relative rounded-full"
        onClick={handleToggleWebSearch}
        size="icon"
        variant="ghost"
      >
        {webSearchEnabled ? (
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-emerald-500" />
        ) : null}
        <GlobeIcon size={12} />
      </Button>
    ),
  });

  return items;
};

const TextTransformOutput = ({
  data,
  nonUserMessages,
  status,
}: {
  data: TextNodeProps["data"];
  nonUserMessages: UIMessage[];
  status: ReturnType<typeof useChat>["status"];
}) => (
  <div className="nowheel h-full flex-1 overflow-auto rounded-t-3xl rounded-b-xl bg-secondary p-4">
    {status === "submitted" && (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-60 animate-pulse rounded-lg" />
        <Skeleton className="h-4 w-40 animate-pulse rounded-lg" />
        <Skeleton className="h-4 w-50 animate-pulse rounded-lg" />
      </div>
    )}
    {typeof data.result?.text === "string" &&
    nonUserMessages.length === 0 &&
    status !== "submitted" ? (
      <ReactMarkdown>{data.result.text}</ReactMarkdown>
    ) : null}
    {!(data.result?.text || nonUserMessages.length) &&
      status !== "submitted" && (
        <div className="flex aspect-video w-full items-center justify-center bg-secondary/60">
          <p className="text-muted-foreground text-sm">
            Press <PlayIcon className="inline -translate-y-px" size={12} /> to
            generate text
          </p>
        </div>
      )}
    {Boolean(nonUserMessages.length) &&
      status !== "submitted" &&
      nonUserMessages.map((message) => {
        const sourceParts = message.parts.filter(
          (part) => part.type === "source-url"
        );

        return (
          <Message
            className="p-0 [&>div]:max-w-none"
            from={message.role === "assistant" ? "assistant" : "user"}
            key={message.id}
          >
            <div>
              {Boolean(sourceParts.length) && (
                <Sources>
                  <SourcesTrigger count={sourceParts.length} />
                  <SourcesContent>
                    {sourceParts.map(({ url, title: sourceTitle }) => (
                      <Source
                        href={url}
                        key={url ?? ""}
                        title={sourceTitle ?? new URL(url).hostname}
                      />
                    ))}
                  </SourcesContent>
                </Sources>
              )}
              <MessageContent className="bg-transparent p-0">
                <MessageResponse>{getMessageText(message)}</MessageResponse>
              </MessageContent>
            </div>
          </Message>
        );
      })}
  </div>
);

export const TextTransform = ({
  data,
  id,
  type,
  title,
}: TextTransformProps) => {
  const { updateNodeData, getNodes, getEdges } = useReactFlow();
  const incomingConnections = useNodeConnections({
    id,
    handleType: "target",
  });
  const { models } = useModels();
  const hasVideoInput = useMemo(
    () =>
      incomingConnections.length > 0 &&
      hasVideoLikeInput(getIncomers({ id }, getNodes(), getEdges())),
    [getEdges, getNodes, id, incomingConnections]
  );
  const availableModels = useMemo(
    () =>
      filterModelsByWebSearch(
        filterModelsByVideoInput(models, hasVideoInput),
        data.config.webSearchEnabled === true
      ),
    [data.config.webSearchEnabled, hasVideoInput, models]
  );
  const hasAvailableModels = Object.keys(availableModels).length > 0;
  const modelId = getSelectedModelId({
    availableModels,
    model: data.config.model,
  });
  const webSearchEnabled = data.config.webSearchEnabled === true;
  const [reasoning, setReasoning] = useReasoning();
  const { sendMessage, messages, setMessages, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onError: (error) => {
      updateNodeData(
        id,
        markNodeError(
          data,
          error instanceof Error ? error.message : "Failed to generate text"
        )
      );
      handleError("Error generating text", error);
    },
    onFinish: ({ message, isError }) => {
      if (isError) {
        updateNodeData(id, markNodeError(data, "Please try again later."));
        handleError("Error generating text", "Please try again later.");
        return;
      }

      updateNodeData(
        id,
        replaceNodeResult(data, getTextResultFromMessage(message))
      );

      setReasoning((oldReasoning) => ({
        ...oldReasoning,
        isGenerating: false,
      }));

      toast.success("Text generated");
    },
  });

  const handleGenerate = useCallback(async () => {
    if (!hasAvailableModels) {
      handleError("Error generating text", "No compatible models found");
      return;
    }

    const incomers = getIncomers({ id }, getNodes(), getEdges());
    try {
      const { attachments, prompt } = buildTextNodeExecutionInput({
        incomers,
        instructions: data.config.instructions,
      });

      updateNodeData(id, markNodeRunning(data));
      setMessages([]);
      await sendMessage(
        {
          files: attachments,
          text: prompt,
        },
        {
          body: {
            modelId,
            webSearchEnabled,
          },
        }
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again later.";
      updateNodeData(id, markNodeError(data, message));
      handleError("Error generating text", error);
    }
  }, [
    sendMessage,
    data,
    getEdges,
    getNodes,
    hasAvailableModels,
    id,
    modelId,
    setMessages,
    updateNodeData,
    webSearchEnabled,
  ]);

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

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }, []);
  const textareaHotkeysRef = useNodeGenerateHotkeys({
    disabled:
      status === "submitted" || status === "streaming" || !hasAvailableModels,
    onGenerate: handleGenerate,
  });

  const handleToggleWebSearch = useCallback(() => {
    updateNodeData(
      id,
      patchNodeConfig(data, {
        webSearchEnabled: !webSearchEnabled,
      })
    );
  }, [data, id, updateNodeData, webSearchEnabled]);

  const toolbar = useMemo(
    () =>
      buildTextToolbar({
        data,
        handleCopy,
        handleGenerate,
        handleToggleWebSearch,
        id,
        messages,
        modelId,
        models: availableModels,
        hasAvailableModels,
        webSearchEnabled,
        status,
        stop,
        updateNodeData,
      }),
    [
      data,
      handleGenerate,
      handleToggleWebSearch,
      updateNodeData,
      modelId,
      id,
      messages,
      status,
      stop,
      handleCopy,
      availableModels,
      hasAvailableModels,
      webSearchEnabled,
    ]
  );

  const nonUserMessages = messages.filter((message) => message.role !== "user");

  useEffect(() => {
    const hasReasoning = messages.some((message) =>
      message.parts.some((part) => part.type === "reasoning")
    );

    if (hasReasoning && !reasoning.isReasoning && status === "streaming") {
      setReasoning({ isReasoning: true, isGenerating: true });
    }
  }, [messages, reasoning, status, setReasoning]);

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
      <TextTransformOutput
        data={data}
        nonUserMessages={nonUserMessages}
        status={status}
      />
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        onChange={handleInstructionsChange}
        placeholder="Enter instruction..."
        ref={textareaHotkeysRef}
        value={data.config.instructions ?? ""}
      />
      <ReasoningTunnel.In>
        {messages.flatMap((message) =>
          message.parts
            .filter((part) => part.type === "reasoning")
            .flatMap((part) => part.text ?? "")
        )}
      </ReasoningTunnel.In>
    </NodeLayout>
  );
};
