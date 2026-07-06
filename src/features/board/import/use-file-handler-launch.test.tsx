import { AppProviders } from "@shared/providers/app-providers";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { listBoardSets } from "../storage/boards-db";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import { useFileHandlerLaunch } from "./use-file-handler-launch";

const OBF_FIXTURE = "lots-of-stuff.obf";

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

    let setId = "";
    await vi.waitFor(async () => {
      const boardSets = await listBoardSets();
      expect(boardSets).toHaveLength(1);
      setId = boardSets[0]?.setId ?? "";
      expect(setId).not.toBe("");
    });

    await expect
      .element(screen.getByTestId("path"))
      .toHaveTextContent(`/sets/${setId}/boards/`);
  });
});
