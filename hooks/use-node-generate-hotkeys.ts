"use client";

import { useHotkeys } from "react-hotkeys-hook";

export const useNodeGenerateHotkeys = ({
  disabled = false,
  onGenerate,
}: {
  disabled?: boolean;
  onGenerate: () => Promise<void> | void;
}) =>
  useHotkeys<HTMLTextAreaElement>(
    "enter,meta+enter,ctrl+enter",
    (event) => {
      if (disabled || event.isComposing || event.shiftKey) {
        return;
      }

      event.preventDefault();
      onGenerate();
    },
    {
      enableOnContentEditable: false,
      enableOnFormTags: ["TEXTAREA"],
      enabled: !disabled,
      preventDefault: true,
    },
    [disabled, onGenerate]
  );
