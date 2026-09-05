import {
  stubBuiltInAIUnsupported,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { obfToBoard } from "../obf/obf-to-board";
import { getBoard, type BoardRecord } from "../storage/board-content-storage";
import { createBoardSet } from "../storage/board-set-storage";
import { makeOBFBoard, resetBoardsDB } from "../testing";
import {
  resolveBoardForLanguage,
  TRANSLATION_WAIT_MS,
} from "./resolve-board-for-language";

function makeRecord(overrides: Partial<OBFBoard> = {}): BoardRecord {
  const obf = makeOBFBoard({
    id: "board-1",
    name: "Food",
    locale: "en-US",
    buttons: [
      { id: "eat", label: "eat", vocalization: "eat" },
      { id: "drink", label: "drink" },
    ],
    ...overrides,
  });

  return { setId: "set-1", boardId: obf.id, name: obf.name ?? obf.id, obf };
}

function resolve(record: BoardRecord, language = "es", signal?: AbortSignal) {
  return resolveBoardForLanguage(
    obfToBoard(record.obf),
    [record],
    language,
    signal,
  );
}

describe("resolveBoardForLanguage", () => {
  beforeEach(resetBoardsDB);

  test("uses source and cached text without creating a Translator", async () => {
    const { create } = stubTranslator();
    const source = makeRecord({
      strings: { "es-ES": { Food: "Comida", eat: "comer", drink: "beber" } },
    });
    const english = await resolve(source, "en");
    const spanish = await resolve(source);

    expect(english.board.name).toBe("Food");
    expect(spanish.board).toMatchObject({
      name: "Comida",
      nameLanguage: "es-ES",
    });
    expect(spanish.board.buttons[0]).toMatchObject({
      label: "comer",
      vocalization: "comer",
    });
    expect(create).not.toHaveBeenCalled();
  });

  test("a name-only cache leaves tiles eligible and successful results persist under their original keys", async () => {
    const record = makeRecord({
      buttons: [{ id: "eat", label: ":eat", vocalization: ":utterance" }],
      strings: {
        en: { ":eat": "eat", ":utterance": "I want to eat" },
        es: { Food: "Comida" },
      },
    });
    await createBoardSet({
      boardSet: { setId: "set-1", name: "Set", rootBoardId: "board-1" },
      boards: [record],
      assets: [],
    });
    const { translate } = stubTranslator((input) => `[es] ${input}`);

    const result = await resolve(record);

    expect(result.board.name).toBe("Comida");
    expect(result.board.buttons[0]).toMatchObject({
      label: "[es] eat",
      vocalization: "[es] I want to eat",
    });
    expect(translate.mock.calls.map(([input]) => input)).toEqual([
      "eat",
      "I want to eat",
    ]);
    await expect
      .poll(async () => (await getBoard("set-1", "board-1"))?.obf.strings?.es)
      .toEqual({
        Food: "Comida",
        ":eat": "[es] eat",
        ":utterance": "[es] I want to eat",
      });
  });

  test("resolves active content and unvisited names using one translator per source pair", async () => {
    const active = makeRecord();
    const other = makeRecord({
      id: "other",
      name: "Animals",
      buttons: [{ id: "dog", label: "dog" }],
    });
    const unnamed = makeRecord({ id: "identifier", name: undefined });
    const { create, translate } = stubTranslator((input) => `[es] ${input}`);

    const result = await resolveBoardForLanguage(
      obfToBoard(active.obf),
      [other, active, unnamed],
      "es",
    );

    expect(result.board.name).toBe(result.summaries[1].name);
    expect(result.summaries.map(({ name }) => name)).toEqual([
      "[es] Animals",
      "[es] Food",
      "identifier",
    ]);
    expect(create).toHaveBeenCalledOnce();
    expect(translate.mock.calls.map(([input]) => input)).toEqual([
      "Food",
      "eat",
      "drink",
      "Animals",
    ]);
  });

  test("uses the same identifier fallback for an unnamed active board and its summary", async () => {
    const { translate } = stubTranslator((input) => `[es] ${input}`);
    const result = await resolve(makeRecord({ name: undefined }));

    expect(result.board).toMatchObject({
      name: "board-1",
      nameLanguage: undefined,
    });
    expect(result.summaries[0]).toEqual({
      boardId: "board-1",
      name: "board-1",
      nameLanguage: undefined,
    });
    expect(translate.mock.calls.map(([input]) => input)).toEqual([
      "eat",
      "drink",
    ]);
  });

  test("keeps successful phrases and cached fallback when one translation fails", async () => {
    stubTranslator((input) =>
      input === "drink"
        ? Promise.reject(new Error("failure"))
        : `[es] ${input}`,
    );
    const result = await resolve(
      makeRecord({ strings: { es: { Food: "Comida" } } }),
    );
    expect(result.board).toMatchObject({ name: "Comida", locale: "en-US" });
    expect(result.board.buttons[0]).toMatchObject({
      label: "[es] eat",
      labelLanguage: "es",
    });
    expect(result.board.buttons[1]).toMatchObject({
      label: "drink",
      labelLanguage: "en-US",
    });
    expect(result.sourceLanguages).toEqual(["en-US"]);
  });

  test("unsupported, unprepared, and unknown-source content remains usable", async () => {
    stubBuiltInAIUnsupported("Translator");
    expect((await resolve(makeRecord())).board.name).toBe("Food");

    const { availability, create } = stubTranslator();
    availability.mockResolvedValue("downloadable");
    expect((await resolve(makeRecord())).board.name).toBe("Food");
    availability.mockResolvedValue("downloading");
    expect((await resolve(makeRecord())).board.name).toBe("Food");
    availability.mockResolvedValue("available");
    expect((await resolve(makeRecord({ locale: undefined }))).board.name).toBe(
      "Food",
    );
    expect(create).not.toHaveBeenCalled();
  });

  test("fresh text is returned even if its cache record no longer exists", async () => {
    stubTranslator((input) => `[es] ${input}`);
    const result = await resolve(makeRecord());
    expect(result.board.name).toBe("[es] Food");
    expect(result.summaries[0].name).toBe("[es] Food");
    expect(await getBoard("set-1", "board-1")).toBeUndefined();
  });

  test("the deadline retains completed phrases and ignores late results", async () => {
    const started = Promise.withResolvers<void>();
    const late = Promise.withResolvers<string>();
    stubTranslator((input) => {
      if (input === "Food") {
        return "Comida";
      }
      started.resolve();
      return late.promise;
    });
    vi.useFakeTimers();
    try {
      const pending = resolve(makeRecord());
      await started.promise;
      await vi.advanceTimersByTimeAsync(TRANSLATION_WAIT_MS);
      const result = await pending;
      expect(result.board.name).toBe("Comida");
      expect(result.board.buttons[0].label).toBe("eat");
      late.resolve("obsolete");
      await late.promise;
      expect(result.board.buttons[0].label).toBe("eat");
    } finally {
      vi.useRealTimers();
    }
  });

  test("an aborted request rejects promptly even if the platform ignores cancellation", async () => {
    const started = Promise.withResolvers<void>();
    const late = Promise.withResolvers<string>();
    stubTranslator(() => {
      started.resolve();
      return late.promise;
    });
    const controller = new AbortController();
    const pending = resolve(makeRecord(), "es", controller.signal);
    await started.promise;
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    late.resolve("obsolete");
  });
});
