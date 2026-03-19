import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "nowheel flex field-sizing-content min-h-[calc(4rem*var(--node-scale,1))] max-h-[calc(var(--node-height,320px)*0.35)] w-full overflow-y-auto rounded-md border border-input bg-transparent px-[calc(0.75rem*var(--node-scale,1))] py-[calc(0.5rem*var(--node-scale,1))] text-[calc(0.875rem*var(--node-scale,1))] leading-[calc(1.5rem*var(--node-scale,1))] shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className
      )}
      data-slot="textarea"
      ref={ref}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
