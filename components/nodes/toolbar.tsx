import { useReactFlow } from "@xyflow/react";
import { type ComponentProps, Fragment } from "react";
import { Toolbar } from "../ai-elements/toolbar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface NodeToolbarProps {
  id: string;
  items:
    | {
        id: string;
        tooltip?: string;
        children: ComponentProps<typeof TooltipTrigger>["children"];
      }[]
    | undefined;
}

export const NodeToolbar = ({ id, items }: NodeToolbarProps) => {
  const { getNode } = useReactFlow();
  const node = getNode(id);

  return (
    <Toolbar className="rounded-full" isVisible={node?.selected}>
      {items?.map((button) =>
        button.tooltip ? (
          <Tooltip key={button.id}>
            <TooltipTrigger asChild>{button.children}</TooltipTrigger>
            <TooltipContent>{button.tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <Fragment key={button.id}>{button.children}</Fragment>
        )
      )}
    </Toolbar>
  );
};
