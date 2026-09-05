import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { CommunicationBoard } from "../communication-board";
import { CommunicationSessionProvider } from "../session/communication-session-provider";
import { getBoard } from "../storage/board-content-storage";
import { loadBoard } from "../storage/load-board";
import { makeOBFBoard, seedBoardSets } from "../testing";
import type { Board } from "../types";

function BoardTree({ board }: { board: Board }) {
  return (
    <MemoryRouter>
      <AppProviders>
        <CommunicationSessionProvider>
          <div style={{ height: "100vh" }}>
            <CommunicationBoard board={board} setId="set" />
          </div>
        </CommunicationSessionProvider>
      </AppProviders>
    </MemoryRouter>
  );
}

async function sourceBoard() {
  const obf = makeOBFBoard({
    id: "board",
    name: "Source",
    buttons: [{ id: "hello", label: "hello" }],
    grid: { rows: 1, columns: 1, order: [["hello"]] },
  });
  await seedBoardSets([
    {
      setId: "set",
      rootBoardId: "board",
      boards: [{ boardId: "board", name: "Source", obf }],
    },
  ]);

  return loadBoard({ setId: "set", boardId: "board" });
}

beforeEach(() => {
  stubSpeech();
  stubAudio();
  setStoredLanguage("es");
});

describe("board presentation and optional translation", () => {
  test("opens source content while translation is pending and applies it before interaction", async () => {
    const gate = Promise.withResolvers<void>();
    const translator = stubTranslator(async (text) => {
      await gate.promise;
      return `translated ${text}`;
    });
    const board = await sourceBoard();
    const screen = await render(<BoardTree board={board} />);
    await expect
      .element(screen.getByRole("button", { name: "hello", exact: true }))
      .toBeVisible();
    await vi.waitFor(() => expect(translator.translate).toHaveBeenCalled());

    gate.resolve();
    await expect
      .element(
        screen.getByRole("button", { name: "translated hello", exact: true }),
      )
      .toBeVisible();
    expect(board.buttons[0].label).toBe("hello");
    expect(board.sourceLocale).toBe("en");
  });

  test("focus locks labels, caches the late result, and uses it on the next presentation", async () => {
    const gate = Promise.withResolvers<void>();
    stubTranslator(async (text) => {
      await gate.promise;
      return `translated ${text}`;
    });
    const board = await sourceBoard();
    const screen = await render(<BoardTree board={board} />);
    const tile = screen.getByRole("button", { name: "hello", exact: true });
    await expect.element(tile).toBeVisible();
    tile.element().focus();
    gate.resolve();
    await expect
      .poll(
        async () => (await getBoard("set", "board"))?.obf.strings?.es?.hello,
      )
      .toBe("translated hello");

    await expect.element(tile).toHaveFocus();
    await expect.element(tile).toHaveAccessibleName("hello");
    const next = await loadBoard({ setId: "set", boardId: "board" });
    await screen.rerender(<BoardTree board={next} />);
    await expect
      .element(
        screen.getByRole("button", { name: "translated hello", exact: true }),
      )
      .toBeVisible();
  });

  test("a language change supersedes an older pending translation", async () => {
    const gate = Promise.withResolvers<void>();
    const translator = stubTranslator(async (text) => {
      await gate.promise;
      return `stale ${text}`;
    });
    const board = await sourceBoard();
    const screen = await render(<BoardTree board={board} />);
    await vi.waitFor(() => expect(translator.translate).toHaveBeenCalled());

    setStoredLanguage("en");
    gate.resolve();
    await expect
      .element(screen.getByRole("button", { name: "hello", exact: true }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "stale hello", exact: true }))
      .not.toBeInTheDocument();
  });

  test("explicit language changes replace a locked presentation with cached content", async () => {
    const board = await sourceBoard();
    board.strings = {
      es: { Source: "Origen", hello: "hola" },
      fr: { Source: "Source française", hello: "bonjour" },
    };
    const screen = await render(<BoardTree board={board} />);
    const spanish = screen.getByRole("button", { name: "hola", exact: true });
    await expect.element(spanish).toBeVisible();
    spanish.element().focus();

    setStoredLanguage("fr");
    await expect
      .element(screen.getByRole("button", { name: "bonjour", exact: true }))
      .toBeVisible();
  });
});
