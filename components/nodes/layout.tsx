import { useReactFlow } from "@xyflow/react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNodeOperations } from "@/providers/node-operations";
import { NodeToolbar } from "./toolbar";

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
  className?: string;
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

export const NodeLayout = ({
  children,
  type,
  id,
  data,
  toolbar,
  title,
  className,
}: NodeLayoutProps) => {
  const { deleteElements, setCenter, getNode, updateNode } = useReactFlow();
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
              target: true,
              source: type !== "video",
            }}
          >
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
            <NodeContent className="rounded-[28px] bg-card p-2 ring-1 ring-border">
              <div className="overflow-hidden rounded-3xl bg-card">
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
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleDelete} variant="destructive">
            <TrashIcon size={12} />
            <span>Delete</span>
          </ContextMenuItem>
          {process.env.NODE_ENV === "development" && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleShowData}>
                <CodeIcon size={12} />
                <span>Show data</span>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <Dialog onOpenChange={setShowData} open={showData}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Node data</DialogTitle>
            <DialogDescription>
              Data for node{" "}
              <code className="rounded-sm bg-secondary px-2 py-1 font-mono">
                {id}
              </code>
            </DialogDescription>
          </DialogHeader>
          <pre className="overflow-x-auto rounded-lg bg-black p-4 text-sm text-white">
            {JSON.stringify(data, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </>
  );
};
