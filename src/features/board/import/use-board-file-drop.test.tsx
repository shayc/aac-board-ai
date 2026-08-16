import { AppProviders } from "@shared/providers/app-providers";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { rootBoardPath } from "../navigation/board-paths";
import { listBoardSets } from "../storage/board-set-storage";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import { useBoardFileDrop } from "./use-board-file-drop";

const OBF_FIXTURE = "lots-of-stuff.obf";
const IMPORTED_SET_ID = "lots-of-stuff";

function DropHarness() {
  const { isDraggingFiles, dropHandlers } = useBoardFileDrop();

  return (
    <>
      <div data-testid="zone" {...dropHandlers}>
        {isDraggingFiles ? "active" : "idle"}
      </div>
      <div data-testid="path">{useLocation().pathname}</div>
    </>
  );
}

async function renderDropZone() {
  const screen = await render(
    <AppProviders>
      <MemoryRouter>
        <DropHarness />
      </MemoryRouter>
    </AppProviders>,
  );

  return { screen, zone: screen.getByTestId("zone").element() };
}

function dataTransferWithFiles(...files: File[]): DataTransfer {
  const dataTransfer = new DataTransfer();

  for (const file of files) {
    dataTransfer.items.add(file);
  }

  return dataTransfer;
}

function fireDrag(
  target: Element,
  type: "dragenter" | "dragover" | "dragleave" | "drop",
  dataTransfer: DataTransfer,
  relatedTarget: EventTarget | null = null,
) {
  target.dispatchEvent(
    new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer,
      relatedTarget,
    }),
  );
}

describe("useBoardFileDrop", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("shows the overlay while files are dragged over and hides it on drop", async () => {
    const { zone } = await renderDropZone();
    const dataTransfer = dataTransferWithFiles(new File([""], "notes.txt"));

    fireDrag(zone, "dragenter", dataTransfer);
    await expect.element(zone).toHaveTextContent("active");

    fireDrag(zone, "drop", dataTransfer);
    await expect.element(zone).toHaveTextContent("idle");
  });

  test("ignores drags that carry no files", async () => {
    const { zone } = await renderDropZone();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", "hello");

    fireDrag(zone, "dragenter", dataTransfer);

    await expect.element(zone).toHaveTextContent("idle");
  });

  test("stays visible while crossing nested elements (no flicker)", async () => {
    const { zone } = await renderDropZone();
    const dataTransfer = dataTransferWithFiles(new File([""], "notes.txt"));
    const insideApp = zone;

    fireDrag(zone, "dragenter", dataTransfer);
    fireDrag(zone, "dragenter", dataTransfer);
    await expect.element(zone).toHaveTextContent("active");

    fireDrag(zone, "dragleave", dataTransfer, insideApp);
    await expect.element(zone).toHaveTextContent("active");

    fireDrag(zone, "dragleave", dataTransfer, insideApp);
    await expect.element(zone).toHaveTextContent("idle");
  });

  test("hides immediately when the drag leaves the window", async () => {
    const { zone } = await renderDropZone();
    const dataTransfer = dataTransferWithFiles(new File([""], "notes.txt"));
    const leftWindow = null;

    fireDrag(zone, "dragenter", dataTransfer);
    fireDrag(zone, "dragenter", dataTransfer);
    await expect.element(zone).toHaveTextContent("active");

    fireDrag(zone, "dragleave", dataTransfer, leftWindow);
    await expect.element(zone).toHaveTextContent("idle");
  });

  test("imports a dropped board file and opens it", async () => {
    const { zone, screen } = await renderDropZone();
    const boardFile = await loadFixtureFile(OBF_FIXTURE);

    fireDrag(zone, "drop", dataTransferWithFiles(boardFile));

    await vi.waitFor(async () => {
      const boardSets = await listBoardSets();
      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]?.setId).toBe(IMPORTED_SET_ID);
    });

    await expect.element(screen.getByTestId("path")).toHaveTextContent(
      rootBoardPath({
        setId: IMPORTED_SET_ID,
        rootBoardId: "lots_of_stuff",
      }),
    );
  });
});
