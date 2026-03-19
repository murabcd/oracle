import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  buildLinkGenerationPrompt,
  linkSystemPrompt,
} from "@/lib/ai/prompts/link";
import { parseError } from "@/lib/error/parse";
import { textModels } from "@/lib/model-catalog";
import type {
  ErrorResponse,
  FetchLinkPreviewInput,
  FetchLinkPreviewSuccess,
  GenerateLinkInput,
} from "./types";

const META_TAG_RE =
  /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>/gi;
const TITLE_RE = /<title[^>]*>([^<]*)<\/title>/i;
const LINK_ICON_RE =
  /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i;
const HTTP_PROTOCOL_RE = /^https?:$/;
const WWW_PREFIX_RE = /^www\./;
const GENERATED_URL_RE = /https?:\/\/[^\s"'<>]+/i;

const getTextModel = (modelId: string) => {
  if (!(modelId in textModels)) {
    throw new Error("Invalid text model");
  }

  const model = textModels[modelId as keyof typeof textModels];

  return model.chef.id === "google" ? google(modelId) : openai(modelId);
};

const getKnownEmbedUrl = (url: URL) => {
  if (
    url.hostname === "youtube.com" ||
    url.hostname === "www.youtube.com" ||
    url.hostname === "youtu.be"
  ) {
    const videoId =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v");

    return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
  }

  if (url.hostname === "www.figma.com" || url.hostname === "figma.com") {
    return `https://www.figma.com/embed?embed_host=oracle&url=${encodeURIComponent(
      url.toString()
    )}`;
  }

  return undefined;
};

const toAbsoluteUrl = (value: string | undefined, baseUrl: URL) => {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
};

const extractMetadata = (html: string) => {
  const metaEntries = new Map<string, string>();

  for (const match of html.matchAll(META_TAG_RE)) {
    const key = match[1]?.toLowerCase();
    const value = match[2]?.trim();

    if (key && value && !metaEntries.has(key)) {
      metaEntries.set(key, value);
    }
  }

  const titleMatch = html.match(TITLE_RE);
  const iconMatch = html.match(LINK_ICON_RE);

  return {
    description:
      metaEntries.get("og:description") ?? metaEntries.get("description"),
    favicon: iconMatch?.[1],
    image: metaEntries.get("og:image") ?? metaEntries.get("twitter:image"),
    siteName: metaEntries.get("og:site_name"),
    title:
      metaEntries.get("og:title") ??
      metaEntries.get("twitter:title") ??
      titleMatch?.[1]?.trim(),
  };
};

const validatePreviewUrl = (value: string) => {
  const url = new URL(value);

  if (!HTTP_PROTOCOL_RE.test(url.protocol)) {
    throw new Error("URL must use http or https");
  }

  if (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]"
  ) {
    throw new Error("Local URLs are not supported");
  }

  return url;
};

const extractGeneratedUrl = (value: string) => {
  const match = value.match(GENERATED_URL_RE);

  if (!match?.[0]) {
    throw new Error("No URL generated");
  }

  return validatePreviewUrl(match[0]).toString();
};

export async function fetchLinkPreview(
  input: FetchLinkPreviewInput
): Promise<FetchLinkPreviewSuccess | ErrorResponse> {
  try {
    const url = validatePreviewUrl(input.url);
    const hostname = url.hostname.replace(WWW_PREFIX_RE, "");
    const embedUrl = getKnownEmbedUrl(url);
    let description: string | undefined;
    let image: string | undefined;
    let siteName: string | undefined;
    let title = hostname;

    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "oracle-link-preview/1.0",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("text/html")) {
          const html = await response.text();
          const metadata = extractMetadata(html);

          description = metadata.description;
          image = toAbsoluteUrl(metadata.image, url);
          siteName = metadata.siteName;
          title = metadata.title ?? title;
        }
      }
    } catch {
      // Fallback to URL-derived preview only.
    }

    return {
      description,
      embedUrl,
      hostname,
      image,
      siteName,
      title,
      url: url.toString(),
    };
  } catch (error) {
    return { error: parseError(error) };
  }
}

export async function generateLink(
  input: GenerateLinkInput
): Promise<FetchLinkPreviewSuccess | ErrorResponse> {
  try {
    const result = await generateText({
      model: getTextModel(input.modelId),
      system: linkSystemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildLinkGenerationPrompt(input),
            },
            ...(input.documents ?? []).map((document) => ({
              type: "file" as const,
              mediaType: document.type,
              data: new URL(document.url),
            })),
            ...(input.videos ?? []).map((video) => ({
              type: "file" as const,
              mediaType: video.type,
              data: new URL(video.url),
            })),
          ],
        },
      ],
    });

    const url = extractGeneratedUrl(result.text.trim());
    return fetchLinkPreview({ url });
  } catch (error) {
    return { error: parseError(error) };
  }
}
