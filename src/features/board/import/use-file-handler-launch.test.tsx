import { AppProviders } from "@shared/providers/app-providers";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { listBoardSets } from "../storage/boards-db";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import { useFileHandlerLaunch } from "./use-file-handler-launch";

const OBF_FIXTURE = "lots-of-stuff.obf";
const IMPORTED_SET_ID = "lots-of-stuff";

function LaunchHarness() {
  useFileHandlerLaunch();

  return <div data-testid="path">{useLocation().pathname}</div>;
}

function stubLaunchQueue() {
  let consumer: ((params: LaunchParams) => void) | undefined;

  vi.stubGlobal("launchQueue", {
    setConsumer: (next: (params: LaunchParams) => void) => {
      consumer = next;
    },
  });

  return (...files: FileSystemFileHandle[]) => consumer?.({ files });
}

function fileHandle(file: File): FileSystemFileHandle {
  return { getFile: () => Promise.resolve(file) } as FileSystemFileHandle;
}

function inaccessibleFileHandle(): FileSystemFileHandle {
  return {
    getFile: () => Promise.reject(new DOMException("Access denied")),
  } as FileSystemFileHandle;
}

function renderLaunchHandler() {
  return render(
    <AppProviders>
      <MemoryRouter>
        <LaunchHarness />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe("useFileHandlerLaunch", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("does nothing when the browser has no launch queue", async () => {
    vi.stubGlobal("launchQueue", undefined);

    const screen = await renderLaunchHandler();

    expect(await listBoardSets()).toHaveLength(0);
    await expect.element(screen.getByTestId("path")).toHaveTextContent(/^\/$/);
  });

  test("imports only the board files and opens the result", async () => {
    const launch = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launch(
      fileHandle(new File([""], "notes.txt")),
      fileHandle(await loadFixtureFile(OBF_FIXTURE)),
    );

    await vi.waitFor(async () => {
      const boardSets = await listBoardSets();
      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]?.setId).toBe(IMPORTED_SET_ID);
    });

    await expect
      .element(screen.getByTestId("path"))
      .toHaveTextContent(`/sets/${IMPORTED_SET_ID}/boards/`);
  });

  test("reports a file that can no longer be opened", async () => {
    const launch = stubLaunchQueue();
    const screen = await renderLaunchHandler();

    launch(inaccessibleFileHandle());

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Couldn't import board");
  });
});
