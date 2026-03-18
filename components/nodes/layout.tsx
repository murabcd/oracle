import {
  type Node as FlowNode,
  NodeResizer,
  type Position,
  useInternalNode,
  useReactFlow,
} from "@xyflow/react";
import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  EyeIcon,
  PaletteIcon,
  TrashIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
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
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NODE_BORDER_COLORS } from "@/lib/node-colors";
import {
  initializeNodeData,
  isNodeData,
  patchNodeConfig,
  patchNodeMeta,
} from "@/lib/node-data";
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
  data?: Record<string, unknown>;
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
  customHandles?: Array<{
    id?: string;
    position: Position;
    style?: CSSProperties;
    type: "source" | "target";
  }>;
  className?: string;
  contentClassName?: string;
  bodyClassName?: string;
  indicator?: ReactNode;
}

interface NodeStatusMetadata {
  borderColor: string;
  createdAtTitle: string | null;
  hasBeenUpdated: boolean;
  statusLabel: "created" | "updated";
  statusValue: string | null;
  updatedAtTitle: string | null;
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

const normalizeNodeSheetData = (data?: Record<string, unknown>) => {
  if (!data) {
    return {};
  }

  if (!isNodeData(data)) {
    return data;
  }

  const nodeData = initializeNodeData(data);

  return {
    config: nodeData.config,
    meta: nodeData.meta,
    result: nodeData.result,
  };
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
    if (
      key === "config" ||
      key === "content" ||
      key === "generated" ||
      key === "result"
    ) {
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

const getNodeStatusMetadata = (
  data?: Record<string, unknown>
): NodeStatusMetadata => {
  const nodeData = data ? initializeNodeData(data) : null;
  const borderColor =
    typeof nodeData?.config.borderColor === "string"
      ? nodeData.config.borderColor
      : "";
  const createdAt = nodeData?.meta.createdAt
    ? formatHeaderTimestamp(nodeData.meta.createdAt)
    : null;
  const updatedAt = nodeData?.meta.updatedAt
    ? formatUpdatedAt(nodeData.meta.updatedAt)
    : null;
  const rawCreatedAt = nodeData?.meta.createdAt ?? null;
  const rawUpdatedAt = nodeData?.meta.updatedAt ?? null;
  const hasBeenUpdated =
    Boolean(rawCreatedAt) &&
    Boolean(rawUpdatedAt) &&
    rawCreatedAt !== rawUpdatedAt;

  return {
    borderColor,
    createdAtTitle: rawCreatedAt
      ? new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(rawCreatedAt))
      : null,
    hasBeenUpdated,
    statusLabel: hasBeenUpdated ? "updated" : "created",
    statusValue: hasBeenUpdated ? updatedAt : createdAt,
    updatedAtTitle: rawUpdatedAt
      ? new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(rawUpdatedAt))
      : null,
  };
};

const getActionTargetNodes = ({
  currentNode,
  nodes,
}: {
  currentNode?: FlowNode;
  nodes: FlowNode[];
}) => {
  if (!currentNode) {
    return [];
  }

  const selectedNodes = nodes.filter(
    (node) => node.selected && node.type !== "drop"
  );

  if (currentNode.selected && selectedNodes.length > 1) {
    return selectedNodes;
  }

  return currentNode.type === "drop" ? [] : [currentNode];
};

const focusNodes = ({
  nodes,
  setCenter,
}: {
  nodes: FlowNode[];
  setCenter: ReturnType<typeof useReactFlow>["setCenter"];
}) => {
  if (!nodes.length) {
    return;
  }

  const bounds = nodes.reduce(
    (acc, node) => {
      const width =
        node.measured?.width ??
        (typeof node.width === "number" ? node.width : 0);
      const height =
        node.measured?.height ??
        (typeof node.height === "number" ? node.height : 0);

      return {
        bottom: Math.max(acc.bottom, node.position.y + height),
        left: Math.min(acc.left, node.position.x),
        right: Math.max(acc.right, node.position.x + width),
        top: Math.min(acc.top, node.position.y),
      };
    },
    {
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
    }
  );

  setCenter(
    (bounds.left + bounds.right) / 2,
    (bounds.top + bounds.bottom) / 2,
    {
      duration: 1000,
    }
  );
};

const NodeDataSheet = ({
  id,
  open,
  onOpenChange,
  data,
}: NodeDataSheetProps) => {
  const displayFields = getDisplayFields(normalizeNodeSheetData(data));

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
                      ? "wrap-break-word whitespace-pre-wrap bg-zinc-950"
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
  customHandles,
  title,
  className,
  contentClassName,
  bodyClassName,
  indicator,
}: NodeLayoutProps) => {
  const internalNode = useInternalNode(id);
  const {
    deleteElements,
    setCenter,
    getNode,
    getNodes,
    updateNode,
    updateNodeData,
  } = useReactFlow();
  const { duplicateNode } = useNodeOperations();
  const [showData, setShowData] = useState(false);
  const {
    borderColor,
    createdAtTitle,
    hasBeenUpdated,
    statusLabel,
    statusValue,
    updatedAtTitle,
  } = getNodeStatusMetadata(data);
  const resolveActionTargetNodes = () =>
    getActionTargetNodes({
      currentNode: getNode(id),
      nodes: getNodes(),
    });

  const handleFocus = () => {
    focusNodes({
      nodes: resolveActionTargetNodes(),
      setCenter,
    });
  };

  const handleDelete = () => {
    deleteElements({
      nodes: resolveActionTargetNodes().map((node) => ({ id: node.id })),
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
      updateNodeData(
        id,
        patchNodeMeta(initializeNodeData(data), {
          updatedAt: new Date().toISOString(),
        })
      );
    }
  };

  const handleBorderColorChange = (value: string) => {
    const targetNodes = resolveActionTargetNodes();

    if (!targetNodes.length) {
      return;
    }

    for (const targetNode of targetNodes) {
      updateNodeData(
        targetNode.id,
        patchNodeConfig(initializeNodeData(targetNode.data), {
          borderColor: value || undefined,
        })
      );
    }
  };

  const handleDuplicate = () => {
    const targetNodes = resolveActionTargetNodes();

    if (!targetNodes.length) {
      return;
    }

    for (const targetNode of targetNodes) {
      duplicateNode(targetNode.id);
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
            customHandles={customHandles}
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
              style={
                borderColor
                  ? {
                      boxShadow: `inset 0 0 0 1px ${borderColor}, 0 0 0 1px ${borderColor}33`,
                    }
                  : undefined
              }
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
          <ContextMenuItem onClick={handleDuplicate}>
            <CopyIcon size={12} />
            <span>Duplicate</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleFocus}>
            <EyeIcon size={12} />
            <span>Focus</span>
          </ContextMenuItem>
          {type !== "drop" && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <PaletteIcon size={12} />
                <span>Border color</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="min-w-44">
                {NODE_BORDER_COLORS.map((color) => (
                  <ContextMenuItem
                    key={color.label}
                    onClick={() => handleBorderColorChange(color.value)}
                  >
                    <span
                      className="size-3 rounded-full border border-white/10"
                      style={{
                        backgroundColor: color.value || "transparent",
                        boxShadow: color.value
                          ? `inset 0 0 0 1px ${color.value}`
                          : "inset 0 0 0 1px var(--border)",
                      }}
                    />
                    <span>{color.label}</span>
                    {borderColor === color.value ? (
                      <CheckIcon className="ml-auto" size={14} />
                    ) : null}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
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
