import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseJsonRenderSpec } from "@/lib/json-render/catalog";

const google = vi.fn();
const openai = vi.fn();
const generateObject = vi.fn();
const generateText = vi.fn();

vi.mock("@ai-sdk/google", () => ({
  google,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai,
}));

vi.mock("ai", () => ({
  generateObject,
  generateText,
}));

describe("generateJsonRender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates UI in no-schema mode and validates it locally", async () => {
    openai.mockReturnValue({ provider: "openai-model" });
    generateObject.mockResolvedValue({
      object: {
        root: "text-1",
        elements: {
          "text-1": {
            type: "Text",
            props: {
              text: "Ready",
              variant: null,
            },
            children: [],
          },
        },
      },
    });

    const { generateJsonRender } = await import("@/lib/json-render/server");
    const result = await generateJsonRender({
      modelId: "gpt-5.4",
      prompt: "Build a compact status card",
      instructions: "Keep it minimal",
    });

    expect(openai).toHaveBeenCalledWith("gpt-5.4");
    expect(generateObject).toHaveBeenCalledWith({
      model: { provider: "openai-model" },
      output: "no-schema",
      system: expect.any(String),
      prompt: expect.any(String),
    });
    expect(result).toEqual({
      json: `{
  "root": "text-1",
  "elements": {
    "text-1": {
      "type": "Text",
      "props": {
        "text": "Ready",
        "variant": null
      },
      "children": []
    }
  }
}`,
      spec: {
        root: "text-1",
        elements: {
          "text-1": {
            type: "Text",
            props: {
              text: "Ready",
              variant: null,
            },
            children: [],
          },
        },
      },
    });
  });

  it("returns a validation error when the model emits an invalid spec", async () => {
    google.mockReturnValue({ provider: "google-model" });
    generateObject.mockResolvedValue({
      object: {
        root: "bad-1",
        elements: {
          "bad-1": {
            type: "Unknown",
            props: {},
            children: [],
          },
        },
      },
    });

    const { generateJsonRender } = await import("@/lib/json-render/server");
    const result = await generateJsonRender({
      modelId: "gemini-2.5-flash",
      prompt: "Build something invalid",
    });

    expect(google).toHaveBeenCalledWith("gemini-2.5-flash");
    expect("error" in result).toBe(true);
    if (!("error" in result)) {
      throw new Error("Expected generation to fail validation");
    }
    expect(result).toHaveProperty("error");
    expect(result.error).toContain('"path": [');
    expect(result.error).toContain('"type"');
  });

  it("retries once when the first response is missing the required spec shape", async () => {
    openai.mockReturnValue({ provider: "openai-model" });
    generateObject
      .mockResolvedValueOnce({
        object: {},
      })
      .mockResolvedValueOnce({
        object: {
          root: "text-1",
          elements: {
            "text-1": {
              type: "Text",
              props: {
                text: "Recovered",
                variant: null,
              },
              children: [],
            },
          },
        },
      });

    const { generateJsonRender } = await import("@/lib/json-render/server");
    const result = await generateJsonRender({
      modelId: "gpt-5.4",
      prompt: "Build a compact recovery card",
    });

    expect(generateObject).toHaveBeenCalledTimes(2);
    expect(generateObject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        prompt: expect.stringContaining(
          "Your previous response was invalid. Return a non-empty JSON object with root and elements."
        ),
      })
    );
    expect(result).toEqual({
      json: `{
  "root": "text-1",
  "elements": {
    "text-1": {
      "type": "Text",
      "props": {
        "text": "Recovered",
        "variant": null
      },
      "children": []
    }
  }
}`,
      spec: {
        root: "text-1",
        elements: {
          "text-1": {
            type: "Text",
            props: {
              text: "Recovered",
              variant: null,
            },
            children: [],
          },
        },
      },
    });
  });

  it("applies patch-mode refinements when a starting spec is provided", async () => {
    openai.mockReturnValue({ provider: "openai-model" });
    generateText.mockResolvedValue({
      text: '{"op":"replace","path":"/elements/text-1/props/text","value":"Updated"}',
    });

    const { generateJsonRender } = await import("@/lib/json-render/server");
    const result = await generateJsonRender({
      modelId: "gpt-5.4",
      prompt: "Update the copy",
      startingSpec: parseJsonRenderSpec(`{
        "root": "text-1",
        "elements": {
          "text-1": {
            "type": "Text",
            "props": {
              "text": "Ready",
              "variant": null
            },
            "children": []
          }
        }
      }`),
    });

    expect(generateText).toHaveBeenCalledWith({
      model: { provider: "openai-model" },
      system: expect.any(String),
      prompt: expect.any(String),
    });
    expect(generateObject).not.toHaveBeenCalled();
    expect(result).toEqual({
      json: `{
  "root": "text-1",
  "elements": {
    "text-1": {
      "type": "Text",
      "props": {
        "text": "Updated",
        "variant": null
      },
      "children": []
    }
  }
}`,
      spec: {
        root: "text-1",
        elements: {
          "text-1": {
            type: "Text",
            props: {
              text: "Updated",
              variant: null,
            },
            children: [],
          },
        },
      },
    });
  });
});
