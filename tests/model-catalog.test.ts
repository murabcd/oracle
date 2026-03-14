import {
  descriptionModelId,
  imageModels,
  textModels,
  videoModels,
} from "@/lib/model-catalog";

describe("model catalog", () => {
  it("keeps the description model available in the text catalog", () => {
    expect(textModels[descriptionModelId]).toBeDefined();
  });

  it("exposes exactly one default text model", () => {
    const defaults = Object.entries(textModels).filter(
      ([, model]) => model.default
    );

    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.[0]).toBe("gpt-5.4");
  });

  it("exposes exactly one default image model", () => {
    const defaults = Object.entries(imageModels).filter(
      ([, model]) => model.default
    );

    expect(defaults).toHaveLength(1);
    expect(defaults[0]?.[0]).toBe("gpt-image-1.5");
  });

  it("starts with no video models configured", () => {
    expect(Object.keys(videoModels)).toHaveLength(0);
  });

  it("lists Gemini 3 text models before Gemini 2.5 text models", () => {
    const googleTextModelIds = Object.entries(textModels)
      .filter(([, model]) => model.chef.id === "google")
      .map(([modelId]) => modelId);

    expect(googleTextModelIds).toEqual([
      "gemini-3.1-pro-preview",
      "gemini-3-flash-preview",
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
    ]);
  });

  it("assigns each model at least one provider and a chef", () => {
    for (const model of [
      ...Object.values(textModels),
      ...Object.values(imageModels),
    ]) {
      expect(model.chef).toBeDefined();
      expect(model.providers.length).toBeGreaterThan(0);
    }
  });
});
