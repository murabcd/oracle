"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ThemeSwitcher = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="rounded-full"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          size="icon"
          type="button"
          variant="ghost"
        >
          {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        {isDark ? "Light" : "Dark"}
      </TooltipContent>
    </Tooltip>
  );
};
