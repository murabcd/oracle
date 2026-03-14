import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import {
  applySpecPatch,
  buildUserPrompt,
  parseSpecStreamLine,
  type Spec,
} from "@json-render/core";
import { generateObject, generateText } from "ai";
import { ZodError } from "zod";
import { parseError } from "@/lib/error/parse";
import { textModels } from "@/lib/model-catalog";
import {
  type JsonRenderSpec,
  jsonRenderSchema,
  jsonRenderSystemPrompt,
  serializeJsonRenderSpec,
} from "./catalog";
import type {
  ErrorResponse,
  GeneratedJsonRenderSuccess,
  GenerateJsonRenderInput,
} from "./types";

const getTextModel = (modelId: string) => {
  if (!(modelId in textModels)) {
    throw new Error("Invalid text model");
  }

  const model = textModels[modelId as keyof typeof textModels];

  return model.chef.id === "google" ? google(modelId) : openai(modelId);
};

const outputContract = [
  "Return exactly one JSON object for a valid json-render flat spec.",
  'The object must include a string "root" key and an "elements" record.',
  "Each element must include type, props, and children.",
  "Do not wrap the object in markdown, prose, or code fences.",
  "Do not return an empty object.",
].join(" ");

const invalidPatchRetryPrompt = [
  "Your previous response was invalid.",
  "Return only json-render JSON patch lines for the requested changes.",
  "Do not return prose, markdown, code fences, or a full spec object.",
].join(" ");

const invalidSpecRetryPrompt =
  "Your previous response was invalid. Return a non-empty JSON object with root and elements.";

const buildContextPrompt = ({
  instructions,
  prompt,
}: Pick<GenerateJsonRenderInput, "instructions" | "prompt">) =>
  [
    instructions ? `Instructions:\n${instructions}` : null,
    prompt ? `Context:\n${prompt}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

const getRetryPrompt = (
  prompt: string,
  retryInstruction: string,
  attempt: number
) => (attempt === 0 ? prompt : [prompt, retryInstruction].join("\n\n"));

const applyGeneratedPatches = (
  output: string,
  startingSpec: JsonRenderSpec
): JsonRenderSpec => {
  const nextSpec = structuredClone(startingSpec) as Spec;
  let patchCount = 0;

  for (const line of output.split("\n")) {
    const patch = parseSpecStreamLine(line.trim());

    if (!patch) {
      continue;
    }

    applySpecPatch(nextSpec, patch);
    patchCount += 1;
  }

  if (patchCount === 0) {
    throw new Error("No json-render patches generated.");
  }

  return jsonRenderSchema.parse(nextSpec);
};

const generateRefinedSpec = async (
  model: ReturnType<typeof getTextModel>,
  prompt: string,
  startingSpec: JsonRenderSpec
) => {
  for (const attempt of [0, 1]) {
    const retryPrompt = getRetryPrompt(
      prompt,
      invalidPatchRetryPrompt,
      attempt
    );
    const { text } = await generateText({
      model,
      system: jsonRenderSystemPrompt,
      prompt: retryPrompt,
    });

    try {
      return applyGeneratedPatches(text, startingSpec);
    } catch (error) {
      if (attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error("No UI generated.");
};

const generateFreshSpec = async (
  model: ReturnType<typeof getTextModel>,
  prompt: string
) => {
  for (const attempt of [0, 1]) {
    const retryPrompt = getRetryPrompt(prompt, invalidSpecRetryPrompt, attempt);
    const { object } = await generateObject({
      model,
      output: "no-schema",
      system: jsonRenderSystemPrompt,
      prompt: retryPrompt,
    });

    try {
      return jsonRenderSchema.parse(object);
    } catch (error) {
      if (!(error instanceof ZodError) || attempt === 1) {
        throw error;
      }
    }
  }

  throw new Error("No UI generated.");
};

export async function generateJsonRender(
  input: GenerateJsonRenderInput
): Promise<GeneratedJsonRenderSuccess | ErrorResponse> {
  try {
    const contextPrompt = buildContextPrompt(input);
    const model = getTextModel(input.modelId);
    const spec = input.startingSpec
      ? await generateRefinedSpec(
          model,
          buildUserPrompt({
            prompt: contextPrompt || "Refine the current UI.",
            currentSpec: input.startingSpec as Spec,
            editModes: ["patch"],
          }),
          input.startingSpec
        )
      : await generateFreshSpec(
          model,
          buildUserPrompt({
            prompt: [outputContract, contextPrompt]
              .filter(Boolean)
              .join("\n\n"),
          })
        );

    return {
      spec,
      json: serializeJsonRenderSpec(spec),
    };
  } catch (error) {
    return { error: parseError(error) };
  }
}
