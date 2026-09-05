import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { obfToBoard } from "../obf/obf-to-board";
import {
  applyButtonPhrases,
  collectBoardPhrases,
  getSourceLanguage,
} from "./board-translations";

describe("board phrase resolution", () => {
  test("preserves canonical source locales without assuming unknown content is English", () => {
    expect(getSourceLanguage("pt_BR")).toBe("pt-BR");
    expect(getSourceLanguage("zh-Hant")).toBe("zh-Hant");
    expect(getSourceLanguage(undefined)).toBeUndefined();
    expect(getSourceLanguage("not a locale")).toBeUndefined();
  });

  test("prefers exact entries and fills individual gaps using deterministic compatible dictionaries", () => {
    const source = makeOBFBoard({
      name: "Food",
      buttons: [
        { id: "hello", label: "Hello" },
        { id: "bye", label: "Bye" },
        { id: "unknown", label: "Unknown" },
      ],
      strings: {
        "fr-FR": { Hello: "Salut", Bye: "Au revoir" },
        fr: { Hello: "Bonjour", Food: "Nourriture" },
        fr_CA: { Hello: "Allô" },
      },
    });
    const phrases = collectBoardPhrases(source, true, "fr-CA");

    expect(phrases.get("Hello")).toMatchObject({
      text: "Allô",
      language: "fr-CA",
      shouldTranslate: false,
    });
    expect(phrases.get("Food")).toMatchObject({
      text: "Nourriture",
      language: "fr",
    });
    expect(phrases.get("Bye")).toMatchObject({ text: "Au revoir" });
    expect(phrases.get("Unknown")).toMatchObject({ shouldTranslate: true });
  });

  test("does not use an incompatible Chinese script", () => {
    const source = makeOBFBoard({
      name: "Hello",
      strings: { "zh-Hans": { Hello: "你好" } },
    });
    const phrases = collectBoardPhrases(source, false, "zh-Hant");
    expect(phrases.get("Hello")).toMatchObject({
      text: "Hello",
      language: "en",
      shouldTranslate: true,
    });
  });

  test("resolves source dictionary tokens even in the source language and preserves input", () => {
    const source = makeOBFBoard({
      name: "Clock",
      buttons: [{ id: "time", label: ":time", vocalization: ":utterance" }],
      strings: {
        en: { ":time": "time", ":utterance": "What time is it?" },
        es: { ":time": "hora" },
      },
    });
    const english = applyButtonPhrases(
      obfToBoard(source).buttons,
      collectBoardPhrases(source, true, "en"),
    );
    const spanishPhrases = collectBoardPhrases(source, true, "es");
    const spanish = applyButtonPhrases(
      obfToBoard(source).buttons,
      spanishPhrases,
    );

    expect(english[0]).toMatchObject({
      label: "time",
      vocalization: "What time is it?",
      labelLanguage: "en",
    });
    expect(spanish[0]).toMatchObject({
      label: "hora",
      labelLanguage: "es",
      vocalization: "What time is it?",
      vocalizationLanguage: "en",
    });
    expect(source.buttons[0].label).toBe(":time");
    expect(spanishPhrases.get(":utterance")).toMatchObject({
      sourceText: "What time is it?",
      shouldTranslate: true,
    });
  });

  test("own dictionary keys and identity translations count as covered", () => {
    const source = makeOBFBoard({
      name: "Oslo",
      buttons: [{ id: "word", label: "toString", vocalization: ":unresolved" }],
      strings: { es: { Oslo: "Oslo" } },
    });
    const phrases = collectBoardPhrases(source, true, "es");
    expect(phrases.get("Oslo")).toMatchObject({ shouldTranslate: false });
    expect(phrases.get("toString")).toMatchObject({
      text: "toString",
      shouldTranslate: true,
    });
    expect(phrases.get(":unresolved")).toMatchObject({
      shouldTranslate: false,
    });
  });

  test("name requests do not collect tile text or a missing-name identifier", () => {
    const source = makeOBFBoard({
      name: undefined,
      buttons: [{ id: "eat", label: "eat" }],
    });
    expect(collectBoardPhrases(source, false, "es").size).toBe(0);
    expect([...collectBoardPhrases(source, true, "es").keys()]).toEqual([
      "eat",
    ]);
  });
});
