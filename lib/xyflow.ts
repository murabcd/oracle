import type { Node } from "@xyflow/react";
import type { ImageNodeProps } from "@/components/nodes/image";
import type { TextNodeProps } from "@/components/nodes/text";

export const getTextFromTextNodes = (nodes: Node[]) => {
  const sourceTexts = nodes
    .filter((node) => node.type === "text")
    .map((node) => (node.data as TextNodeProps["data"]).text);

  const generatedTexts = nodes
    .filter((node) => node.type === "text" && node.data.generated)
    .map((node) => (node.data as TextNodeProps["data"]).generated?.text);

  return [...sourceTexts, ...generatedTexts].filter(Boolean) as string[];
};

export const getDescriptionsFromImageNodes = (nodes: Node[]) => {
  const descriptions = nodes
    .filter((node) => node.type === "image")
    .map((node) => (node.data as ImageNodeProps["data"]).description)
    .filter(Boolean) as string[];

  return descriptions;
};

export const getImagesFromImageNodes = (nodes: Node[]) => {
  const sourceImages = nodes
    .filter((node) => node.type === "image")
    .map((node) => (node.data as ImageNodeProps["data"]).content)
    .filter(Boolean) as { url: string; type: string }[];

  const generatedImages = nodes
    .filter((node) => node.type === "image")
    .map((node) => (node.data as ImageNodeProps["data"]).generated)
    .filter(Boolean) as { url: string; type: string }[];

  return [...sourceImages, ...generatedImages];
};

export const getVideosFromVideoNodes = (nodes: Node[]) => {
  const sourceVideos = nodes
    .filter((node) => node.type === "video")
    .map(
      (node) =>
        (
          node.data as {
            content?: {
              url: string;
              type: string;
            };
          }
        ).content
    )
    .filter(Boolean) as { url: string; type: string }[];

  const generatedVideos = nodes
    .filter((node) => node.type === "video")
    .map(
      (node) =>
        (
          node.data as {
            generated?: {
              url: string;
              type: string;
            };
          }
        ).generated
    )
    .filter(Boolean) as { url: string; type: string }[];

  return [...sourceVideos, ...generatedVideos];
};

export const isValidSourceTarget = (source: Node, _target: Node) => {
  if (source.type === "drop") {
    return false;
  }

  return true;
};
