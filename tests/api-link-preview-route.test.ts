import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchLinkPreview = vi.fn();

vi.mock("@/lib/link/server", () => ({
  fetchLinkPreview,
}));

describe("POST /api/link/preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 400 when url is missing", async () => {
    const { POST } = await import("@/app/api/link/preview/route");
    const response = await POST(
      new Request("http://localhost/api/link/preview", {
        body: JSON.stringify({}),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "URL must be a string",
    });
  });

  it("returns preview metadata", async () => {
    fetchLinkPreview.mockResolvedValue({
      description: "A collaborative design file.",
      embedUrl:
        "https://www.figma.com/embed?embed_host=oracle&url=https://www.figma.com/file/123",
      hostname: "figma.com",
      image: "https://cdn.example.com/thumb.png",
      siteName: "Figma",
      title: "Sales enablements",
      url: "https://www.figma.com/file/123",
    });

    const { POST } = await import("@/app/api/link/preview/route");
    const response = await POST(
      new Request("http://localhost/api/link/preview", {
        body: JSON.stringify({
          url: "https://www.figma.com/file/123",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(fetchLinkPreview).toHaveBeenCalledWith({
      url: "https://www.figma.com/file/123",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      description: "A collaborative design file.",
      embedUrl:
        "https://www.figma.com/embed?embed_host=oracle&url=https://www.figma.com/file/123",
      hostname: "figma.com",
      image: "https://cdn.example.com/thumb.png",
      siteName: "Figma",
      title: "Sales enablements",
      url: "https://www.figma.com/file/123",
    });
  });
});
