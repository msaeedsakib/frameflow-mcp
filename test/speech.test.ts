import { expect, test } from "bun:test";
import { buildSpeech } from "../src/tools/speech";

test("single speaker builds a one-entry speech_config and a style annotation", () => {
  const built = buildSpeech({ output_path: "x.wav", text: "Hello there", voice: "Kore", style: "cheerful" });
  expect(built.speech_config).toEqual([{ voice: "Kore" }]);
  expect(built.input).toEqual([{ type: "text", text: "Hello there", annotations: [{ type: "speech_metadata", style: "cheerful", speaker: undefined }] }]);
});

test("single speaker accepts a custom voice id and omits annotations without style", () => {
  const built = buildSpeech({ output_path: "x.wav", text: "Hi", voice: "voice_abc123" });
  expect(built.speech_config).toEqual([{ voice: "voice_abc123" }]);
  expect(built.input[0]?.annotations).toBeUndefined();
});

test("dialogue builds speakers config and per-turn speaker annotations", () => {
  const built = buildSpeech({
    output_path: "x.wav",
    turns: [
      { speaker: "Joe", text: "Ready?" },
      { speaker: "Jane", text: "Always.", style: "dry" },
    ],
    voices: { Joe: "Puck", Jane: "Kore" },
  });
  expect(built.speech_config).toEqual({ speakers: [{ speaker: "Joe", voice: "Puck" }, { speaker: "Jane", voice: "Kore" }] });
  expect(built.input.map((part) => part.annotations?.[0])).toEqual([
    { type: "speech_metadata", style: undefined, speaker: "Joe" },
    { type: "speech_metadata", style: "dry", speaker: "Jane" },
  ]);
});

test("dialogue rejects missing voices, custom voices and more than two speakers", () => {
  expect(() => buildSpeech({ output_path: "x.wav", turns: [{ speaker: "Joe", text: "a" }] })).toThrow("No voice given for speaker(s) Joe");
  expect(() => buildSpeech({ output_path: "x.wav", turns: [{ speaker: "Joe", text: "a" }], voices: { Joe: "voice_123" } })).toThrow("prebuilt voices only");
  expect(() =>
    buildSpeech({
      output_path: "x.wav",
      turns: [{ speaker: "A", text: "a" }, { speaker: "B", text: "b" }, { speaker: "C", text: "c" }],
      voices: { A: "Puck", B: "Kore", C: "Zephyr" },
    }),
  ).toThrow("At most 2 speakers");
});

test("requires text or turns, and a voice for single speaker", () => {
  expect(() => buildSpeech({ output_path: "x.wav" })).toThrow("Provide text");
  expect(() => buildSpeech({ output_path: "x.wav", text: "hi" })).toThrow("Provide a voice");
});
