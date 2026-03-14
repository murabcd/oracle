import { beforeEach, describe, expect, it, vi } from "vitest";

const describeImage = vi.fn();

vi.mock("@/lib/media/server", () => ({
  describeImage,
}));

describe("POST /api/image/describe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-string url", async () => {
    const { POST } = await import("@/app/api/image/describe/route");
    const response = await POST(
      new Request("http://localhost/api/image/describe", {
        method: "POST",
        body: JSON.stringify({ url: 42 }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "URL must be a string" });
    expect(describeImage).not.toHaveBeenCalled();
  });

  it("delegates valid requests", async () => {
    describeImage.mockResolvedValue({ description: "A red square" });

    const { POST } = await import("@/app/api/image/describe/route");
    const response = await POST(
      new Request("http://localhost/api/image/describe", {
        method: "POST",
        body: JSON.stringify({
          url: "https://public.blob.vercel-storage.com/image.png",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(describeImage).toHaveBeenCalledWith(
      "https://public.blob.vercel-storage.com/image.png"
    );
    expect(await response.json()).toEqual({ description: "A red square" });
  });

  it("returns helper errors in the response body", async () => {
    describeImage.mockResolvedValue({ error: "Invalid image URL" });

    const { POST } = await import("@/app/api/image/describe/route");
    const response = await POST(
      new Request("http://localhost/api/image/describe", {
        method: "POST",
        body: JSON.stringify({
          url: "https://example.com/image.png",
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(await response.json()).toEqual({ error: "Invalid image URL" });
  });
});
