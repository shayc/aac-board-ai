import { CommunicationSessionProvider } from "@features/board";
import {
  deleteTestBoardSet,
  createTestAudioBlob,
  loadTestImageBlob,
  makeOBFBoard,
  seedBoardSets,
} from "@features/board/testing";
import { BoardPage } from "@pages/board-page";
import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { StrictMode } from "react";
import { createMemoryRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { boardLoader } from "./loaders/board-loader";

function SessionShell() {
  return (
    <CommunicationSessionProvider>
      <div style={{ height: "100vh" }}>
        <Outlet />
      </div>
    </CommunicationSessionProvider>
  );
}

async function renderBoards() {
  const image = await loadTestImageBlob();
  const first = makeOBFBoard({
    id: "first",
    name: "First board",
    buttons: [
      {
        id: "recorded",
        label: "Recorded",
        image_id: "image",
        sound_id: "sound",
      },
      {
        id: "next",
        label: "Next board",
        load_board: { id: "second" },
        actions: [":clear"],
      },
    ],
    images: [{ id: "image", path: "image.png" }],
    sounds: [{ id: "sound", path: "sound.wav" }],
    grid: { rows: 1, columns: 2, order: [["recorded", "next"]] },
  });
  const second = makeOBFBoard({
    id: "second",
    name: "Second board",
    buttons: [{ id: "home", label: "Home action", action: ":home" }],
    grid: { rows: 1, columns: 1, order: [["home"]] },
  });
  const other = makeOBFBoard({ id: "other", name: "Other set" });
  await seedBoardSets([
    {
      setId: "first-set",
      rootBoardId: "first",
      boards: [
        { boardId: "first", name: "First board", obf: first },
        { boardId: "second", name: "Second board", obf: second },
      ],
      assets: [
        { path: "image.png", blob: image },
        {
          path: "sound.wav",
          blob: createTestAudioBlob(),
        },
      ],
    },
    {
      setId: "other-set",
      rootBoardId: "other",
      boards: [{ boardId: "other", name: "Other set", obf: other }],
    },
  ]);
  const router = createMemoryRouter(
    [
      {
        Component: SessionShell,
        children: [
          {
            path: "/sets/:setId/boards/:boardId",
            loader: boardLoader,
            Component: BoardPage,
            HydrateFallback: () => null,
          },
          { path: "/outside", element: <p>Outside board</p> },
        ],
      },
    ],
    { initialEntries: ["/sets/first-set/boards/first"] },
  );
  const screen = await render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
  await expect
    .element(screen.getByRole("grid", { name: "First board" }))
    .toBeVisible();

  return { screen, router };
}

beforeEach(() => {
  stubSpeech();
  stubAudio();
});

test("a message retains recorded media across boards, route departures, set changes, and source deletion", async () => {
  const { screen, router } = await renderBoards();
  const recorded = screen.getByRole("button", {
    name: "Recorded",
    exact: true,
  });
  const tileUrl = recorded.element().querySelector("img")?.src;
  assertDefined(tileUrl);
  await recorded.click();
  const messageImage = screen
    .getByRole("button", { name: "Play message" })
    .element()
    .parentElement?.querySelector("img");
  assertDefined(messageImage);
  await expect.poll(() => messageImage.src).toContain("blob:");
  const messageUrl = messageImage.src;
  expect(messageUrl).not.toBe(tileUrl);

  await screen.getByRole("button", { name: "Next board", exact: true }).click();
  await expect
    .element(screen.getByRole("grid", { name: "Second board" }))
    .toBeVisible();
  await expect(fetch(tileUrl)).rejects.toThrow();
  expect((await fetch(messageUrl)).ok).toBe(true);

  await screen
    .getByRole("button", { name: "Home action", exact: true })
    .click();
  await expect
    .element(screen.getByRole("grid", { name: "First board" }))
    .toBeVisible();
  await router.navigate("/outside");
  await expect.element(screen.getByText("Outside board")).toBeVisible();
  await expect(fetch(messageUrl)).rejects.toThrow();
  await router.navigate("/sets/other-set/boards/other");
  await expect
    .element(screen.getByRole("grid", { name: "Other set" }))
    .toBeVisible();
  await deleteTestBoardSet("first-set");

  const audio = stubAudio();
  let playbackUrl: string | undefined;
  let finishPlayback = () => {};
  audio.play.mockImplementation(function (this: HTMLAudioElement) {
    playbackUrl = this.src;
    finishPlayback = () => {
      this.dispatchEvent(new Event("ended"));
    };
    return Promise.resolve();
  });
  await screen.getByRole("button", { name: "Play message" }).click();
  assertDefined(playbackUrl);
  const actual = new Uint8Array(await (await fetch(playbackUrl)).arrayBuffer());
  const expected = new Uint8Array(await createTestAudioBlob().arrayBuffer());
  expect(actual).toEqual(expected);

  await userEvent.keyboard("{Meta>}{Backspace}{/Meta}");
  expect((await fetch(playbackUrl)).ok).toBe(true);

  finishPlayback();
  await expect
    .element(screen.getByRole("button", { name: "Play message" }))
    .toBeDisabled();
  await expect(fetch(playbackUrl)).rejects.toThrow();
  await screen.unmount();
});

test("unmounting releases active output resources", async () => {
  const { screen } = await renderBoards();
  const audio = stubAudio();
  let playbackUrl: string | undefined;
  audio.play.mockImplementation(function (this: HTMLAudioElement) {
    playbackUrl = this.src;
    return Promise.resolve();
  });
  await screen.getByRole("button", { name: "Recorded", exact: true }).click();
  assertDefined(playbackUrl);
  expect((await fetch(playbackUrl)).ok).toBe(true);

  await screen.unmount();
  await expect(fetch(playbackUrl)).rejects.toThrow();
});
