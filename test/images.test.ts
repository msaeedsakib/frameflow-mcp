import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { generateImage } from "../src/tools/images";
import { modelById } from "../src/models";
import { useTempHome } from "./helpers";

const home = useTempHome();

test("requests jpeg and writes with the returned format's extension", async () => {
  let params: unknown;
  const ai = {
    interactions: {
      create: async (input: unknown) => {
        params = input;
        return { output_image: { data: Buffer.from("jpg").toString("base64"), mime_type: "image/jpeg" }, output_text: "" };
      },
    },
  };
  const result = await generateImage(async () => ai as never, modelById("gemini-3.1-flash-image"), {
    prompt: "a cat",
    output_path: "~/cat.png",
    aspect_ratio: "16:9",
  });
  expect((params as { response_format: { mime_type: string } }).response_format.mime_type).toBe("image/jpeg");
  expect(result.path).toBe(join(home.path, "cat.jpg"));
  expect(existsSync(result.path)).toBe(true);
});
