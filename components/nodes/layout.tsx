import { NodeResizer, useInternalNode, useReactFlow } from "@xyflow/react";
import { CodeIcon, CopyIcon, EyeIcon, TrashIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Node,
  NodeContent,
  NodeHeader,
  NodeTitle,
} from "@/components/ai-elements/node";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNodeOperations } from "@/providers/node-operations";
import { NodeToolbar } from "./toolbar";

interface InlineField {
  label: string;
  value: string;
}

interface BlockField {
  label: string;
  value: string;
  variant: "code" | "json" | "text";
}

interface DisplayFields {
  inlineFields: InlineField[];
  blockFields: BlockField[];
}

interface NodeDataSheetProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Record<string, unknown>;
}

interface NodeLayoutProps {
  children: ReactNode;
  id: string;
  data?: Record<string, unknown> & {
    createdAt?: string;
    model?: string;
    source?: string;
    generated?: object;
    updatedAt?: string;
  };
  title: string;
  type: string;
  toolbar?: {
    id: string;
    tooltip?: string;
    children: ReactNode;
  }[];
  handles?: {
    source?: boolean;
    target?: boolean;
  };
  className?: string;
  contentClassName?: string;
  bodyClassName?: string;
  indicator?: ReactNode;
}

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  const now = new Date();

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return isSameDay
    ? new Intl.DateTimeFormat("en-US", {
        timeStyle: "short",
      }).format(date)
    : new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
      }).format(date);
};

const formatHeaderTimestamp = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(new Date(value));

const CAMEL_CASE_BOUNDARY_RE = /([a-z0-9])([A-Z])/g;
const WORD_SEPARATOR_RE = /[-_]/g;
const FIRST_CHARACTER_RE = /^./;
const HIDDEN_METADATA_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "model",
  "width",
  "height",
  "type",
  "url",
]);

const toLabel = (value: string) =>
  value
    .split(".")
    .map((segment) =>
      segment
        .replace(CAMEL_CASE_BOUNDARY_RE, "$1 $2")
        .replace(WORD_SEPARATOR_RE, " ")
        .replace(FIRST_CHARACTER_RE, (character) => character.toUpperCase())
    )
    .join(" / ");

const tryParseJsonString = (value: string) => {
  const trimmed = value.trim();

  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
};

const toPrettyJson = (value: unknown) => JSON.stringify(value, null, 2);

const areEquivalentJsonValues = (left: unknown, right: unknown) =>
  toPrettyJson(left) === toPrettyJson(right);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getSkippedKeys = (entries: Record<string, unknown>) => {
  const skipKeys = new Set<string>();
  const parsedJson =
    typeof entries.json === "string" ? tryParseJsonString(entries.json) : null;

  if (
    parsedJson &&
    typeof entries.spec !== "undefined" &&
    areEquivalentJsonValues(parsedJson, entries.spec)
  ) {
    skipKeys.add("spec");
  }

  if (
    typeof entries.text === "string" &&
    typeof entries.content !== "undefined" &&
    entries.text.trim().length > 0
  ) {
    skipKeys.add("content");
  }

  if ("previewSpec" in entries) {
    skipKeys.add("previewSpec");
  }

  return skipKeys;
};

const pushInlineField = (
  inlineFields: InlineField[],
  label: string,
  value: string
) => {
  inlineFields.push({ label, value });
};

const pushBlockField = (
  blockFields: BlockField[],
  label: string,
  value: string,
  variant: BlockField["variant"]
) => {
  blockFields.push({ label, value, variant });
};

const appendDisplayField = (
  key: string,
  entryValue: unknown,
  fieldPath: string,
  displayFields: DisplayFields,
  visit: (entries: Record<string, unknown>, path?: string) => void
) => {
  const label = toLabel(fieldPath);

  if (entryValue === null) {
    pushInlineField(displayFields.inlineFields, label, "null");
    return;
  }

  if (
    typeof entryValue === "boolean" ||
    typeof entryValue === "number" ||
    typeof entryValue === "bigint"
  ) {
    pushInlineField(displayFields.inlineFields, label, String(entryValue));
    return;
  }

  if (typeof entryValue === "string") {
    if (entryValue.trim().length === 0) {
      return;
    }

    const parsedJson = tryParseJsonString(entryValue);

    if (parsedJson) {
      pushBlockField(
        displayFields.blockFields,
        label,
        toPrettyJson(parsedJson),
        "json"
      );
      return;
    }

    if (key === "text") {
      pushBlockField(displayFields.blockFields, label, entryValue, "text");
      return;
    }

    if (entryValue.includes("\n")) {
      pushBlockField(displayFields.blockFields, label, entryValue, "code");
      return;
    }

    if (entryValue.length > 120) {
      pushBlockField(displayFields.blockFields, label, entryValue, "text");
      return;
    }

    pushInlineField(displayFields.inlineFields, label, entryValue);
    return;
  }

  if (Array.isArray(entryValue)) {
    pushBlockField(
      displayFields.blockFields,
      label,
      toPrettyJson(entryValue),
      "json"
    );
    return;
  }

  if (isPlainObject(entryValue)) {
    if (key === "generated" || key === "content") {
      visit(entryValue, "");
      return;
    }

    pushBlockField(
      displayFields.blockFields,
      label,
      toPrettyJson(entryValue),
      "json"
    );
    return;
  }

  pushInlineField(displayFields.inlineFields, label, String(entryValue));
};

const getDisplayFields = (value: Record<string, unknown>): DisplayFields => {
  const displayFields: DisplayFields = {
    inlineFields: [],
    blockFields: [],
  };

  const visit = (entries: Record<string, unknown>, path = "") => {
    const skipKeys = getSkippedKeys(entries);

    for (const [key, entryValue] of Object.entries(entries)) {
      if (typeof entryValue === "undefined" || skipKeys.has(key)) {
        continue;
      }

      if (HIDDEN_METADATA_KEYS.has(key)) {
        continue;
      }

      const fieldPath = path ? `${path}.${key}` : key;
      appendDisplayField(key, entryValue, fieldPath, displayFields, visit);
    }
  };

  visit(value);

  return displayFields;
};

const NodeDataSheet = ({
  id,
  open,
  onOpenChange,
  data,
}: NodeDataSheetProps) => {
  const displayFields = getDisplayFields(data ?? {});

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="gap-0">
        <SheetHeader>
          <SheetTitle>Node data</SheetTitle>
          <SheetDescription>
            Data for node{" "}
            <code className="rounded-sm bg-secondary px-2 py-1 font-mono">
              {id}
            </code>
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          <div className="space-y-4">
            {displayFields.inlineFields.length > 0 ? (
              <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                {displayFields.inlineFields.map((field) => (
                  <div
                    className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    key={field.label}
                  >
                    <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.12em]">
                      {field.label}
                    </span>
                    <code className="break-all rounded-sm bg-secondary px-2 py-1 font-mono text-[11px] text-foreground">
                      {field.value}
                    </code>
                  </div>
                ))}
              </div>
            ) : null}
            {displayFields.blockFields.map((field) => (
              <section key={field.label}>
                <pre
                  className={cn(
                    "overflow-auto rounded-lg p-4 font-mono text-[11px] text-white",
                    field.variant === "text"
                      ? "whitespace-pre-wrap break-words bg-zinc-950"
                      : "whitespace-pre bg-black"
                  )}
                >
                  {field.value}
                </pre>
              </section>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const NodeLayout = ({
  children,
  type,
  id,
  data,
  toolbar,
  handles,
  title,
  className,
  contentClassName,
  bodyClassName,
  indicator,
}: NodeLayoutProps) => {
  const internalNode = useInternalNode(id);
  const { deleteElements, setCenter, getNode, updateNode, updateNodeData } =
    useReactFlow();
  const { duplicateNode } = useNodeOperations();
  const [showData, setShowData] = useState(false);
  const createdAt = data?.createdAt
    ? formatHeaderTimestamp(data.createdAt)
    : null;
  const updatedAt = data?.updatedAt ? formatUpdatedAt(data.updatedAt) : null;
  const hasBeenUpdated =
    Boolean(data?.createdAt) &&
    Boolean(data?.updatedAt) &&
    data?.createdAt !== data?.updatedAt;
  const statusLabel = hasBeenUpdated ? "updated" : "created";
  const statusValue = hasBeenUpdated ? updatedAt : createdAt;
  const createdAtTitle = data?.createdAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(data.createdAt))
    : null;
  const updatedAtTitle = data?.updatedAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(data.updatedAt))
    : null;
  const handleFocus = () => {
    const node = getNode(id);

    if (!node) {
      return;
    }

    const width = node.measured?.width ?? 0;
    const centerX = node.position.x + width / 2;
    const centerY = node.position.y;

    setCenter(centerX, centerY, {
      duration: 1000,
    });
  };

  const handleDelete = () => {
    deleteElements({
      nodes: [{ id }],
    });
  };

  const handleShowData = () => {
    setTimeout(() => {
      setShowData(true);
    }, 100);
  };

  const handleSelect = (open: boolean) => {
    if (!open) {
      return;
    }

    const node = getNode(id);

    if (!node) {
      return;
    }

    if (!node.selected) {
      updateNode(id, { selected: true });
    }
  };

  const handleResizeEnd = (
    _event: unknown,
    params: { width: number; height: number }
  ) => {
    updateNode(id, {
      style: {
        ...(internalNode?.style ?? {}),
        width: params.width,
        height: params.height,
      },
    });

    if (type !== "drop") {
      updateNodeData(id, {
        updatedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <>
      {type !== "drop" && Boolean(toolbar?.length) && (
        <NodeToolbar id={id} items={toolbar} />
      )}
      <ContextMenu onOpenChange={handleSelect}>
        <ContextMenuTrigger>
          <Node
            className={cn(
              className,
              "rounded-[28px] bg-transparent shadow-none"
            )}
            handles={{
              target: handles?.target ?? true,
              source: handles?.source ?? true,
            }}
          >
            {type !== "drop" && (
              <NodeResizer
                autoScale={false}
                handleStyle={{
                  background: "transparent",
                  border: "none",
                  height: 16,
                  opacity: 0,
                  width: 16,
                }}
                isVisible={Boolean(internalNode?.selected)}
                lineStyle={{
                  borderColor: "transparent",
                }}
                minHeight={120}
                minWidth={240}
                onResizeEnd={handleResizeEnd}
              />
            )}
            {type !== "drop" && (
              <NodeHeader className="flex! items-center! absolute -top-6 left-0 mb-3 w-auto! flex-row! gap-1 border-none bg-transparent p-0!">
                <NodeTitle className="shrink-0 font-mono font-normal text-foreground text-xs leading-none">
                  {title}
                </NodeTitle>
                {statusValue ? (
                  <>
                    <span
                      className="shrink-0 font-mono text-[10px] text-muted-foreground/70 leading-none"
                      title={
                        hasBeenUpdated
                          ? (updatedAtTitle ?? undefined)
                          : (createdAtTitle ?? undefined)
                      }
                    >
                      {statusLabel}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70 leading-none">
                      {statusValue}
                    </span>
                  </>
                ) : null}
              </NodeHeader>
            )}
            <NodeContent
              className={cn(
                "relative rounded-[28px] bg-card p-2 ring-1 ring-border",
                contentClassName
              )}
            >
              {indicator}
              <div
                className={cn(
                  "overflow-hidden rounded-3xl bg-card",
                  bodyClassName
                )}
              >
                {children}
              </div>
            </NodeContent>
          </Node>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => duplicateNode(id)}>
            <CopyIcon size={12} />
            <span>Duplicate</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleFocus}>
            <EyeIcon size={12} />
            <span>Focus</span>
          </ContextMenuItem>
          {process.env.NODE_ENV === "development" && (
            <>
              <ContextMenuItem onClick={handleShowData}>
                <CodeIcon size={12} />
                <span>Show data</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={handleDelete} variant="destructive">
            <TrashIcon size={12} />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <NodeDataSheet
        data={data}
        id={id}
        onOpenChange={setShowData}
        open={showData}
      />
    </>
  );
};
