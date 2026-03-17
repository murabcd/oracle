import { FileTextIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { NodeFile } from "@/lib/node-data";

const formatMimeType = (value: string) => {
  if (value === "application/pdf") {
    return "PDF";
  }

  if (value.startsWith("text/")) {
    return value.replace("text/", "").toUpperCase();
  }

  return value;
};

interface DocumentPreviewProps {
  emptyMessage: string;
  source?: NodeFile;
  text?: string;
  title?: string;
}

export const DocumentPreview = ({
  emptyMessage,
  source,
  text,
  title,
}: DocumentPreviewProps) => {
  const previewText = text?.trim();
  let previewBody: ReactNode = null;

  if (source) {
    previewBody = (
      <iframe
        className="h-full min-h-72 w-full bg-background"
        src={`${source.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title={source.name ?? title ?? "Document preview"}
      />
    );
  } else if (previewText) {
    previewBody = (
      <div className="h-full overflow-auto px-4 py-3">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
          {previewText}
        </pre>
      </div>
    );
  } else {
    previewBody = (
      <div className="flex h-full min-h-56 items-center justify-center text-balance px-4 text-center text-muted-foreground text-sm leading-6">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex min-h-72 flex-1 flex-col rounded-b-xl bg-secondary/60">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon className="size-4 text-muted-foreground" />
          <span className="truncate font-medium text-sm">
            {source?.name ?? title ?? "Document"}
          </span>
        </div>
        {source ? (
          <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground uppercase tracking-wide">
            {formatMimeType(source.type)}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{previewBody}</div>
    </div>
  );
};
