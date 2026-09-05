import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { stubSpeech } from "@shared/testing/stub-speech";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { appRoutes } from "./app-routes";

async function renderApp() {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: ["/sets/set-1/boards/home"],
  });
  const screen = await render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  await screen.getByRole("button", { name: "Continue" }).click();
  await expect
    .element(screen.getByRole("grid", { name: "Home" }))
    .toBeVisible();
  return { screen, router };
}

beforeEach(async () => {
  stubAudio();
  stubSpeech();
  setStoredLanguage("en");
  await resetBoardsDB();
  await seedBoardSets([
    {
      setId: "set-1",
      rootBoardId: "home",
      boards: [
        {
          boardId: "home",
          name: "Home",
          obf: makeOBFBoard({
            id: "home",
            name: "Home",
            buttons: [{ id: "hello", label: "Hello" }],
            grid: { rows: 1, columns: 1, order: [["hello"]] },
          }),
        },
        {
          boardId: "food",
          name: "Food",
          obf: makeOBFBoard({
            id: "food",
            name: "Food",
            buttons: [
              { id: "eat", label: "eat", vocalization: "I want to eat" },
            ],
            grid: { rows: 1, columns: 1, order: [["eat"]] },
          }),
        },
      ],
    },
  ]);
});

describe("localized board route", () => {
  test("changing language translates the active board and unvisited names, then fills name-only cached boards", async () => {
    const { translate } = stubTranslator((input) => `[es] ${input}`);
    const { screen, router } = await renderApp();
    await screen.getByRole("button", { name: "Open settings" }).click();
    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "español" }).click();
    await screen
      .getByRole("button", { name: m.settingsClose({}, { locale: "es" }) })
      .click();

    await expect
      .element(screen.getByRole("grid", { name: "[es] Home" }))
      .toBeVisible();
    expect(document.title).toBe("[es] Home");
    expect(router.state.location.pathname).toBe("/sets/set-1/boards/home");
    const selector = screen.getByRole("combobox");
    await expect.element(selector).toHaveValue("[es] Home");
    await expect.element(selector).toHaveAttribute("lang", "es");
    await expect
      .element(screen.getByRole("button", { name: "[es] Hello" }))
      .toHaveAttribute("lang", "es");
    await selector.click();
    await screen.getByRole("option", { name: "[es] Food" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "[es] Food" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "[es] eat" }))
      .toBeVisible();
    expect(translate.mock.calls.map(([input]) => input)).toContain(
      "I want to eat",
    );
    await expect.element(screen.getByRole("tooltip")).not.toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });

  test("a late earlier language cannot replace the latest board or switcher", async () => {
    const started = Promise.withResolvers<void>();
    const late = Promise.withResolvers<string>();
    const { create, translate } = stubTranslator();
    create.mockImplementation(async (options) => ({
      destroy: () => undefined,
      translate: (input: string) => {
        if (options?.targetLanguage === "es") {
          started.resolve();
          return late.promise;
        }
        return `[${String(options?.targetLanguage)}] ${input}`;
      },
    }));
    const { screen, router } = await renderApp();
    setStoredLanguage("es");
    await started.promise;
    setStoredLanguage("fr");
    await expect
      .element(screen.getByRole("grid", { name: "[fr] Home" }))
      .toBeVisible();
    late.resolve("obsolete Spanish");
    await late.promise;
    await expect.element(screen.getByRole("combobox")).toHaveValue("[fr] Home");
    expect(document.title).toBe("[fr] Home");
    expect(router.state.location.pathname).toBe("/sets/set-1/boards/home");
    expect(translate).not.toHaveBeenCalled();
    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "[fr] Food" }))
      .toBeVisible();
  });

  test("language selection prepares a missing model and refreshes text after settings close", async () => {
    const download = Promise.withResolvers<void>();
    const { availability, create, translate } = stubTranslator(
      (input) => `[es] ${input}`,
    );
    availability.mockResolvedValue("downloadable");
    create.mockImplementation(async () => {
      availability.mockResolvedValue("downloading");
      await download.promise;
      availability.mockResolvedValue("available");
      return { destroy: () => undefined, translate };
    });
    const { screen } = await renderApp();
    await screen.getByRole("button", { name: "Open settings" }).click();
    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "español" }).click();
    await expect.poll(() => create.mock.calls.length).toBe(1);
    await expect
      .element(
        screen.getByRole("button", { name: "Traducir el texto del tablero" }),
      )
      .not.toBeInTheDocument();
    await screen
      .getByRole("button", { name: m.settingsClose({}, { locale: "es" }) })
      .click();

    await expect
      .element(screen.getByRole("grid", { name: "Home" }))
      .toBeVisible();
    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "Food" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Food" }))
      .toBeVisible();
    expect(translate).not.toHaveBeenCalled();
    download.resolve();

    await expect
      .element(screen.getByRole("grid", { name: "[es] Food" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "[es] eat" }))
      .toBeVisible();
    await expect.element(screen.getByRole("combobox")).toHaveValue("[es] Food");
    await screen.getByRole("combobox").click();
    await expect
      .element(screen.getByRole("option", { name: "[es] Home" }))
      .toBeVisible();
  });

  test("failed model preparation leaves the selected language and board navigation usable", async () => {
    const { availability, create } = stubTranslator();
    availability.mockResolvedValue("downloadable");
    create.mockRejectedValue(new Error("download failed"));
    const { screen, router } = await renderApp();
    await screen.getByRole("button", { name: "Open settings" }).click();
    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "español" }).click();
    await expect.poll(() => create.mock.calls.length).toBe(1);
    await expect
      .element(
        screen.getByRole("combobox", {
          name: m.languageLabel({}, { locale: "es" }),
        }),
      )
      .toHaveTextContent("español");
    await screen
      .getByRole("button", { name: m.settingsClose({}, { locale: "es" }) })
      .click();

    await expect
      .element(screen.getByRole("grid", { name: "Home" }))
      .toBeVisible();
    await screen.getByRole("combobox").click();
    await screen.getByRole("option", { name: "Food" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Food" }))
      .toBeVisible();
    expect(router.state.location.pathname).toBe("/sets/set-1/boards/food");
  });

  test("late preparation for an earlier selection cannot change the latest language", async () => {
    const download = Promise.withResolvers<void>();
    const { availability, create } = stubTranslator();
    availability.mockImplementation(async (options) =>
      options?.targetLanguage === "es" ? "downloadable" : "available",
    );
    let downloadSignal: unknown;
    create.mockImplementation(async (options) => {
      if (options?.targetLanguage === "es") {
        downloadSignal = options.signal;
        await download.promise;
      }
      return {
        destroy: () => undefined,
        translate: (input: string) =>
          `[${String(options?.targetLanguage)}] ${input}`,
      };
    });
    const { screen } = await renderApp();
    await screen.getByRole("button", { name: "Open settings" }).click();
    await screen.getByRole("combobox", { name: "Language" }).click();
    await screen.getByRole("option", { name: "español" }).click();
    await expect.poll(() => create.mock.calls.length).toBe(1);
    await screen
      .getByRole("combobox", { name: m.languageLabel({}, { locale: "es" }) })
      .click();
    await screen.getByRole("option", { name: "français" }).click();
    await screen
      .getByRole("button", { name: m.settingsClose({}, { locale: "fr" }) })
      .click();

    await expect
      .element(screen.getByRole("grid", { name: "[fr] Home" }))
      .toBeVisible();
    expect(downloadSignal).toBeInstanceOf(AbortSignal);
    expect((downloadSignal as AbortSignal).aborted).toBe(true);
    download.resolve();
    await download.promise;
    await expect.element(screen.getByRole("combobox")).toHaveValue("[fr] Home");
    expect(document.title).toBe("[fr] Home");
  });
});
