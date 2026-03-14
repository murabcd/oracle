"use client";

import { memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Controls as ControlsPrimitive } from "./ai-elements/controls";
import { ThemeSwitcher } from "./theme-switcher";

const ControlsInner = () => {
  const isMobile = useIsMobile();

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Prevents ReactFlow double-click zoom
    <div onDoubleClick={(e) => e.stopPropagation()} role="toolbar">
      <ControlsPrimitive
        className="rounded-full [&>button]:rounded-full [&>button]:hover:bg-accent"
        orientation="horizontal"
        position={isMobile ? "top-left" : "bottom-left"}
        showInteractive={false}
      >
        <ThemeSwitcher />
      </ControlsPrimitive>
    </div>
  );
};

export const Controls = memo(ControlsInner);
