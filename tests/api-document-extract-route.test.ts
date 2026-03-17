import { beforeEach, describe, expect, it, vi } from "vitest";

const extractDocumentText = vi.fn();

vi.mock("@/lib/document/server", () => ({
  extractDocumentText,
}));

describe("POST /api/document/extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 400 when source is missing", async () => {
    const { POST } = await import("@/app/api/document/extract/route");
    const response = await POST(
      new Request("http://localhost/api/document/extract", {
        body: JSON.stringify({}),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Source must be a typed URL",
    });
  });

  it("returns a 400 when source.name is invalid", async () => {
    const { POST } = await import("@/app/api/document/extract/route");
    const response = await POST(
      new Request("http://localhost/api/document/extract", {
        body: JSON.stringify({
          source: {
            name: 123,
            type: "application/pdf",
            url: "https://public.blob.vercel-storage.com/doc.pdf",
          },
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Source name must be a string",
    });
  });

  it("returns extracted document text", async () => {
    extractDocumentText.mockResolvedValue({
      text: "Quarterly revenue grew 12% year over year.",
    });

    const { POST } = await import("@/app/api/document/extract/route");
    const response = await POST(
      new Request("http://localhost/api/document/extract", {
        body: JSON.stringify({
          source: {
            name: "brief.pdf",
            type: "application/pdf",
            url: "https://public.blob.vercel-storage.com/brief.pdf",
          },
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(extractDocumentText).toHaveBeenCalledWith({
      source: {
        name: "brief.pdf",
        type: "application/pdf",
        url: "https://public.blob.vercel-storage.com/brief.pdf",
      },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: "Quarterly revenue grew 12% year over year.",
    });
  });
});
