import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { generateImage } from "../src/tools/images";
import { modelById } from "../src/models";
import { useTempHome } from "./helpers";

const home = useTempHome();

test("requests an image via generateContent and writes with the returned format's extension", async () => {
  let params: unknown;
  const ai = {
    models: {
      generateContent: async (input: unknown) => {
        params = input;
        return { candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from("png").toString("base64"), mimeType: "image/png" } }] } }] };
      },
    },
  };
  const result = await generateImage(async () => ai as never, modelById("gemini-3.1-flash-image"), {
    prompt: "a cat",
    output_path: "~/cat.jpg",
    aspect_ratio: "16:9",
  });
  expect((params as { config: { responseModalities: string[] } }).config.responseModalities).toEqual(["IMAGE"]);
  expect(result.path).toBe(join(home.path, "cat.png"));
  expect(existsSync(result.path)).toBe(true);
});
