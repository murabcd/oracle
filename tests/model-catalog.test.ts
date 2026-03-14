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
