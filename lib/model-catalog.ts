import { type OracleModel, providers } from "@/lib/providers";

const openaiProvider = providers.openai;

const withOpenAIProvider = (
  model: Omit<OracleModel, "chef" | "providers">
): OracleModel => ({
  ...model,
  chef: openaiProvider,
  providers: [openaiProvider],
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
} satisfies Record<string, OracleModel>;

export const videoModels = {} satisfies Record<string, OracleModel>;

export const descriptionModelId = "gpt-5-nano";
