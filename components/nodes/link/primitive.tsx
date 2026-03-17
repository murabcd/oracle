import { useReactFlow } from "@xyflow/react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import {
  type ChangeEventHandler,
  type ClipboardEventHandler,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { NodeLayout } from "@/components/nodes/layout";
import { Textarea } from "@/components/ui/textarea";
import { handleError } from "@/lib/error/handle";
import { fetchLinkPreviewRequest, normalizeLinkUrl } from "@/lib/link/client";
import {
  markNodeError,
  markNodeRunning,
  patchNodeConfig,
  replaceNodeResult,
} from "@/lib/node-data";
import type { LinkNodeProps } from ".";
import { LinkPreview } from "./preview";

type LinkPrimitiveProps = LinkNodeProps & {
  title: string;
};

export const LinkPrimitive = ({
  data,
  id,
  type,
  title,
}: LinkPrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const [loading, setLoading] = useState(false);
  const lastResolvedUrlRef = useRef<string | null>(null);

  const handleResolveUrl = useCallback(
    async (value: string) => {
      const normalizedUrl = normalizeLinkUrl(value);

      if (!normalizedUrl) {
        updateNodeData(
          id,
          markNodeError(data, "Enter a valid URL", new Date().toISOString())
        );
        return;
      }

      try {
        setLoading(true);
        updateNodeData(
          id,
          {
            ...markNodeRunning(data),
            config: {
              ...data.config,
              url: normalizedUrl,
            },
          },
          { replace: true }
        );

        const response = await fetchLinkPreviewRequest({
          url: normalizedUrl,
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
            url: "",
          },
        });
      } catch (error) {
        updateNodeData(
          id,
          markNodeError(
            data,
            error instanceof Error
              ? error.message
              : "Failed to load link preview"
          )
        );
        handleError("Error loading link preview", error);
      } finally {
        setLoading(false);
      }
    },
    [data, id, updateNodeData]
  );

  useEffect(() => {
    const normalizedUrl = normalizeLinkUrl(data.config.url ?? "");

    if (!normalizedUrl) {
      lastResolvedUrlRef.current = null;
      return;
    }

    if (data.result?.url === normalizedUrl) {
      lastResolvedUrlRef.current = normalizedUrl;
      return;
    }

    if (
      loading ||
      data.meta.status === "running" ||
      lastResolvedUrlRef.current === normalizedUrl
    ) {
      return;
    }

    lastResolvedUrlRef.current = normalizedUrl;
    handleResolveUrl(normalizedUrl);
  }, [
    data.config.url,
    data.meta.status,
    data.result?.url,
    handleResolveUrl,
    loading,
  ]);

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (event) => {
    const nextUrl = event.target.value;
    const hasExistingUrl = Boolean(data.config.url?.trim().length);

    updateNodeData(
      id,
      patchNodeConfig(
        data,
        { url: nextUrl },
        hasExistingUrl ? new Date().toISOString() : data.meta.updatedAt
      )
    );
  };

  const handleBlur = async () => {
    if (!data.config.url?.trim()) {
      return;
    }

    await handleResolveUrl(data.config.url);
  };

  const handlePaste: ClipboardEventHandler<HTMLTextAreaElement> = async (
    event
  ) => {
    const pastedText = event.clipboardData.getData("text");

    if (!normalizeLinkUrl(pastedText)) {
      return;
    }

    event.preventDefault();
    updateNodeData(
      id,
      patchNodeConfig(data, { url: pastedText }, new Date().toISOString())
    );
    await handleResolveUrl(pastedText);
    toast.success("Source embedded");
  };

  let statusContent: ReactNode = null;

  if (loading) {
    statusContent = (
      <div className="flex items-center gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
        <Loader2Icon className="size-3 animate-spin" />
        <span>Loading preview...</span>
      </div>
    );
  } else if (data.meta.error) {
    statusContent = (
      <div className="flex items-center gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
        <AlertCircleIcon size={12} />
        <span className="truncate">{data.meta.error}</span>
      </div>
    );
  }

  return (
    <NodeLayout
      bodyClassName="flex h-full flex-col"
      contentClassName="h-full"
      data={data}
      id={id}
      title={title}
      type={type}
    >
      <LinkPreview result={data.result} />
      <Textarea
        className="shrink-0 resize-none rounded-none border-none bg-transparent! shadow-none focus-visible:ring-0"
        onBlur={handleBlur}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder="Paste a source..."
        value={data.config.url ?? ""}
      />
      {statusContent}
    </NodeLayout>
  );
};
