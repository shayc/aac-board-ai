import { describe, expect, test } from "vitest";
import { makeOBFBoard } from "../testing";
import { withOBFStrings } from "./obf-strings";

describe("withOBFStrings", () => {
  test("adds a language's strings without changing the board it was given", () => {
    const obfBoard = makeOBFBoard({ strings: { fr: { Home: "Accueil" } } });
    const source = structuredClone(obfBoard);

    const translated = withOBFStrings(
      obfBoard,
      "es",
      new Map([["Home", "Inicio"]]),
    );

    expect(translated).toEqual({
      ...source,
      strings: { fr: { Home: "Accueil" }, es: { Home: "Inicio" } },
    });
    expect(obfBoard).toEqual(source);
  });

  test("replaces the strings a board already has in that language", () => {
    const obfBoard = makeOBFBoard({ strings: { es: { Home: "Casa" } } });

    const translated = withOBFStrings(
      obfBoard,
      "es",
      new Map([["Home", "Inicio"]]),
    );

    expect(translated.strings).toEqual({ es: { Home: "Inicio" } });
  });

  test("gives a board without strings its first language", () => {
    const translated = withOBFStrings(
      makeOBFBoard(),
      "es",
      new Map([["Home", "Inicio"]]),
    );

    expect(translated.strings).toEqual({ es: { Home: "Inicio" } });
  });
});
