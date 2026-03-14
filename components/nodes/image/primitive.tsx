import { useReactFlow } from "@xyflow/react";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/kibo-ui/dropzone";
import { NodeLayout } from "@/components/nodes/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/error/handle";
import { describeImageRequest } from "@/lib/media/client";
import { uploadFile } from "@/lib/upload";
import type { ImageNodeProps } from ".";

type ImagePrimitiveProps = ImageNodeProps & {
  title: string;
};

export const ImagePrimitive = ({
  data,
  id,
  type,
  title,
}: ImagePrimitiveProps) => {
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
      const hasExistingContent = Boolean(data.content?.url || data.description);

      updateNodeData(id, {
        content: {
          url,
          type: contentType,
        },
        ...(hasExistingContent ? { updatedAt: new Date().toISOString() } : {}),
      });

      const description = await describeImageRequest(url);

      if ("error" in description) {
        throw new Error(description.error);
      }

      updateNodeData(id, {
        description: description.description,
        ...(hasExistingContent ? { updatedAt: new Date().toISOString() } : {}),
      });
    } catch (error) {
      handleError("Error uploading image", error);
    } finally {
      setIsUploading(false);
    }
  };

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
        <Skeleton className="flex min-h-72 flex-1 animate-pulse items-center justify-center">
          <Loader2Icon
            className="size-4 animate-spin text-muted-foreground"
            size={16}
          />
        </Skeleton>
      ) : null}
      {!isUploading && data.content && (
        <Image
          alt="Image"
          className="min-h-72 flex-1 object-contain"
          height={data.height ?? 1000}
          src={data.content.url}
          width={data.width ?? 1000}
        />
      )}
      {!(isUploading || data.content) && (
        <Dropzone
          accept={{
            "image/*": [],
          }}
          className="min-h-72 flex-1 rounded-none border-none bg-transparent p-0 shadow-none hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
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
