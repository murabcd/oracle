import { assertBlobUrl } from "@/lib/url";

describe("assertBlobUrl", () => {
  it("accepts the canonical Vercel Blob host", () => {
    const url = assertBlobUrl(
      "https://public.blob.vercel-storage.com/file.png"
    );

    expect(url.hostname).toBe("public.blob.vercel-storage.com");
  });

  it("accepts subdomains of the Vercel Blob host", () => {
    const url = assertBlobUrl(
      "https://team-123.public.blob.vercel-storage.com/file.png"
    );

    expect(url.hostname).toBe("team-123.public.blob.vercel-storage.com");
  });

  it("rejects non-https URLs", () => {
    expect(() =>
      assertBlobUrl("http://public.blob.vercel-storage.com/file.png")
    ).toThrowError("Invalid image URL");
  });

  it("rejects unrelated hosts", () => {
    expect(() => assertBlobUrl("https://example.com/file.png")).toThrowError(
      "Invalid image URL"
    );
  });
});
