import { expect, test } from "bun:test";
import { allowedModelsFor, defaultModels, generatingTools, modelById, models } from "../src/models";

test("every tool's built-in default is one of its allowed models", () => {
  for (const tool of generatingTools) expect(allowedModelsFor(tool)).toContain(defaultModels[tool]);
});

test("every tool has at least one model and only known ids", () => {
  for (const tool of generatingTools) {
    const allowed = allowedModelsFor(tool);
    expect(allowed.length).toBeGreaterThan(0);
    for (const id of allowed) expect(modelById(id).id).toBe(id);
  }
});

test("each tool maps to exactly one family", () => {
  const familyOf = (tool: (typeof generatingTools)[number]) => new Set(allowedModelsFor(tool).map((id) => modelById(id).family));
  expect(familyOf("generate_image")).toEqual(new Set(["image"]));
  expect(familyOf("extend_video")).toEqual(new Set(["video"]));
  expect(familyOf("generate_speech")).toEqual(new Set(["speech"]));
  expect(familyOf("generate_music")).toEqual(new Set(["music"]));
  expect(allowedModelsFor("generate_video")).toEqual(["gemini-omni-1.1-flash"]);
});

test("no vertex-era ids remain", () => {
  for (const model of models) expect(model.id).not.toMatch(/veo|omni.*-preview$/);
  expect(() => modelById("veo-3.1-generate-001")).toThrow("Unknown model");
});
