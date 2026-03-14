import { beforeEach, describe, expect, it, vi } from "vitest";

const generateJsonRender = vi.fn();

vi.mock("@/lib/json-render/server", () => ({
  generateJsonRender,
}));

describe("POST /api/json-render/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-string prompt", async () => {
    const { POST } = await import("@/app/api/json-render/create/route");
    const response = await POST(
      new Request("http://localhost/api/json-render/create", {
        method: "POST",
        body: JSON.stringify({ prompt: 42, modelId: "gpt-5.4" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Prompt must be a string" });
    expect(generateJsonRender).not.toHaveBeenCalled();
  });

  it("rejects a non-string model id", async () => {
    const { POST } = await import("@/app/api/json-render/create/route");
    const response = await POST(
      new Request("http://localhost/api/json-render/create", {
        method: "POST",
        body: JSON.stringify({ prompt: "dashboard", modelId: 42 }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Model must be a string" });
  });

  it("rejects a non-string instructions value", async () => {
    const { POST } = await import("@/app/api/json-render/create/route");
    const response = await POST(
      new Request("http://localhost/api/json-render/create", {
        method: "POST",
        body: JSON.stringify({
          prompt: "dashboard",
          modelId: "gpt-5.4",
          instructions: 42,
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Instructions must be a string",
    });
  });

  it("rejects an invalid starting spec", async () => {
    const { POST } = await import("@/app/api/json-render/create/route");
    const response = await POST(
      new Request("http://localhost/api/json-render/create", {
        method: "POST",
        body: JSON.stringify({
          prompt: "dashboard",
          modelId: "gpt-5.4",
          startingSpec: {
            root: "bad-1",
            elements: {
              "bad-1": {
                type: "Unknown",
                props: {},
                children: [],
              },
            },
          },
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Starting spec must be a valid json-render spec",
    });
    expect(generateJsonRender).not.toHaveBeenCalled();
  });

  it("returns the generator payload unchanged", async () => {
    generateJsonRender.mockResolvedValue({
      json: '{"root":"text-1","elements":{"text-1":{"type":"Text","props":{"text":"Ready","variant":null},"children":[]}}}',
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

    const { POST } = await import("@/app/api/json-render/create/route");
    const requestBody = {
      prompt: "Build a launch dashboard",
      modelId: "gpt-5.4",
      instructions: "Use metrics",
    };
    const response = await POST(
      new Request("http://localhost/api/json-render/create", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "content-type": "application/json" },
      })
    );

    expect(generateJsonRender).toHaveBeenCalledWith(requestBody);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      json: '{"root":"text-1","elements":{"text-1":{"type":"Text","props":{"text":"Ready","variant":null},"children":[]}}}',
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
});
