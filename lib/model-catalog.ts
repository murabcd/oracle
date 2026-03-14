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
    priceIndicator: "high",
  }),
  "gpt-5.4-pro": withOpenAIProvider({
    label: "GPT-5.4 Pro",
    priceIndicator: "highest",
  }),
  "gpt-5-mini": withOpenAIProvider({
    label: "GPT-5 Mini",
    priceIndicator: "low",
  }),
  "gpt-5-nano": withOpenAIProvider({
    label: "GPT-5 Nano",
    priceIndicator: "lowest",
  }),
  "o4-mini": withOpenAIProvider({
    label: "o4-mini",
    priceIndicator: "low",
  }),
  "gemini-3.1-pro-preview": withGoogleProvider({
    label: "Gemini 3.1 Pro Preview",
    priceIndicator: "high",
  }),
  "gemini-2.5-pro": withGoogleProvider({
    label: "Gemini 2.5 Pro",
    priceIndicator: "high",
  }),
  "gemini-3-flash-preview": withGoogleProvider({
    label: "Gemini 3 Flash Preview",
    priceIndicator: "low",
  }),
  "gemini-2.5-flash": withGoogleProvider({
    label: "Gemini 2.5 Flash",
    priceIndicator: "low",
  }),
  "gemini-2.5-flash-lite": withGoogleProvider({
    label: "Gemini 2.5 Flash Lite",
    priceIndicator: "lowest",
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

export const videoModels = {} satisfies Record<string, OracleModel>;

export const descriptionModelId = "gpt-5-nano";
