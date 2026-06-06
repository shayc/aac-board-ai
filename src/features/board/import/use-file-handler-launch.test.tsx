import { AppProviders } from "@shared/providers/app-providers";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { listBoardSets } from "../storage/boards-db";
import { resetBoardsDB } from "../storage/test-helpers";
import { useFileHandlerLaunch } from "./use-file-handler-launch";

const SAMPLE_BOARDS_DIR = "/src/shared/testing/sample-boards";
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

async function loadFixtureFile(name: string): Promise<File> {
  const response = await fetch(`${SAMPLE_BOARDS_DIR}/${name}`);

  if (!response.ok) {
    throw new Error(`Failed to load test fixture: ${response.status}`);
  }

  const blob = await response.blob();

  return new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
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
});
