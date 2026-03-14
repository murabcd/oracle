import type { Node } from "@xyflow/react";
import type { CSSProperties } from "react";

export const DEFAULT_NODE_WIDTH = 384;

export const getNodeStyleWithDefaultWidth = ({
  style,
  type,
  width,
}: {
  style?: CSSProperties;
  type?: string;
  width?: number;
}) => {
  if (
    type === "drop" ||
    typeof width === "number" ||
    typeof style?.width !== "undefined"
  ) {
    return style;
  }

  return {
    ...style,
    width: DEFAULT_NODE_WIDTH,
  } satisfies CSSProperties;
};

export const applyDefaultNodeWidth = (node: Node): Node => {
  const style = getNodeStyleWithDefaultWidth({
    style: node.style as CSSProperties | undefined,
    type: node.type,
    width: node.width,
  });

  if (style === node.style || typeof style === "undefined") {
    return node;
  }

  return {
    ...node,
    style,
  };
};
