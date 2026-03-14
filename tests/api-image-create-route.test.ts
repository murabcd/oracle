import { beforeEach, describe, expect, it, vi } from "vitest";

const generateImage = vi.fn();

vi.mock("@/lib/media/server", () => ({
  generateImage,
}));

describe("POST /api/image/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-string prompt", async () => {
    const { POST } = await import("@/app/api/image/create/route");
    const response = await POST(
      new Request("http://localhost/api/image/create", {
        method: "POST",
        body: JSON.stringify({ prompt: 42, modelId: "gpt-image-1.5" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Prompt must be a string" });
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("rejects a non-string model id", async () => {
    const { POST } = await import("@/app/api/image/create/route");
    const response = await POST(
      new Request("http://localhost/api/image/create", {
        method: "POST",
        body: JSON.stringify({ prompt: "draw this", modelId: 42 }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Model must be a string" });
  });

  it("rejects a non-string instructions value", async () => {
    const { POST } = await import("@/app/api/image/create/route");
    const response = await POST(
      new Request("http://localhost/api/image/create", {
        method: "POST",
        body: JSON.stringify({
          prompt: "draw this",
          modelId: "gpt-image-1.5",
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

  it("returns the media helper payload unchanged", async () => {
    generateImage.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/image.png",
      type: "image/png",
      description: "Generated image",
    });

    const { POST } = await import("@/app/api/image/create/route");
    const requestBody = {
      prompt: "draw this",
      modelId: "gpt-image-1.5",
      instructions: "use a red background",
    };
    const response = await POST(
      new Request("http://localhost/api/image/create", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "content-type": "application/json" },
      })
    );

    expect(generateImage).toHaveBeenCalledWith(requestBody);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://public.blob.vercel-storage.com/image.png",
      type: "image/png",
      description: "Generated image",
    });
  });

  it("returns media helper errors in the response body", async () => {
    generateImage.mockResolvedValue({ error: "Invalid image model" });

    const { POST } = await import("@/app/api/image/create/route");
    const response = await POST(
      new Request("http://localhost/api/image/create", {
        method: "POST",
        body: JSON.stringify({
          prompt: "draw this",
          modelId: "bad-model",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ error: "Invalid image model" });
  });
});
