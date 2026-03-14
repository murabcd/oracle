import { beforeEach, describe, expect, it, vi } from "vitest";

const editImage = vi.fn();

vi.mock("@/lib/media/server", () => ({
  editImage,
}));

describe("POST /api/image/edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-array images field", async () => {
    const { POST } = await import("@/app/api/image/edit/route");
    const response = await POST(
      new Request("http://localhost/api/image/edit", {
        method: "POST",
        body: JSON.stringify({ images: "bad", modelId: "gpt-image-1.5" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Images must be an array" });
    expect(editImage).not.toHaveBeenCalled();
  });

  it("rejects malformed image entries", async () => {
    const { POST } = await import("@/app/api/image/edit/route");
    const response = await POST(
      new Request("http://localhost/api/image/edit", {
        method: "POST",
        body: JSON.stringify({
          images: [{ url: 123, type: "image/png" }],
          modelId: "gpt-image-1.5",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Each image must include url and type",
    });
  });

  it("rejects a non-string model id", async () => {
    const { POST } = await import("@/app/api/image/edit/route");
    const response = await POST(
      new Request("http://localhost/api/image/edit", {
        method: "POST",
        body: JSON.stringify({
          images: [
            {
              url: "https://public.blob.vercel-storage.com/source.png",
              type: "image/png",
            },
          ],
          modelId: 42,
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Model must be a string" });
  });

  it("rejects a non-string instructions value", async () => {
    const { POST } = await import("@/app/api/image/edit/route");
    const response = await POST(
      new Request("http://localhost/api/image/edit", {
        method: "POST",
        body: JSON.stringify({
          images: [
            {
              url: "https://public.blob.vercel-storage.com/source.png",
              type: "image/png",
            },
          ],
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

  it("delegates valid edit requests", async () => {
    editImage.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/edited.png",
      type: "image/png",
      description: "Edited image",
    });

    const { POST } = await import("@/app/api/image/edit/route");
    const requestBody = {
      images: [
        {
          url: "https://public.blob.vercel-storage.com/source.png",
          type: "image/png",
        },
      ],
      modelId: "gpt-image-1.5",
      instructions: "make it brighter",
    };
    const response = await POST(
      new Request("http://localhost/api/image/edit", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "content-type": "application/json" },
      })
    );

    expect(editImage).toHaveBeenCalledWith(requestBody);
    expect(await response.json()).toEqual({
      url: "https://public.blob.vercel-storage.com/edited.png",
      type: "image/png",
      description: "Edited image",
    });
  });
});
