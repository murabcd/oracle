import { beforeEach, describe, expect, it, vi } from "vitest";

const generateDocument = vi.fn();

vi.mock("@/lib/document/server", () => ({
  generateDocument,
}));

describe("POST /api/document/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 400 when prompt is missing", async () => {
    const { POST } = await import("@/app/api/document/create/route");
    const response = await POST(
      new Request("http://localhost/api/document/create", {
        body: JSON.stringify({ modelId: "gpt-5.4" }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Prompt must be a string",
    });
  });

  it("returns a 400 when videos are invalid", async () => {
    const { POST } = await import("@/app/api/document/create/route");
    const response = await POST(
      new Request("http://localhost/api/document/create", {
        body: JSON.stringify({
          modelId: "gpt-5.4",
          prompt: "Create a product one-pager",
          videos: [{ url: 123, type: "video/mp4" }],
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Videos must be an array of typed URLs",
    });
  });

  it("returns generated document text", async () => {
    generateDocument.mockResolvedValue({
      text: "# GlobalTech\n\n- Saves teams 40% on support.",
    });

    const { POST } = await import("@/app/api/document/create/route");
    const response = await POST(
      new Request("http://localhost/api/document/create", {
        body: JSON.stringify({
          instructions: "Make it sound investor-ready",
          modelId: "gpt-5.4",
          prompt: "Create a company overview",
          startingText: "# Draft",
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })
    );

    expect(generateDocument).toHaveBeenCalledWith({
      instructions: "Make it sound investor-ready",
      modelId: "gpt-5.4",
      prompt: "Create a company overview",
      startingText: "# Draft",
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: "# GlobalTech\n\n- Saves teams 40% on support.",
    });
  });
});
