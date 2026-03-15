import type { Edge, Node } from "@xyflow/react";
import { NODE_DATA_VERSION } from "@/lib/node-data";

const STORAGE_KEY = "oracle-canvas";

interface CanvasData {
  nodes: Node[];
  edges: Edge[];
}

interface StoredCanvasData extends CanvasData {
  version: number;
}

export const saveCanvas = (data: CanvasData) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        version: NODE_DATA_VERSION,
      } satisfies StoredCanvasData)
    );
  } catch {
    // localStorage may be full or unavailable
  }
};

export const loadCanvas = (): CanvasData | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredCanvasData;

    if (parsed.version !== NODE_DATA_VERSION) {
      return null;
    }

    return {
      edges: parsed.edges,
      nodes: parsed.nodes,
    };
  } catch {
    return null;
  }
};
