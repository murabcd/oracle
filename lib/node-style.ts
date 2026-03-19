import type { Node } from "@xyflow/react";
import type { CSSProperties } from "react";

export const DEFAULT_NODE_WIDTH = 384;
export const DEFAULT_NODE_HEIGHT = 320;

const NODE_DEFAULT_SIZES: Partial<
  Record<string, { height: number; width: number }>
> = {
  note: {
    height: 220,
    width: 320,
  },
};

export const getNodeStyleWithDefaultSize = ({
  style,
  type,
  height,
  width,
}: {
  style?: CSSProperties;
  type?: string;
  height?: number;
  width?: number;
}) => {
  if (type === "drop") {
    return style;
  }

  const defaultSize =
    typeof type === "string" ? NODE_DEFAULT_SIZES[type] : undefined;

  return {
    ...style,
    ...(typeof width === "number" || typeof style?.width !== "undefined"
      ? {}
      : { width: defaultSize?.width ?? DEFAULT_NODE_WIDTH }),
    ...(typeof height === "number" || typeof style?.height !== "undefined"
      ? {}
      : { height: defaultSize?.height ?? DEFAULT_NODE_HEIGHT }),
  } satisfies CSSProperties;
};

export const applyDefaultNodeSize = (node: Node): Node => {
  const style = getNodeStyleWithDefaultSize({
    height: node.height,
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
