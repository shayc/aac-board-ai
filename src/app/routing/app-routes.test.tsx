import { importBoardFileFromURL, listBoardSetRecords } from "@features/library";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import {
  DEFAULT_LANGUAGE,
  setStoredLanguage,
} from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { stubSpeech } from "@shared/testing/stub-speech";
import { setTestViewport } from "@shared/testing/viewport";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { assert, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { appRoutes } from "./app-routes";
import { BOARD_SET_ROUTE_ID } from "./loaders/board-set-loader";

const OBZ_FIXTURE_URL =
  "/src/features/library/testing/sample-boards/lots-of-stuff.obz";

async function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  });

  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );

  return { router, screen };
}

// DOM text order alone misses bidi rendering errors.
function textLeft(element: Element, substring: string): number {
  const node = element.firstChild;
  assert(node instanceof Text);

  const start = node.data.indexOf(substring);
  assert(start !== -1);

  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, start + substring.length);

  return range.getBoundingClientRect().left;
}

function seedRecordedAudioSet() {
  const soundPath = "sounds/hello.wav";

  return seedBoardSets([
    {
      id: "recorded-set",
      rootBoardId: "home",
      boards: [
        makeOBFBoard({
          id: "home",
          name: "Home",
          buttons: [
            { id: "hello", label: "hello", sound_id: "hello-sound" },
            { id: "more", label: "more", load_board: { id: "next" } },
          ],
          grid: { rows: 1, columns: 2, order: [["hello", "more"]] },
          sounds: [
            { id: "hello-sound", path: soundPath, content_type: "audio/wav" },
          ],
        }),
        makeOBFBoard({ id: "next", name: "Next" }),
      ],
      assets: [{ path: soundPath, blob: new Blob(["recording"]) }],
    },
  ]);
}

function seedTwoBoardSet() {
  return seedBoardSets([
    {
      id: "food",
      name: "Food",
      rootBoardId: "home",
      boards: [
        makeOBFBoard({
          id: "home",
          name: "Home",
          buttons: [
            { id: "fruit", label: "fruit", load_board: { id: "fruit" } },
          ],
          grid: { rows: 1, columns: 1, order: [["fruit"]] },
        }),
        makeOBFBoard({ id: "fruit", name: "Fruit" }),
      ],
    },
  ]);
}

function seedExistingLotsOfStuffSet() {
  return seedBoardSets([
    {
      id: "lots-of-stuff",
      rootBoardId: "root-1",
      boards: [makeOBFBoard({ id: "root-1", name: "Old Board" })],
    },
  ]);
}

describe("app flow", () => {
  let speech: ReturnType<typeof stubSpeech>;
  let audio: ReturnType<typeof stubAudio>;

  beforeEach(async () => {
    setStoredLanguage(DEFAULT_LANGUAGE);
    speech = stubSpeech();
    audio = stubAudio();
    await resetBoardsDB();
  });

  test("empty database: imports and opens the bundled starter board", async () => {
    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "First Words" }))
      .toBeVisible();
  });

  test("starter board: a sentence continues into the food folder", async () => {
    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await screen.getByRole("button", { name: "I", exact: true }).click();
    await screen.getByRole("button", { name: "want" }).click();
    await screen.getByRole("button", { name: "food" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Food" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "water" }).click();
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["i want water"]);
    });
  });

  test("an imported board set opens, composes across boards, and speaks", async () => {
    await importBoardFileFromURL(OBZ_FIXTURE_URL);

    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "No way" }).click();
    await screen.getByRole("button", { name: "living things" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Inline Images Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "cat" }).click();
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.spokenTexts()).toEqual(["no way feline"]);
    });
  });

  test("recorded audio stays playable after leaving its board", async () => {
    await seedRecordedAudioSet();

    const { screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await screen.getByRole("button", { name: "hello" }).click();
    await screen.getByRole("button", { name: "more" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Next" }))
      .toBeVisible();

    audio.play.mockClear();
    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(audio.play).toHaveBeenCalledTimes(1);
    });

    const element = audio.play.mock.contexts[0];
    assert(element instanceof HTMLAudioElement);

    const response = await fetch(element.src);

    expect(await response.text()).toBe("recording");
  });

  test("?board= link that collides with an existing set keeps both", async () => {
    await seedExistingLotsOfStuffSet();

    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`,
    );

    await screen.getByRole("button", { name: "Import" }).click();
    await screen.getByRole("button", { name: "Continue" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    expect(new Set((await listBoardSetRecords()).map((set) => set.id))).toEqual(
      new Set(["lots-of-stuff", "lots-of-stuff-2"]),
    );
  });

  test("?board= link imports once while another set finishes translating", async () => {
    await seedBoardSets([{ id: "zoo", name: "Zoo", rootBoardId: "home" }]);
    setStoredLanguage("es");
    stubTranslator((input) => `[es] ${input}`);

    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`,
    );

    await screen.getByRole("button", { name: "Importar" }).click();
    await screen.getByRole("button", { name: "Continuar" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "[es] Lots of Stuff Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "Abrir biblioteca" }).click();
    await expect
      .element(screen.getByRole("link", { name: "[es] Zoo" }))
      .toBeVisible();
    expect(new Set((await listBoardSetRecords()).map((set) => set.id))).toEqual(
      new Set(["zoo", "lots-of-stuff"]),
    );
  });

  test("?board= link asks before importing and names the link's host", async () => {
    const { screen } = await renderApp(
      `/?board=${encodeURIComponent("https://boards.example/core.obz")}`,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Import board file from link?",
    });
    await expect.element(dialog).toBeVisible();
    await expect
      .element(dialog)
      .toHaveAccessibleDescription(
        "This link imports a board file from ⁨boards.example⁩. Import it only if you trust whoever sent the link.",
      );
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("double-tapping Import on a ?board= link imports the board set once", async () => {
    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`,
    );

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await screen.getByRole("button", { name: "Import" }).dblClick();
    await screen.getByRole("button", { name: "Continue" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();
    expect((await listBoardSetRecords()).map((set) => set.id)).toEqual([
      "lots-of-stuff",
    ]);
    expect(
      fetchSpy.mock.calls.filter(
        ([url]) => url instanceof URL && url.pathname === OBZ_FIXTURE_URL,
      ),
    ).toHaveLength(1);
  });

  test("a long ?board= link host wraps inside the dialog on a narrow screen", async () => {
    await setTestViewport(320, 640);

    const host = "boards.examplecorporationwithaverylongname.example";
    const { screen } = await renderApp(
      `/?board=${encodeURIComponent(`https://${host}/core.obz`)}`,
    );

    const description = screen.getByText(host, { exact: false });
    await expect.element(description).toBeVisible();

    const element = description.element();
    expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
  });

  test("a digit-led ?board= link host keeps its order in a right-to-left language", async () => {
    setStoredLanguage("he");
    const { screen } = await renderApp(
      `/?board=${encodeURIComponent("https://123.example.com/core.obz")}`,
    );

    const description = screen.getByText("123.example.com", { exact: false });
    await expect.element(description).toBeVisible();

    const text = description.element();
    expect(textLeft(text, "123")).toBeLessThan(textLeft(text, "example"));
  });

  test("cancelling a ?board= link opens the existing board set without importing", async () => {
    await seedBoardSets([
      {
        id: "animals",
        rootBoardId: "home",
        name: "Animals",
        boards: [makeOBFBoard({ id: "home", name: "Animals Home" })],
      },
    ]);

    const { router, screen } = await renderApp(
      `/?board=${encodeURIComponent("https://boards.example/core.obz")}`,
    );

    await screen.getByRole("button", { name: "Cancel" }).click();
    await screen.getByRole("button", { name: "Continue" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Animals Home" }))
      .toBeVisible();
    expect(router.state.location.pathname).toBe("/sets/animals/boards/home");
    expect((await listBoardSetRecords()).map((set) => set.id)).toEqual([
      "animals",
    ]);
  });

  test("going back after importing a ?board= link skips the import dialog", async () => {
    await seedBoardSets([
      {
        id: "animals",
        rootBoardId: "home",
        name: "Animals",
        boards: [makeOBFBoard({ id: "home", name: "Animals Home" })],
      },
    ]);
    const { router, screen } = await renderApp("/sets/animals/boards/home");
    await screen.getByRole("button", { name: "Continue" }).click();

    await router.navigate(`/?board=${encodeURIComponent(OBZ_FIXTURE_URL)}`);
    await screen.getByRole("button", { name: "Import" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    await router.navigate(-1);

    await expect
      .element(screen.getByRole("grid", { name: "Animals Home" }))
      .toBeVisible();
  });

  test("deleting the active board set opens the remaining one", async () => {
    await seedBoardSets([
      {
        id: "animals",
        rootBoardId: "home",
        name: "Animals",
        boards: [makeOBFBoard({ id: "home", name: "Animals Home" })],
      },
      {
        id: "zoo",
        rootBoardId: "home",
        name: "Zoo",
        boards: [makeOBFBoard({ id: "home", name: "Zoo Home" })],
      },
    ]);

    const { router, screen } = await renderApp("/sets/animals/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Animals Home" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "Open library" }).click();
    await screen
      .getByRole("button", { name: "More options for Animals" })
      .click();
    await screen.getByRole("menuitem", { name: "Delete" }).click();
    await screen.getByRole("button", { name: "Delete" }).click();

    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/sets/zoo/boards/home");
    });
    await screen.getByRole("button", { name: "Close library" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Zoo Home" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("grid", { name: "Animals Home" }))
      .not.toBeInTheDocument();
  });

  test("moving between boards of a set keeps the loaded board list", async () => {
    await seedTwoBoardSet();

    const { router, screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    const boardSetData: unknown = router.state.loaderData[BOARD_SET_ROUTE_ID];
    await screen.getByRole("button", { name: "fruit" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Fruit" }))
      .toBeVisible();

    expect(router.state.loaderData[BOARD_SET_ROUTE_ID]).toBe(boardSetData);
  });

  test("choosing a board in the header's board list opens it and enables Back", async () => {
    await seedTwoBoardSet();

    const { screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    await screen.getByRole("combobox", { name: "Board" }).click();
    await screen.getByRole("option", { name: "Fruit" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Fruit" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("combobox", { name: "Board" }))
      .toHaveValue("Fruit");

    await screen.getByRole("button", { name: "Go back" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Home" }))
      .toBeVisible();
  });

  test("changing the language translates the board, board list, and library in place", async () => {
    await seedTwoBoardSet();
    stubTranslator((input) => `[es] ${input}`);

    const { screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Home" }))
      .toBeVisible();

    setStoredLanguage("es");

    await expect
      .element(screen.getByRole("grid", { name: "[es] Home" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("combobox", { name: "Tablero" }))
      .toHaveValue("[es] Home");

    await screen.getByRole("combobox", { name: "Tablero" }).click();
    await expect
      .element(screen.getByRole("option", { name: "[es] Fruit" }))
      .toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    await screen.getByRole("button", { name: "Abrir biblioteca" }).click();
    await expect
      .element(screen.getByRole("link", { name: "[es] Food" }))
      .toBeVisible();
  });

  test("the board set on screen translates without waiting for the others", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1);
    await seedBoardSets([
      {
        id: "animals",
        name: "Animals",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", name: "Animals Home" })],
      },
    ]);
    now.mockReturnValue(2);
    await seedBoardSets([
      {
        id: "zoo",
        name: "Zoo",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", name: "Zoo Home" })],
      },
    ]);
    now.mockRestore();
    stubTranslator((input) =>
      input.startsWith("Zoo") ? new Promise(() => {}) : `[es] ${input}`,
    );

    const { screen } = await renderApp("/sets/animals/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    setStoredLanguage("es");

    await expect
      .element(screen.getByRole("grid", { name: "[es] Animals Home" }))
      .toBeVisible();
  });

  test("board links stay usable while a translation model downloads", async () => {
    await seedTwoBoardSet();
    const translator = stubTranslator((input) => `[es] ${input}`);
    const download = Promise.withResolvers<void>();
    const createInstance = translator.create.getMockImplementation();
    translator.create.mockImplementation(async (options) => {
      await download.promise;

      return createInstance?.(options);
    });

    const { screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    setStoredLanguage("es");
    await expect.poll(() => translator.create.mock.calls.length).toBe(1);

    await screen.getByRole("button", { name: "fruit" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Fruit" }))
      .toBeVisible();

    download.resolve();

    await expect
      .element(screen.getByRole("grid", { name: "[es] Fruit" }))
      .toBeVisible();
  });

  test("a set added while a translation model downloads leaves the download running", async () => {
    await seedTwoBoardSet();
    const translator = stubTranslator((input) => `[es] ${input}`);
    const download = Promise.withResolvers<void>();
    const createInstance = translator.create.getMockImplementation();
    let isModelDownloaded = false;
    translator.create.mockImplementation(async (options) => {
      // Only the language change carries the user gesture a download needs.
      if (translator.create.mock.calls.length > 1 && !isModelDownloaded) {
        throw new DOMException("Needs a user gesture", "NotAllowedError");
      }

      await download.promise;
      isModelDownloaded = true;

      return createInstance?.(options);
    });

    const { screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    setStoredLanguage("es");
    await expect.poll(() => translator.create.mock.calls.length).toBe(1);

    await seedBoardSets([{ id: "zoo", name: "Zoo", rootBoardId: "home" }]);
    await screen.getByRole("button", { name: "Abrir biblioteca" }).click();
    await expect
      .element(screen.getByRole("link", { name: "Zoo" }))
      .toBeVisible();
    download.resolve();

    await expect
      .element(screen.getByRole("link", { name: "[es] Zoo" }))
      .toBeVisible();
    await screen.getByRole("button", { name: "Cerrar biblioteca" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "[es] Home" }))
      .toBeVisible();
  });

  test("the language settings report the model download, then the board translation", async () => {
    await seedTwoBoardSet();
    const translator = stubTranslator();
    const download = Promise.withResolvers<void>();
    const translation = Promise.withResolvers<void>();
    const createInstance = translator.create.getMockImplementation();
    translator.availability.mockResolvedValue("downloading");
    translator.create.mockImplementation(async (options) => {
      await download.promise;

      return createInstance?.(options);
    });
    translator.translate.mockImplementation(async (input) => {
      await translation.promise;

      return `[es] ${input}`;
    });

    const { screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    setStoredLanguage("es");
    await screen.getByRole("button", { name: "Abrir ajustes" }).click();
    const notice = screen.getByRole("status");

    await expect
      .element(notice)
      .toHaveTextContent("Descargando modelo de traducción…0% completado");

    const downloadNotice = notice.element();
    download.resolve();
    await expect.element(notice).toHaveTextContent("Traduciendo tableros…");
    expect(notice.element()).toBe(downloadNotice);

    translation.resolve();
    await expect.element(notice).not.toBeInTheDocument();
  });

  test("changing language mid-translation clears the board translation status", async () => {
    await seedTwoBoardSet();
    const translator = stubTranslator(() => new Promise(() => {}));

    const { screen } = await renderApp("/sets/food/boards/home");

    await screen.getByRole("button", { name: "Continue" }).click();
    setStoredLanguage("es");
    await screen.getByRole("button", { name: "Abrir ajustes" }).click();
    const notice = screen.getByRole("status");
    await expect.element(notice).toHaveTextContent("Traduciendo tableros…");

    // Leave preparation pending to isolate the language change's status reset.
    translator.create.mockImplementation(() => new Promise(() => {}));
    setStoredLanguage("fr");

    await expect
      .element(screen.getByRole("combobox", { name: "Langue" }))
      .toBeVisible();
    await expect.element(notice).not.toBeInTheDocument();
  });

  test("client navigation from a board sets the localized not-found title", async () => {
    const { router, screen } = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "First Words" }))
      .toBeVisible();
    expect(document.title).toBe("First Words");

    await router.navigate("/nonexistent");

    await expect.element(screen.getByText("Page not found")).toBeVisible();
    expect(document.title).toBe("Page not found");
    await expect
      .element(screen.getByRole("link", { name: "Go home" }))
      .toHaveAttribute("href", "/");
  });
});
