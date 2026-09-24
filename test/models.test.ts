import { expect, test } from "bun:test";
import { allowedModelsFor, generatingTools, modelById, models } from "../src/models";

test("every tool has at least one model and only known ids", () => {
  for (const tool of generatingTools) {
    const allowed = allowedModelsFor(tool);
    expect(allowed.length).toBeGreaterThan(0);
    for (const id of allowed) expect(modelById(id).id).toBe(id);
  }
});

test("extend and edit are Omni only, images are Nano Banana only", () => {
  expect(allowedModelsFor("extend_video")).toEqual(["gemini-omni-1.1-flash"]);
  expect(allowedModelsFor("edit_video")).toEqual(["gemini-omni-1.1-flash"]);
  expect(allowedModelsFor("generate_image").every((id) => modelById(id).family === "nano-banana")).toBe(true);
  expect(allowedModelsFor("generate_video")).toContain("veo-3.1-generate-001");
});

test("locations follow the family", () => {
  for (const model of models) expect(model.location).toBe(model.family === "veo" ? "us-central1" : "global");
});

test("unknown ids throw", () => {
  expect(() => modelById("nope")).toThrow("Unknown model nope");
});
