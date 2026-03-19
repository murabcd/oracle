export const describeImagePrompt = "Describe this image.";

export const buildImageGenerationPrompt = ({
  instructions,
  prompt,
}: {
  instructions?: string;
  prompt: string;
}) =>
  [
    "Generate an image based on the following instructions and context.",
    "---",
    "Instructions:",
    instructions ?? "None.",
    "---",
    "Context:",
    prompt,
  ].join("\n");

export const getEditImagePrompt = (
  imageCount: number,
  instructions?: string
) => {
  const defaultPrompt =
    imageCount > 1
      ? "Create a variant of the image."
      : "Create a single variant of the images.";

  return {
    description: instructions ?? defaultPrompt,
    prompt: !instructions || instructions === "" ? defaultPrompt : instructions,
  };
};
