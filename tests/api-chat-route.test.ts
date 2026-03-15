import { beforeEach, describe, expect, it, vi } from "vitest";

const convertToModelMessages = vi.fn();
const streamText = vi.fn();
const googleSearchTool = vi.fn();
const webSearchTool = vi.fn();
const google = Object.assign(vi.fn(), {
  tools: {
    googleSearch: googleSearchTool,
  },
});
const openai = Object.assign(vi.fn(), {
  tools: {
    webSearch: webSearchTool,
  },
});

vi.mock("ai", () => ({
  convertToModelMessages,
  streamText,
}));

vi.mock("@ai-sdk/google", () => ({
  google,
}));

vi.mock("@ai-sdk/openai", () => ({
  openai,
}));

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a missing string model id", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [], modelId: 123 }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Model must be a string");
    expect(streamText).not.toHaveBeenCalled();
  });

  it("rejects unknown models", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: [], modelId: "not-a-real-model" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid model");
    expect(streamText).not.toHaveBeenCalled();
  });

  it("uses the OpenAI provider and reasoning options for OpenAI models", async () => {
    const convertResult = [{ role: "user", content: "Hello" }];
    const streamResponse = new Response("stream");
    const toUIMessageStreamResponse = vi.fn(() => streamResponse);

    convertToModelMessages.mockResolvedValue(convertResult);
    openai.mockReturnValue("openai-model");
    streamText.mockReturnValue({ toUIMessageStreamResponse });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
          modelId: "gpt-5.4",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(openai).toHaveBeenCalledWith("gpt-5.4");
    expect(google).not.toHaveBeenCalled();
    expect(convertToModelMessages).toHaveBeenCalledWith([
      { role: "user", content: "Hello" },
    ]);
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "openai-model",
        messages: convertResult,
        providerOptions: {
          openai: {
            reasoningSummary: "auto",
          },
        },
      })
    );
    expect(toUIMessageStreamResponse).toHaveBeenCalledWith({
      sendReasoning: true,
      sendSources: true,
    });
    expect(response).toBe(streamResponse);
  });

  it("enables the OpenAI web search tool when requested", async () => {
    const convertResult = [{ role: "user", content: "Hello" }];
    const streamResponse = new Response("stream");
    const toUIMessageStreamResponse = vi.fn(() => streamResponse);

    convertToModelMessages.mockResolvedValue(convertResult);
    openai.mockReturnValue("openai-model");
    webSearchTool.mockReturnValue("openai-web-search-tool");
    streamText.mockReturnValue({ toUIMessageStreamResponse });

    const { POST } = await import("@/app/api/chat/route");
    await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
          modelId: "gpt-5.4",
          webSearchEnabled: true,
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(webSearchTool).toHaveBeenCalledWith({});
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: {
          web_search: "openai-web-search-tool",
        },
      })
    );
  });

  it("uses the Google provider without OpenAI-specific options for Google models", async () => {
    const convertResult = [{ role: "user", content: "Hello" }];
    const streamResponse = new Response("stream");
    const toUIMessageStreamResponse = vi.fn(() => streamResponse);

    convertToModelMessages.mockResolvedValue(convertResult);
    google.mockReturnValue("google-model");
    streamText.mockReturnValue({ toUIMessageStreamResponse });

    const { POST } = await import("@/app/api/chat/route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
          modelId: "gemini-2.5-pro",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(google).toHaveBeenCalledWith("gemini-2.5-pro");
    expect(openai).not.toHaveBeenCalled();
    expect(streamText).toHaveBeenCalledWith(
      expect.not.objectContaining({
        providerOptions: expect.anything(),
      })
    );
    expect(response).toBe(streamResponse);
  });

  it("enables the Google search tool when requested", async () => {
    const convertResult = [{ role: "user", content: "Hello" }];
    const streamResponse = new Response("stream");
    const toUIMessageStreamResponse = vi.fn(() => streamResponse);

    convertToModelMessages.mockResolvedValue(convertResult);
    google.mockReturnValue("google-model");
    googleSearchTool.mockReturnValue("google-search-tool");
    streamText.mockReturnValue({ toUIMessageStreamResponse });

    const { POST } = await import("@/app/api/chat/route");
    await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello" }],
          modelId: "gemini-2.5-pro",
          webSearchEnabled: true,
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(googleSearchTool).toHaveBeenCalledWith({});
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: {
          google_search: "google-search-tool",
        },
      })
    );
  });
});
