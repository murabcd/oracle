import { beforeEach, describe, expect, it, vi } from "vitest";

const google = vi.fn();
const openai = vi.fn();
const streamText = vi.fn();

vi.mock("@ai-sdk/google", () => ({
  google,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai,
}));

vi.mock("ai", () => ({
  streamText,
}));

describe("streamJsonRender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams fresh generation with the selected OpenAI model", async () => {
    openai.mockReturnValue({ provider: "openai-model" });
    streamText.mockReturnValue({
      textStream: new ReadableStream(),
    });

    const { streamJsonRender } = await import("@/lib/json-render/server");
    const result = streamJsonRender({
      modelId: "gpt-5.4",
      prompt: "Build a compact status card",
      instructions: "Keep it minimal",
    });

    expect(openai).toHaveBeenCalledWith("gpt-5.4");
    expect(streamText).toHaveBeenCalledWith({
      model: { provider: "openai-model" },
      system: expect.any(String),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: expect.stringContaining("Instructions:\nKeep it minimal"),
            },
          ],
        },
      ],
    });
    expect(result.textStream).toBeInstanceOf(ReadableStream);
  });

  it("streams patch refinements when a starting spec is provided", async () => {
    openai.mockReturnValue({ provider: "openai-model" });
    streamText.mockReturnValue({
      textStream: new ReadableStream(),
    });

    const { streamJsonRender } = await import("@/lib/json-render/server");
    streamJsonRender({
      modelId: "gpt-5.4",
      prompt: "Update the copy",
      startingSpec: {
        root: "text-1",
        elements: {
          "text-1": {
            type: "Text",
            props: {
              text: "Ready",
              variant: null,
            },
            children: [],
            visible: null,
          },
        },
      },
    });

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: expect.stringContaining("Update the copy"),
              },
            ],
          },
        ],
      })
    );
  });

  it("uses the Google provider for Google models", async () => {
    google.mockReturnValue({ provider: "google-model" });
    streamText.mockReturnValue({
      textStream: new ReadableStream(),
    });

    const { streamJsonRender } = await import("@/lib/json-render/server");
    streamJsonRender({
      modelId: "gemini-2.5-flash",
      prompt: "Build a compact status card",
    });

    expect(google).toHaveBeenCalledWith("gemini-2.5-flash");
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { provider: "google-model" },
      })
    );
  });
});
