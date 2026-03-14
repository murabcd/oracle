import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { head, put } from "@vercel/blob";
import { generateImage as generateImageAsset, generateText } from "ai";
import { nanoid } from "nanoid";
import { parseError } from "@/lib/error/parse";
import type {
  DescribeImageSuccess,
  EditImageInput,
  ErrorResponse,
  GeneratedMediaSuccess,
  GeneratedVideoSuccess,
  GenerateImageInput,
  GenerateVideoInput,
} from "@/lib/media/types";
import {
  descriptionModelId,
  imageModels,
  videoModels,
} from "@/lib/model-catalog";
import type { OracleModel } from "@/lib/providers";
import { assertBlobUrl } from "@/lib/url";

const getImageModel = (modelId: string) => {
  if (!(modelId in imageModels)) {
    throw new Error("Invalid image model");
  }

  const model = imageModels[modelId as keyof typeof imageModels] as OracleModel;

  return model.chef.id === "google"
    ? google.image(modelId)
    : openai.image(modelId);
};

export async function describeImage(
  url: string
): Promise<DescribeImageSuccess | ErrorResponse> {
  try {
    const validatedUrl = assertBlobUrl(url);

    const { text } = await generateText({
      model: openai(descriptionModelId),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image." },
            {
              type: "image",
              image: validatedUrl.toString(),
            },
          ],
        },
      ],
    });

    if (!text) {
      throw new Error("No description found");
    }

    return { description: text };
  } catch (error) {
    return { error: parseError(error) };
  }
}

export async function generateImage(
  input: GenerateImageInput
): Promise<GeneratedMediaSuccess | ErrorResponse> {
  try {
    const result = await generateImageAsset({
      model: getImageModel(input.modelId),
      prompt: [
        "Generate an image based on the following instructions and context.",
        "---",
        "Instructions:",
        input.instructions ?? "None.",
        "---",
        "Context:",
        input.prompt,
      ].join("\n"),
    });

    const { image } = result;

    let extension = image.mediaType.split("/").pop();

    if (extension === "jpeg") {
      extension = "jpg";
    }

    const name = `${nanoid()}.${extension}`;
    const blob = await put(name, image.uint8Array.buffer as ArrayBuffer, {
      access: "public",
      contentType: image.mediaType,
    });

    const descriptionResponse = await describeImage(blob.url);

    if ("error" in descriptionResponse) {
      throw new Error(descriptionResponse.error);
    }

    return {
      url: blob.url,
      type: image.mediaType,
      description: descriptionResponse.description,
    };
  } catch (error) {
    return { error: parseError(error) };
  }
}

export async function editImage(
  input: EditImageInput
): Promise<GeneratedMediaSuccess | ErrorResponse> {
  try {
    const defaultPrompt =
      input.images.length > 1
        ? "Create a variant of the image."
        : "Create a single variant of the images.";

    const prompt =
      !input.instructions || input.instructions === ""
        ? defaultPrompt
        : input.instructions;

    const imageData = await Promise.all(
      input.images.map(async (img) => {
        assertBlobUrl(img.url);

        const blob = await head(img.url);
        const response = await fetch(blob.downloadUrl);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
      })
    );

    const result = await generateImageAsset({
      model: getImageModel(input.modelId),
      prompt: {
        images: imageData,
        text: prompt,
      },
    });

    const { image } = result;
    const blob = await put(
      `${nanoid()}.png`,
      Buffer.from(image.base64, "base64"),
      {
        access: "public",
        contentType: "image/png",
      }
    );

    return {
      url: blob.url,
      type: "image/png",
      description: input.instructions ?? defaultPrompt,
    };
  } catch (error) {
    return { error: parseError(error) };
  }
}

export function generateVideo(
  input: GenerateVideoInput
): GeneratedVideoSuccess | ErrorResponse {
  try {
    if (!(input.modelId in videoModels)) {
      throw new Error(
        "Video generation is unavailable with the current direct OpenAI AI SDK setup."
      );
    }

    throw new Error(
      "Video generation is unavailable with the current direct OpenAI AI SDK setup."
    );
  } catch (error) {
    return { error: parseError(error) };
  }
}
