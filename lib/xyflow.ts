import type { Node } from "@xyflow/react";
import type { ImageNodeProps } from "@/components/nodes/image";
import type { TextNodeProps } from "@/components/nodes/text";
import type { VideoNodeProps } from "@/components/nodes/video";
import type { NodeFile } from "@/lib/node-data";

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
