import { beforeEach, describe, expect, it, vi } from "vitest";

const generateVideo = vi.fn();

vi.mock("@/lib/media/server", () => ({
  generateVideo,
}));

describe("POST /api/video/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-string model id", async () => {
    const { POST } = await import("@/app/api/video/create/route");
    const response = await POST(
      new Request("http://localhost/api/video/create", {
        method: "POST",
        body: JSON.stringify({ modelId: 42, prompt: "animate this" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Model must be a string" });
    expect(generateVideo).not.toHaveBeenCalled();
  });

  it("rejects a non-string prompt", async () => {
    const { POST } = await import("@/app/api/video/create/route");
    const response = await POST(
      new Request("http://localhost/api/video/create", {
        method: "POST",
        body: JSON.stringify({
          modelId: "veo-3.1-fast-generate-preview",
          prompt: 42,
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Prompt must be a string" });
    expect(generateVideo).not.toHaveBeenCalled();
  });

  it("rejects a non-string image", async () => {
    const { POST } = await import("@/app/api/video/create/route");
    const response = await POST(
      new Request("http://localhost/api/video/create", {
        method: "POST",
        body: JSON.stringify({
          modelId: "veo-3.1-fast-generate-preview",
          prompt: "animate this",
          image: 42,
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Image must be a string" });
    expect(generateVideo).not.toHaveBeenCalled();
  });

  it("delegates valid requests", async () => {
    generateVideo.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/video.mp4",
      type: "video/mp4",
    });

    const { POST } = await import("@/app/api/video/create/route");
    const requestBody = {
      modelId: "veo-3.1-fast-generate-preview",
      prompt: "animate this",
      image: "https://public.blob.vercel-storage.com/source.png",
    };
    const response = await POST(
      new Request("http://localhost/api/video/create", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "content-type": "application/json" },
      })
    );

    expect(generateVideo).toHaveBeenCalledWith(requestBody);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      url: "https://public.blob.vercel-storage.com/video.mp4",
      type: "video/mp4",
    });
  });
});
