import { beforeEach, describe, expect, it, vi } from "vitest";

const generateChart = vi.fn();

vi.mock("@/lib/chart/server", () => ({
  generateChart,
}));

describe("POST /api/chart/create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a non-string prompt", async () => {
    const { POST } = await import("@/app/api/chart/create/route");
    const response = await POST(
      new Request("http://localhost/api/chart/create", {
        method: "POST",
        body: JSON.stringify({ prompt: 42, modelId: "gpt-5.4" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Prompt must be a string" });
    expect(generateChart).not.toHaveBeenCalled();
  });

  it("rejects a non-string model id", async () => {
    const { POST } = await import("@/app/api/chart/create/route");
    const response = await POST(
      new Request("http://localhost/api/chart/create", {
        method: "POST",
        body: JSON.stringify({ prompt: "dashboard", modelId: 42 }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Model must be a string" });
  });

  it("rejects a non-string instructions value", async () => {
    const { POST } = await import("@/app/api/chart/create/route");
    const response = await POST(
      new Request("http://localhost/api/chart/create", {
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
    const { POST } = await import("@/app/api/chart/create/route");
    const response = await POST(
      new Request("http://localhost/api/chart/create", {
        method: "POST",
        body: JSON.stringify({
          prompt: "dashboard",
          modelId: "gpt-5.4",
          startingSpec: {
            type: "bar",
            series: [{ key: "revenue", label: "Revenue" }],
            data: [{ label: "Jan", values: [24, 12] }],
          },
        }),
        headers: { "content-type": "application/json" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Starting spec must be a valid chart spec",
    });
    expect(generateChart).not.toHaveBeenCalled();
  });

  it("returns chart JSON for valid requests", async () => {
    const requestBody = {
      prompt: "Build a monthly signups chart",
      modelId: "gpt-5.4",
      instructions: "Use a bar chart",
    };
    const generated = {
      json: JSON.stringify({
        type: "bar",
        series: [{ key: "signups", label: "Signups" }],
        data: [{ label: "Jan", values: [120] }],
      }),
      spec: {
        type: "bar",
        series: [{ key: "signups", label: "Signups" }],
        data: [{ label: "Jan", values: [120] }],
      },
    };
    generateChart.mockResolvedValue(generated);

    const { POST } = await import("@/app/api/chart/create/route");
    const response = await POST(
      new Request("http://localhost/api/chart/create", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "content-type": "application/json" },
      })
    );

    expect(generateChart).toHaveBeenCalledWith(requestBody);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(generated);
  });
});
