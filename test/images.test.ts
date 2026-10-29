import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { modelById } from "../src/models";
import { generateImage } from "../src/tools/images";
import { useTempHome } from "./helpers";

const home = useTempHome();

type Captured = {
  response_format: { type: string; aspect_ratio?: string; image_size?: string };
  input: Array<{ type: string; data?: string; mime_type?: string; text?: string }>;
};

function fakeClient(capture: (params: Captured) => void) {
  const ai = {
    interactions: {
      create: async (params: Captured) => {
        capture(params);
        return { id: "i1", status: "completed", output_image: { data: Buffer.from("png").toString("base64"), mime_type: "image/png" }, output_text: "" };
      },
    },
  };
  return async () => ai as never;
}

test("requests an image through the Interactions API and writes with the returned extension", async () => {
  let params: Captured | undefined;
  const result = await generateImage(fakeClient((p) => (params = p)), modelById("gemini-nano-banana-2.1"), {
    prompt: "a cat",
    output_path: "~/cat.jpg",
    aspect_ratio: "16:9",
  });
  expect(params?.response_format).toEqual({ type: "image", aspect_ratio: "16:9", image_size: undefined });
  expect(result.path).toBe(join(home.path, "cat.png"));
  expect(existsSync(result.path)).toBe(true);
});

test("reference images are sent as inline parts before the prompt, in order", async () => {
  await writeFile(join(home.path, "logo.png"), Buffer.from("logo"));
  await writeFile(join(home.path, "product.jpg"), Buffer.from("product"));
  let params: Captured | undefined;
  await generateImage(fakeClient((p) => (params = p)), modelById("gemini-3-pro-image"), {
    prompt: "banner",
    output_path: "~/banner.png",
    reference_image_paths: ["~/logo.png", "~/product.jpg"],
  });
  expect(params?.input.map((part) => part.mime_type ?? part.text)).toEqual(["image/png", "image/jpeg", "banner"]);
  expect(params?.input[0]?.data).toBe(Buffer.from("logo").toString("base64"));
});
