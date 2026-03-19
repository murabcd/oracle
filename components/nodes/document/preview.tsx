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
  const chromeStyle = {
    paddingBlock: "calc(0.75rem * var(--node-scale, 1))",
    paddingInline: "calc(1rem * var(--node-scale, 1))",
  } as const;
  const previewText = text?.trim();
  let previewBody: ReactNode = null;

  if (source) {
    previewBody = (
      <iframe
        className="size-full min-h-0 bg-background"
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
      <div className="flex h-full min-h-0 items-center justify-center text-balance px-4 text-center text-muted-foreground text-sm leading-6">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-b-xl bg-secondary/60">
      <div
        className="flex items-center justify-between border-b"
        style={chromeStyle}
      >
        <div className="flex min-w-0 items-center gap-2">
          <FileTextIcon className="size-4 text-muted-foreground" />
          <span
            className="truncate font-medium"
            style={{ fontSize: "calc(0.875rem * var(--node-scale, 1))" }}
          >
            {source?.name ?? title ?? "Document"}
          </span>
        </div>
        {source ? (
          <span
            className="rounded-full border text-muted-foreground uppercase tracking-wide"
            style={{
              fontSize: "calc(10px * var(--node-scale, 1))",
              padding:
                "calc(0.125rem * var(--node-scale, 1)) calc(0.5rem * var(--node-scale, 1))",
            }}
          >
            {formatMimeType(source.type)}
          </span>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{previewBody}</div>
    </div>
  );
};
