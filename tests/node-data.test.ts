import { describe, expect, it } from "vitest";
import {
  createNodeData,
  getNodeMode,
  initializeNodeData,
  type NodeConfigBase,
} from "@/lib/node-data";

describe("node data mode", () => {
  it("defaults missing node mode to primitive", () => {
    expect(getNodeMode(undefined)).toBe("primitive");
    expect(createNodeData<NodeConfigBase>({}).config.mode).toBe("primitive");
    expect(
      initializeNodeData<NodeConfigBase>({
        config: {},
      }).config.mode
    ).toBe("primitive");
  });

  it("preserves transform mode when provided", () => {
    expect(
      initializeNodeData({
        config: {
          mode: "transform",
        },
      }).config.mode
    ).toBe("transform");
  });
});
