import { beforeEach, describe, expect, it, vi } from "vitest";

const head = vi.fn();
const put = vi.fn();
const googleVideo = vi.fn();
const experimentalGenerateVideo = vi.fn();
const mp4FileNamePattern = /\.mp4$/;

vi.mock("@vercel/blob", () => ({
  head,
  put,
}));

vi.mock("@ai-sdk/google", () => ({
  google: {
    video: googleVideo,
    image: vi.fn(),
  },
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));

vi.mock("ai", () => ({
  experimental_generateVideo: experimentalGenerateVideo,
  generateImage: vi.fn(),
  generateText: vi.fn(),
}));

describe("generateVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error for an unknown model", async () => {
    const { generateVideo } = await import("@/lib/media/server");

    await expect(
      generateVideo({
        modelId: "bad-model",
        prompt: "animate this",
      })
    ).resolves.toEqual({ error: "Invalid video model" });
  });

  it("generates a video, uploads it, and returns the blob metadata", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    });
    vi.stubGlobal("fetch", fetchMock);

    head.mockResolvedValue({
      downloadUrl: "https://blob.vercel-storage.com/download/source.png",
    });
    googleVideo.mockReturnValue({ provider: "google-video-model" });
    experimentalGenerateVideo.mockResolvedValue({
      video: {
        base64: "dmlkZW8=",
        mediaType: "video/mp4",
        uint8Array: new Uint8Array([1, 2, 3]),
      },
    });
    put.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/video.mp4",
    });

    const { generateVideo } = await import("@/lib/media/server");
    const result = await generateVideo({
      modelId: "veo-3.1-fast-generate-preview",
      prompt: "animate this",
      image: "https://public.blob.vercel-storage.com/source.png",
    });

    expect(googleVideo).toHaveBeenCalledWith("veo-3.1-fast-generate-preview");
    expect(head).toHaveBeenCalledWith(
      "https://public.blob.vercel-storage.com/source.png"
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://blob.vercel-storage.com/download/source.png"
    );
    expect(experimentalGenerateVideo).toHaveBeenCalledWith({
      model: { provider: "google-video-model" },
      prompt: {
        image: new Uint8Array([1, 2, 3]),
        text: "animate this",
      },
      abortSignal: expect.any(AbortSignal),
      providerOptions: {
        google: {
          pollTimeoutMs: 240_000,
        },
      },
    });
    expect(put).toHaveBeenCalledWith(
      expect.stringMatching(mp4FileNamePattern),
      expect.any(Buffer),
      {
        access: "public",
        contentType: "video/mp4",
      }
    );
    expect(result).toEqual({
      url: "https://public.blob.vercel-storage.com/video.mp4",
      type: "video/mp4",
    });
  });

  it("supports prompt-only video generation without fetching an image", async () => {
    googleVideo.mockReturnValue({ provider: "google-video-model" });
    experimentalGenerateVideo.mockResolvedValue({
      video: {
        base64: "dmlkZW8=",
        mediaType: "video/mp4",
        uint8Array: new Uint8Array([4, 5, 6]),
      },
    });
    put.mockResolvedValue({
      url: "https://public.blob.vercel-storage.com/prompt-only-video.mp4",
    });

    const { generateVideo } = await import("@/lib/media/server");
    const result = await generateVideo({
      modelId: "veo-3.1-fast-generate-preview",
      prompt: "a paper airplane gliding through a library",
    });

    expect(head).not.toHaveBeenCalled();
    expect(experimentalGenerateVideo).toHaveBeenCalledWith({
      model: { provider: "google-video-model" },
      prompt: "a paper airplane gliding through a library",
      abortSignal: expect.any(AbortSignal),
      providerOptions: {
        google: {
          pollTimeoutMs: 240_000,
        },
      },
    });
    expect(result).toEqual({
      url: "https://public.blob.vercel-storage.com/prompt-only-video.mp4",
      type: "video/mp4",
    });
  });
});
