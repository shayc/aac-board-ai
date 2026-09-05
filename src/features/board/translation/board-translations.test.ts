import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { obfToBoard } from "../obf/obf-to-board";
import {
  applyResolvedPhrases,
  collectBoardPhrases,
  getSourceLanguage,
  resolvePhrase,
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
      strings: {
        "fr-FR": { Hello: "Salut", Bye: "Au revoir" },
        fr: { Hello: "Bonjour", Food: "Nourriture" },
        fr_CA: { Hello: "Allô" },
      },
    });

    expect(resolvePhrase(source, "Hello", "fr-CA")).toMatchObject({
      text: "Allô",
      language: "fr-CA",
      isMissing: false,
    });
    expect(resolvePhrase(source, "Food", "fr-CA")).toMatchObject({
      text: "Nourriture",
      language: "fr",
    });
    expect(resolvePhrase(source, "Bye", "fr-CA").text).toBe("Au revoir");
    expect(resolvePhrase(source, "Unknown", "fr-CA").isMissing).toBe(true);
  });

  test("does not use an incompatible Chinese script", () => {
    const source = makeOBFBoard({ strings: { "zh-Hans": { Hello: "你好" } } });
    expect(resolvePhrase(source, "Hello", "zh-Hant")).toMatchObject({
      text: "Hello",
      language: "en",
      isMissing: true,
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
    const english = applyResolvedPhrases(
      obfToBoard(source),
      collectBoardPhrases(source, true, "en"),
    );
    const spanish = applyResolvedPhrases(
      obfToBoard(source),
      collectBoardPhrases(source, true, "es"),
    );

    expect(english.buttons[0]).toMatchObject({
      label: "time",
      vocalization: "What time is it?",
      labelLanguage: "en",
    });
    expect(spanish.buttons[0]).toMatchObject({
      label: "hora",
      labelLanguage: "es",
      vocalization: "What time is it?",
      vocalizationLanguage: "en",
    });
    expect(source.buttons[0].label).toBe(":time");
    expect(resolvePhrase(source, ":utterance", "es")).toMatchObject({
      sourceText: "What time is it?",
      isMissing: true,
    });
  });

  test("own dictionary keys and identity translations count as covered", () => {
    const source = makeOBFBoard({ strings: { es: { Oslo: "Oslo" } } });
    expect(resolvePhrase(source, "Oslo", "es").isMissing).toBe(false);
    expect(resolvePhrase(source, "toString", "es")).toMatchObject({
      text: "toString",
      isMissing: true,
    });
    expect(resolvePhrase(source, ":unresolved", "es").isMissing).toBe(false);
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
