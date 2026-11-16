import { boardPath } from "@features/library";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubLanguageModel } from "@shared/testing/stub-built-in-ai";
import { stubSpeech } from "@shared/testing/stub-speech";
import { beforeEach, describe, expect, test } from "vitest";
import { renderCommunicationBoard } from "./testing/render-communication-board";

const SET_ID = "continuations-test-set";

const MAIN_BOARD = makeOBFBoard({
  id: "main",
  name: "Main",
  locale: "en",
  grid: { rows: 1, columns: 3, order: [["want", "to", "eat-folder"]] },
  buttons: [
    { id: "want", label: "want" },
    { id: "to", label: "to" },
    { id: "eat-folder", label: "food", load_board: { id: "eat" } },
  ],
});

const EAT_BOARD = makeOBFBoard({
  id: "eat",
  name: "Eat",
  locale: "en",
  grid: { rows: 1, columns: 1, order: [["eat"]] },
  buttons: [{ id: "eat", label: "eat" }],
});

describe("CommunicationBoard continuations", () => {
  beforeEach(async () => {
    stubSpeech();
    stubAudio();
    await resetBoardsDB();
    await seedBoardSets([
      { id: SET_ID, rootBoardId: "main", boards: [MAIN_BOARD, EAT_BOARD] },
    ]);
  });

  test("suggests words from a board one tap away and adds them as tiles", async () => {
    const languageModel = stubLanguageModel(() =>
      JSON.stringify({ sentences: ["want to eat", "want to"] }),
    );
    const screen = await renderCommunicationBoard(
      MAIN_BOARD,
      [boardPath({ boardSetId: SET_ID, boardId: "main" })],
      "main",
    );

    await screen.getByRole("button", { name: "want", exact: true }).click();
    await screen.getByRole("button", { name: "want to eat" }).click();

    const messageItems = screen
      .getByRole("list", { name: "Message" })
      .getByRole("listitem");
    await expect.element(messageItems).toHaveLength(3);
    await expect.element(messageItems.nth(2)).toHaveTextContent("eat");
    // The folder's own label is never offered, only the words behind it.
    expect(JSON.stringify(languageModel.create.mock.calls)).not.toContain(
      "food",
    );
  });
});
