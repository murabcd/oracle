import { afterEach, describe, expect, it, vi } from "vitest";
import { serializeJsonRenderSpec } from "@/lib/json-render/catalog";
import { generateJsonRenderStreamRequest } from "@/lib/json-render/client";

describe("generateJsonRenderStreamRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("applies streamed patches progressively and returns the final spec", async () => {
    const encoder = new TextEncoder();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode('{"op":"add","path":"/root","value":"text-1"}\n')
            );
            controller.enqueue(
              encoder.encode(
                '{"op":"add","path":"/elements","value":{}}\n{"op":"add","path":"/elements/text-1","value":{"type":"Text","props":{"text":"Ready","variant":null},"children":[]}}\n'
              )
            );
            controller.close();
          },
        }),
        {
          headers: {
            "content-type": "text/plain; charset=utf-8",
          },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const seenSpecs: string[] = [];
    const result = await generateJsonRenderStreamRequest(
      {
        modelId: "gpt-5.4",
        prompt: "Build a compact status card",
      },
      {
        onSpec: (spec) => {
          seenSpecs.push(JSON.stringify(spec));
        },
      }
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/json-render/create", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        modelId: "gpt-5.4",
        prompt: "Build a compact status card",
      }),
    });
    expect(seenSpecs).toHaveLength(3);
    expect(result.spec).toEqual({
      root: "text-1",
      elements: {
        "text-1": {
          type: "Text",
          props: {
            text: "Ready",
            variant: null,
          },
          children: [],
        },
      },
    });
    expect(result.json).toBe(serializeJsonRenderSpec(result.spec));
  });
});
