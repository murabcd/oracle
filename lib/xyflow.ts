import type { Node } from "@xyflow/react";
import type { DocumentNodeProps } from "@/components/nodes/document";
import type { ImageNodeProps } from "@/components/nodes/image";
import type { LinkNodeProps } from "@/components/nodes/link";
import type { TextNodeProps } from "@/components/nodes/text";
import type { VideoNodeProps } from "@/components/nodes/video";
import type { NodeFile } from "@/lib/node-data";

const VIDEO_LINK_HOSTNAMES = new Set([
  "loom.com",
  "m.youtube.com",
  "vimeo.com",
  "www.loom.com",
  "www.vimeo.com",
  "www.youtube.com",
  "youtu.be",
  "youtube.com",
]);

export const isVideoLikeUrl = (value: string | undefined) => {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return VIDEO_LINK_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
};

export const getTextFromTextNodes = (nodes: Node[]) => {
  const sourceTexts = nodes
    .filter((node) => node.type === "text")
    .map((node) => (node.data as unknown as TextNodeProps["data"]).config.text);

  const generatedTexts = nodes
    .filter((node) => node.type === "text")
    .map(
      (node) => (node.data as unknown as TextNodeProps["data"]).result?.text
    );

  return [...sourceTexts, ...generatedTexts].filter(Boolean) as string[];
};

export const getTextFromDocumentNodes = (nodes: Node[]) =>
  nodes
    .filter((node) => node.type === "document")
    .map((node) => node.data as unknown as DocumentNodeProps["data"])
    .filter((data) => data.result?.generated === true)
    .map((data) => data.result?.text)
    .filter(Boolean) as string[];

export const getDocumentsFromDocumentNodes = (nodes: Node[]) =>
  nodes
    .filter((node) => node.type === "document")
    .map(
      (node) =>
        (node.data as unknown as DocumentNodeProps["data"]).config.source
    )
    .filter(Boolean) as NodeFile[];

export const getTextFromLinkNodes = (nodes: Node[]) =>
  nodes
    .filter((node) => node.type === "link")
    .map((node) => (node.data as unknown as LinkNodeProps["data"]).result)
    .filter((result): result is NonNullable<LinkNodeProps["data"]["result"]> =>
      Boolean(result)
    )
    .map((result) => result.output?.text)
    .filter(Boolean) as string[];

export const getDescriptionsFromImageNodes = (nodes: Node[]) => {
  const descriptions = nodes
    .filter((node) => node.type === "image")
    .map(
      (node) =>
        (node.data as unknown as ImageNodeProps["data"]).result?.description
    )
    .filter(Boolean) as string[];

  return descriptions;
};

const isVideoLikeLinkNode = (node: Node) => {
  if (node.type !== "link") {
    return false;
  }

  const linkData = node.data as unknown as LinkNodeProps["data"];
  const candidateUrl = linkData.result?.url ?? linkData.config.url;
  return isVideoLikeUrl(candidateUrl);
};

export const hasVideoLikeInput = (nodes: Node[]) =>
  nodes.some((node) => node.type === "video" || isVideoLikeLinkNode(node));

export const getImagesFromImageNodes = (nodes: Node[]) => {
  const sourceImages = nodes
    .filter((node) => node.type === "image")
    .map(
      (node) => (node.data as unknown as ImageNodeProps["data"]).config.source
    )
    .filter(Boolean) as NodeFile[];

  const generatedImages = nodes
    .filter((node) => node.type === "image")
    .map(
      (node) => (node.data as unknown as ImageNodeProps["data"]).result?.image
    )
    .filter(Boolean) as NodeFile[];

  return [...sourceImages, ...generatedImages];
};

export const getVideosFromVideoNodes = (nodes: Node[]) => {
  const sourceVideos = nodes
    .filter((node) => node.type === "video")
    .map(
      (node) => (node.data as unknown as VideoNodeProps["data"]).config.source
    )
    .filter(Boolean) as NodeFile[];

  const generatedVideos = nodes
    .filter((node) => node.type === "video")
    .map(
      (node) => (node.data as unknown as VideoNodeProps["data"]).result?.video
    )
    .filter(Boolean) as NodeFile[];

  return [...sourceVideos, ...generatedVideos];
};

export const isValidSourceTarget = (source: Node, _target: Node) => {
  if (source.type === "drop") {
    return false;
  }

  return true;
};
