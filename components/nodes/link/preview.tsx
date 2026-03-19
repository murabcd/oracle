import { ExternalLinkIcon, GlobeIcon, ImageIcon } from "lucide-react";
import type { LinkNodeResult } from ".";

interface LinkPreviewProps {
  result?: LinkNodeResult;
}

export const LinkPreview = ({ result }: LinkPreviewProps) => {
  const chromeStyle = {
    paddingBlock: "calc(0.75rem * var(--node-scale, 1))",
    paddingInline: "calc(1rem * var(--node-scale, 1))",
  } as const;

  if (!result) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-b-xl bg-secondary/60 px-4 text-center">
        <div className="max-w-56 text-muted-foreground text-sm leading-6">
          Paste a URL to create an embed or source preview here.
        </div>
      </div>
    );
  }

  let previewContent = (
    <div className="flex h-full min-h-0 items-center justify-center rounded-t-3xl bg-background/70">
      <ImageIcon className="size-8 text-muted-foreground" />
    </div>
  );

  if (result.embedUrl) {
    previewContent = (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        className="size-full min-h-0 rounded-t-3xl border-0 bg-background"
        loading="lazy"
        src={result.embedUrl}
        title={result.title}
      />
    );
  } else if (result.image) {
    previewContent = (
      <div
        aria-label={result.title}
        className="size-full min-h-0 rounded-t-3xl bg-center bg-cover bg-no-repeat"
        role="img"
        style={{ backgroundImage: `url("${result.image}")` }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-b-xl bg-secondary/60">
      <div className="min-h-0 flex-1 overflow-hidden">{previewContent}</div>
      <div className="flex flex-col gap-2" style={chromeStyle}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p
              className="truncate font-medium"
              style={{ fontSize: "calc(0.875rem * var(--node-scale, 1))" }}
            >
              {result.title}
            </p>
            <div
              className="mt-1 flex items-center gap-2 text-muted-foreground"
              style={{ fontSize: "calc(0.75rem * var(--node-scale, 1))" }}
            >
              <GlobeIcon className="size-3" />
              <span className="truncate">
                {result.siteName ?? result.hostname}
              </span>
            </div>
          </div>
          <a
            className="shrink-0 rounded-full border p-2 text-muted-foreground transition-colors hover:text-foreground"
            href={result.url}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>
        {result.description ? (
          <p
            className="line-clamp-3 text-muted-foreground"
            style={{
              fontSize: "calc(0.875rem * var(--node-scale, 1))",
              lineHeight: "calc(1.5rem * var(--node-scale, 1))",
            }}
          >
            {result.description}
          </p>
        ) : null}
      </div>
    </div>
  );
};
