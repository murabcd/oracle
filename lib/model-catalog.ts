import { type OracleModel, providers } from "@/lib/providers";

const openaiProvider = providers.openai;
const googleProvider = providers.google;

const withOpenAIProvider = (
  model: Omit<OracleModel, "chef" | "providers">
): OracleModel => ({
  ...model,
  chef: openaiProvider,
  providers: [openaiProvider],
});

const withGoogleProvider = (
  model: Omit<OracleModel, "chef" | "providers">
): OracleModel => ({
  ...model,
  chef: googleProvider,
  providers: [googleProvider],
});

export const textModels = {
  "gpt-5.4": withOpenAIProvider({
    default: true,
    label: "GPT-5.4",
    priceIndicator: "highest",
    supportsWebSearch: true,
  }),
  "gpt-5.2": withOpenAIProvider({
    label: "GPT-5.2",
    priceIndicator: "highest",
    supportsWebSearch: true,
  }),
  "gpt-5": withOpenAIProvider({
    label: "GPT-5",
    priceIndicator: "high",
    supportsWebSearch: true,
  }),
  "gpt-5-mini": withOpenAIProvider({
    label: "GPT-5 Mini",
    priceIndicator: "low",
    supportsWebSearch: true,
  }),
  "gpt-5-nano": withOpenAIProvider({
    label: "GPT-5 Nano",
    priceIndicator: "low",
    supportsWebSearch: true,
  }),
  "gpt-4.1": withOpenAIProvider({
    label: "GPT-4.1",
    priceIndicator: "lowest",
    supportsWebSearch: true,
  }),
  "gemini-3.1-pro-preview": withGoogleProvider({
    label: "Gemini 3.1 Pro Preview",
    priceIndicator: "high",
    supportsVideoInput: true,
  }),
  "gemini-3-flash-preview": withGoogleProvider({
    label: "Gemini 3 Flash Preview",
    priceIndicator: "low",
    supportsVideoInput: true,
  }),
  "gemini-2.5-pro": withGoogleProvider({
    label: "Gemini 2.5 Pro",
    priceIndicator: "high",
    supportsVideoInput: true,
    supportsWebSearch: true,
  }),
  "gemini-2.5-flash": withGoogleProvider({
    label: "Gemini 2.5 Flash",
    priceIndicator: "low",
    supportsVideoInput: true,
    supportsWebSearch: true,
  }),
  "gemini-2.5-flash-lite": withGoogleProvider({
    label: "Gemini 2.5 Flash Lite",
    priceIndicator: "lowest",
    supportsVideoInput: true,
    supportsWebSearch: true,
  }),
} satisfies Record<string, OracleModel>;

export const imageModels = {
  "gpt-image-1.5": withOpenAIProvider({
    default: true,
    label: "GPT Image 1.5",
    priceIndicator: "high",
  }),
  "gpt-image-1": withOpenAIProvider({
    label: "GPT Image 1",
    priceIndicator: "high",
  }),
  "gpt-image-1-mini": withOpenAIProvider({
    label: "GPT Image 1 Mini",
    priceIndicator: "low",
  }),
  "gemini-3.1-flash-image-preview": withGoogleProvider({
    label: "Gemini 3.1 Flash Image Preview",
    priceIndicator: "low",
  }),
  "gemini-3-pro-image-preview": withGoogleProvider({
    label: "Gemini 3 Pro Image Preview",
    priceIndicator: "high",
  }),
  "gemini-2.5-flash-image": withGoogleProvider({
    label: "Gemini 2.5 Flash Image",
    priceIndicator: "low",
  }),
} satisfies Record<string, OracleModel>;

export const videoModels = {
  "veo-3.1-fast-generate-preview": withGoogleProvider({
    default: true,
    label: "Veo 3.1 Fast Preview",
    priceIndicator: "high",
  }),
  "veo-3.1-generate-preview": withGoogleProvider({
    label: "Veo 3.1 Preview",
    priceIndicator: "highest",
  }),
  "veo-3.0-fast-generate-001": withGoogleProvider({
    label: "Veo 3 Fast",
    priceIndicator: "low",
  }),
  "veo-2.0-generate-001": withGoogleProvider({
    label: "Veo 2",
    priceIndicator: "low",
  }),
} satisfies Record<string, OracleModel>;

export const descriptionModelId = "gpt-5-nano";

export const filterModelsByVideoInput = (
  models: Record<string, OracleModel>,
  requiresVideoInput: boolean
) =>
  requiresVideoInput
    ? Object.fromEntries(
        Object.entries(models).filter(([, model]) => model.supportsVideoInput)
      )
    : models;

export const filterModelsByWebSearch = (
  models: Record<string, OracleModel>,
  requiresWebSearch: boolean
) =>
  requiresWebSearch
    ? Object.fromEntries(
        Object.entries(models).filter(([, model]) => model.supportsWebSearch)
      )
    : models;
