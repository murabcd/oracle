import { beforeEach, describe, expect, it, vi } from "vitest";

const handleUpload = vi.fn();

vi.mock("@vercel/blob/client", () => ({
  handleUpload,
}));

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates uploads with the expected token constraints", async () => {
    handleUpload.mockImplementation(async ({ onBeforeGenerateToken }) => ({
      token: await onBeforeGenerateToken("/tmp/file"),
    }));

    const { POST } = await import("@/app/api/upload/route");
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: JSON.stringify({ type: "blob.generate-client-token" }),
      headers: { "content-type": "application/json" },
    });
    const response = await POST(request);

    expect(handleUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { type: "blob.generate-client-token" },
        request,
        onBeforeGenerateToken: expect.any(Function),
        onUploadCompleted: expect.any(Function),
      })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      token: {
        allowedContentTypes: [
          "image/*",
          "audio/*",
          "video/*",
          "application/pdf",
          "text/*",
        ],
        maximumSizeInBytes: 10_485_760,
      },
    });
  });

  it("returns a 400 when the upload client throws", async () => {
    handleUpload.mockRejectedValue(new Error("Upload token generation failed"));

    const { POST } = await import("@/app/api/upload/route");
    const response = await POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: JSON.stringify({ type: "blob.generate-client-token" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Upload token generation failed",
    });
  });
});
