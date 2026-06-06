import { AppProviders } from "@shared/providers/app-providers";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { listBoardSets } from "../storage/boards-db";
import { resetBoardsDB } from "../storage/test-helpers";
import { useBoardFileDrop } from "./use-board-file-drop";

const SAMPLE_BOARDS_DIR = "/src/shared/testing/sample-boards";
const OBF_FIXTURE = "lots-of-stuff.obf";
const IMPORTED_SET_ID = "lots-of-stuff";

function DropHarness() {
  const { isDraggingFiles, dropHandlers } = useBoardFileDrop();

  return (
    <div data-testid="zone" {...dropHandlers}>
      {isDraggingFiles ? "active" : "idle"}
    </div>
  );
}

async function renderDropZone() {
  const screen = await render(
    <AppProviders>
      <DropHarness />
    </AppProviders>,
  );

  return screen.getByTestId("zone").element();
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

describe("useBoardFileDrop", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("shows the overlay while files are dragged over and hides it on drop", async () => {
    const zone = await renderDropZone();
    const dataTransfer = dataTransferWithFiles(new File([""], "notes.txt"));

    fireDrag(zone, "dragenter", dataTransfer);
    await expect.element(zone).toHaveTextContent("active");

    fireDrag(zone, "drop", dataTransfer);
    await expect.element(zone).toHaveTextContent("idle");
  });

  test("ignores drags that carry no files", async () => {
    const zone = await renderDropZone();
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text/plain", "hello");

    fireDrag(zone, "dragenter", dataTransfer);

    await expect.element(zone).toHaveTextContent("idle");
  });

  test("stays visible while crossing nested elements (no flicker)", async () => {
    const zone = await renderDropZone();
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
    const zone = await renderDropZone();
    const dataTransfer = dataTransferWithFiles(new File([""], "notes.txt"));
    const leftWindow = null;

    fireDrag(zone, "dragenter", dataTransfer);
    fireDrag(zone, "dragenter", dataTransfer);
    await expect.element(zone).toHaveTextContent("active");

    fireDrag(zone, "dragleave", dataTransfer, leftWindow);
    await expect.element(zone).toHaveTextContent("idle");
  });

  test("imports a dropped board file", async () => {
    const zone = await renderDropZone();
    const boardFile = await loadFixtureFile(OBF_FIXTURE);

    fireDrag(zone, "drop", dataTransferWithFiles(boardFile));

    await vi.waitFor(async () => {
      const boardSets = await listBoardSets();
      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]?.setId).toBe(IMPORTED_SET_ID);
    });
  });
});
