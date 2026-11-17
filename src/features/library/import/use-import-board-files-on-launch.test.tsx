import { renderWithProviders } from "@shared/testing/render-with-providers";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { rootBoardPath } from "../board-paths";
import { listBoardSetRecords } from "../storage/board-set-storage";
import {
  loadFixtureFile,
  resetBoardsDB,
  SAMPLE_BOARD_SET_ID,
  SAMPLE_OBF_FILE,
} from "../testing";
import { useImportBoardFilesOnLaunch } from "./use-import-board-files-on-launch";

function LaunchHarness() {
  useImportBoardFilesOnLaunch();

  return <div data-testid="path">{useLocation().pathname}</div>;
}

function stubLaunchQueue() {
  let consumer: ((params: LaunchParams) => void) | undefined;
  let consumerInstallCount = 0;

  vi.stubGlobal("launchQueue", {
    setConsumer: (next: (params: LaunchParams) => void) => {
      consumer = next;
      consumerInstallCount += 1;
    },
  });

  return {
    getConsumerInstallCount: () => consumerInstallCount,
    launch: (...files: FileSystemFileHandle[]) => consumer?.({ files }),
  };
}

function fileHandle(file: File): FileSystemFileHandle {
  return { getFile: () => Promise.resolve(file) } as FileSystemFileHandle;
}

function inaccessibleFileHandle(name: string): FileSystemFileHandle {
  return {
    name,
    getFile: () => Promise.reject(new DOMException("Access denied")),
  } as FileSystemFileHandle;
}

function renderLaunchHandler() {
  return renderWithProviders(
    <MemoryRouter>
      <LaunchHarness />
    </MemoryRouter>,
  );
}

describe("useImportBoardFilesOnLaunch", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("does nothing when the browser has no launch queue", async () => {
    vi.stubGlobal("launchQueue", undefined);

    const screen = await renderLaunchHandler();

    expect(await listBoardSetRecords()).toHaveLength(0);
    await expect.element(screen.getByTestId("path")).toHaveTextContent("/");
  });

  test("imports only the board files and opens the result", async () => {
    const launchQueue = stubLaunchQueue();
    const screen = await renderLaunchHandler();
    const initialConsumerInstallCount = launchQueue.getConsumerInstallCount();

    expect(initialConsumerInstallCount).toBeGreaterThan(0);

    launchQueue.launch(
      fileHandle(new File([""], "notes.txt")),
      fileHandle(await loadFixtureFile(SAMPLE_OBF_FILE)),
    );

    await vi.waitFor(async () => {
      const boardSets = await listBoardSetRecords();
      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]?.id).toBe(SAMPLE_BOARD_SET_ID);
    });

    await expect.element(screen.getByTestId("path")).toHaveTextContent(
      rootBoardPath({
        id: SAMPLE_BOARD_SET_ID,
        rootBoardId: "lots_of_stuff",
      }),
    );
    expect(launchQueue.getConsumerInstallCount()).toBe(
      initialConsumerInstallCount,
    );
  });

  test("reports a launched file that isn't a board file", async () => {
    const launchQueue = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launchQueue.launch(fileHandle(new File([""], "notes.txt")));

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Only board files can be imported");
    expect(await listBoardSetRecords()).toHaveLength(0);
  });

  test("imports the readable files when another launched file can't be opened", async () => {
    const launchQueue = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launchQueue.launch(
      inaccessibleFileHandle("board.obz"),
      fileHandle(await loadFixtureFile(SAMPLE_OBF_FILE)),
    );

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Couldn't import some board files (1 of 2)");
    expect(await listBoardSetRecords()).toHaveLength(1);
  });

  test("reports an unreadable launched file that isn't a board file", async () => {
    const launchQueue = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launchQueue.launch(inaccessibleFileHandle("notes.txt"));

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Only board files can be imported");
  });

  test("reports a file that can no longer be opened", async () => {
    const launchQueue = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launchQueue.launch(inaccessibleFileHandle("board.obz"));

    await expect
      .element(screen.getByText("Couldn't import board file", { exact: true }))
      .toBeVisible();
  });

  test("reports several files that can no longer be opened", async () => {
    const launchQueue = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launchQueue.launch(
      inaccessibleFileHandle("first.obz"),
      inaccessibleFileHandle("second.obz"),
    );

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Couldn't import board files");
  });
});
