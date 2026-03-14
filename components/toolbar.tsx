"use client";

import { useReactFlow } from "@xyflow/react";
import { PlusIcon } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { nodeButtons } from "@/lib/node-buttons";
import { cn } from "@/lib/utils";
import { useNodeOperations } from "@/providers/node-operations";
import { Panel } from "./ai-elements/panel";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const ToolbarInner = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const mobileToolbarRef = useRef<HTMLDivElement | null>(null);
  const { getViewport } = useReactFlow();
  const { addNode } = useNodeOperations();

  const handleAddNode = (type: string, options?: Record<string, unknown>) => {
    // Get the current viewport
    const viewport = getViewport();

    // Calculate the center of the current viewport
    const centerX =
      -viewport.x / viewport.zoom + window.innerWidth / 2 / viewport.zoom;
    const centerY =
      -viewport.y / viewport.zoom + window.innerHeight / 2 / viewport.zoom;

    const position = { x: centerX, y: centerY };
    const { data: nodeData, ...rest } = options ?? {};

    addNode(type, {
      position,
      data: {
        ...(nodeData ? nodeData : {}),
      },
      ...rest,
    });
  };

  useEffect(() => {
    if (!(isMobile && isOpen)) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        mobileToolbarRef.current &&
        !mobileToolbarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMobile, isOpen]);

  if (isMobile) {
    return (
      <Panel
        className="overflow-visible rounded-full border-none bg-transparent p-0 shadow-none"
        onDoubleClick={(e) => e.stopPropagation()}
        position="top-right"
      >
        <div className="flex flex-col items-end gap-2" ref={mobileToolbarRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={
                  isOpen ? "Close add node menu" : "Open add node menu"
                }
                className="size-11 rounded-full border border-border/80 bg-card/95 shadow-lg backdrop-blur-sm"
                onClick={() => setIsOpen((open) => !open)}
                size="icon"
                variant="outline"
              >
                <PlusIcon
                  className={cn(
                    "size-4 transition-transform",
                    isOpen && "rotate-45"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isOpen ? "Close" : "Add node"}</TooltipContent>
          </Tooltip>
          <div
            className={cn(
              "flex flex-col gap-1 rounded-full border border-border/80 bg-card/95 p-1 shadow-lg backdrop-blur-sm transition-all duration-200",
              isOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-2 opacity-0"
            )}
          >
            {nodeButtons.map((button) => (
              <Button
                className="rounded-full"
                key={button.id}
                onClick={() => {
                  handleAddNode(button.id);
                  setIsOpen(false);
                }}
                size="icon"
                variant="ghost"
              >
                <button.icon size={12} />
              </Button>
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      className="rounded-full"
      onDoubleClick={(e) => e.stopPropagation()}
      position="bottom-right"
    >
      {nodeButtons.map((button) => (
        <Tooltip key={button.id}>
          <TooltipTrigger asChild>
            <Button
              className="rounded-full"
              onClick={() => handleAddNode(button.id)}
              size="icon"
              variant="ghost"
            >
              <button.icon size={12} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{button.label}</TooltipContent>
        </Tooltip>
      ))}
    </Panel>
  );
};

export const Toolbar = memo(ToolbarInner);
