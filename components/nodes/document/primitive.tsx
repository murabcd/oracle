import { useReactFlow } from "@xyflow/react";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/kibo-ui/dropzone";
import { NodeLayout } from "@/components/nodes/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/error/handle";
import { patchNodeConfig } from "@/lib/node-data";
import { uploadFile } from "@/lib/upload";
import type { DocumentNodeProps } from ".";
import { DocumentPreview } from "./preview";

type DocumentPrimitiveProps = DocumentNodeProps & {
  title: string;
};

export const DocumentPrimitive = ({
  data,
  id,
  type,
  title,
}: DocumentPrimitiveProps) => {
  const { updateNodeData } = useReactFlow();
  const [files, setFiles] = useState<File[] | undefined>();
  const [isUploading, setIsUploading] = useState(false);

  const handleDrop = async (droppedFiles: File[]) => {
    if (isUploading) {
      return;
    }

    try {
      if (!droppedFiles.length) {
        throw new Error("No file selected");
      }

      setIsUploading(true);
      setFiles(droppedFiles);

      const [file] = droppedFiles;
      const { url, type: contentType } = await uploadFile(file);
      const source = {
        name: file.name,
        type: contentType,
        url,
      };
      const hasExistingSource = Boolean(data.config.source?.url);

      updateNodeData(
        id,
        patchNodeConfig(
          data,
          { source },
          hasExistingSource ? new Date().toISOString() : data.meta.updatedAt
        )
      );
      updateNodeData(id, {
        meta: {
          ...data.meta,
          error: null,
          status: "idle",
          updatedAt: new Date().toISOString(),
        },
        result: undefined,
      });
    } catch (error) {
      updateNodeData(id, {
        meta: {
          ...data.meta,
          error:
            error instanceof Error
              ? error.message
              : "Failed to upload document",
          status: "error",
          updatedAt: new Date().toISOString(),
        },
      });
      handleError("Error uploading document", error);
    } finally {
      setIsUploading(false);
    }
  };

  const source = data.config.source;

  return (
    <NodeLayout
      bodyClassName="flex h-full flex-col"
      contentClassName="h-full"
      data={data}
      id={id}
      title={title}
      type={type}
    >
      {isUploading ? (
        <Skeleton className="flex min-h-72 flex-1 animate-pulse items-center justify-center rounded-b-xl bg-secondary/60">
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        </Skeleton>
      ) : null}
      {!isUploading && source ? (
        <DocumentPreview
          emptyMessage={
            data.meta.status === "running"
              ? "Preparing document preview..."
              : "Upload a PDF or text document to preview it here."
          }
          source={source}
          title={title}
        />
      ) : null}
      {!isUploading && source && data.meta.error ? (
        <div className="flex items-center gap-2 border-t px-3 py-2 text-muted-foreground text-xs">
          <AlertCircleIcon size={12} />
          <span className="truncate">{data.meta.error}</span>
        </div>
      ) : null}
      {isUploading || data.config.source ? null : (
        <Dropzone
          accept={{
            "application/pdf": [".pdf"],
            "text/markdown": [".md", ".markdown"],
            "text/plain": [".txt"],
          }}
          className="min-h-72 flex-1 rounded-b-xl border-none bg-secondary/60 p-0 shadow-none hover:bg-secondary/60 dark:bg-secondary/60 dark:hover:bg-secondary/60"
          maxFiles={1}
          maxSize={1024 * 1024 * 10}
          minSize={1024}
          multiple={false}
          onDrop={handleDrop}
          onError={console.error}
          src={files}
        >
          <DropzoneEmptyState className="p-4" />
          <DropzoneContent />
        </Dropzone>
      )}
    </NodeLayout>
  );
};
