import { renderWithProviders } from "@shared/testing/render-with-providers";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { rootBoardPath } from "../board-paths";
import { listBoardSetRecords } from "../storage/board-set-storage";
import {
  loadFixtureFile,
  makeCorruptBoardFile,
  makeOversizedOBZ,
  resetBoardsDB,
  SAMPLE_BOARD_SET_ID,
  SAMPLE_OBF_FILE,
} from "../testing";
import { useImportBoardFiles } from "./use-import-board-files";

function ImportTrigger({ files }: { files: File[] }) {
  const { importAndOpen } = useImportBoardFiles();

  return <button onClick={() => void importAndOpen(files)}>import</button>;
}

function PickTrigger() {
  const { pickAndImport } = useImportBoardFiles();

  return (
    <>
      <button onClick={() => void pickAndImport()}>pick</button>
      <div data-testid="path">{useLocation().pathname}</div>
    </>
  );
}

// The native file picker can't open in the test runtime; this picks the files.
function stubFilePicker(...files: File[]) {
  vi.spyOn(HTMLInputElement.prototype, "showPicker").mockImplementation(
    function (this: HTMLInputElement) {
      const dataTransfer = new DataTransfer();

      for (const file of files) {
        dataTransfer.items.add(file);
      }

      this.files = dataTransfer.files;
      this.dispatchEvent(new Event("change"));
    },
  );
}

function renderImport(files: File[]) {
  return renderWithProviders(
    <MemoryRouter>
      <ImportTrigger files={files} />
    </MemoryRouter>,
  );
}

describe("useImportBoardFiles", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("shows the imported message for a fresh import", async () => {
    const file = await loadFixtureFile(SAMPLE_OBF_FILE);
    const screen = await renderImport([file]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board set imported");
  });

  test("shows the plural imported message for multiple files", async () => {
    const firstFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const secondFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const screen = await renderImport([firstFile, secondFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board sets imported");
  });

  test("imports only the board files when other files are included", async () => {
    const pdf = new File(["%PDF"], "manual.pdf", { type: "application/pdf" });
    const boardFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const screen = await renderImport([pdf, boardFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board set imported");
  });

  test("reports an error when the only file isn't a board file", async () => {
    const pdf = new File(["%PDF"], "manual.pdf", { type: "application/pdf" });
    const screen = await renderImport([pdf]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Only board files can be imported");
  });

  test("reports an error when several files aren't board files", async () => {
    const pdf = new File(["%PDF"], "manual.pdf", { type: "application/pdf" });
    const folder = new File([], "Boards");
    const screen = await renderImport([pdf, folder]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Only board files can be imported");
  });

  test("reports an error when a single import fails", async () => {
    const screen = await renderImport([makeCorruptBoardFile("corrupt.obf")]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(
        screen
          .getByRole("alert")
          .getByText("Couldn't import board file", { exact: true }),
      )
      .toBeVisible();
  });

  test("reports a single failure while keeping the board sets that imported", async () => {
    const goodFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const corruptFile = makeCorruptBoardFile("corrupt.obf");
    const screen = await renderImport([goodFile, corruptFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(
        screen
          .getByRole("alert")
          .getByText("Couldn't import board file", { exact: true }),
      )
      .toBeVisible();
    expect(await listBoardSetRecords()).toHaveLength(1);
  });

  test("leaves skipped files out of the failures it reports", async () => {
    const pdf = new File(["%PDF"], "manual.pdf", { type: "application/pdf" });
    const goodFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const corruptFile = makeCorruptBoardFile("corrupt.obf");
    const screen = await renderImport([pdf, goodFile, corruptFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(
        screen
          .getByRole("alert")
          .getByText("Couldn't import board file", { exact: true }),
      )
      .toBeVisible();
  });

  test("reports how many files failed when several fail alongside imports", async () => {
    const goodFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const screen = await renderImport([
      goodFile,
      makeCorruptBoardFile("first.obf"),
      makeCorruptBoardFile("second.obf"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Couldn't import some board files (2 of 3)");
  });

  test("shows the failed message when every file fails", async () => {
    const screen = await renderImport([
      makeCorruptBoardFile("first.obf"),
      makeCorruptBoardFile("second.obf"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Couldn't import board files");
  });

  test("reports a file that exceeds the decompression limit", async () => {
    const screen = await renderImport([await makeOversizedOBZ("zip-bomb.obz")]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board file is too large to import");
  });

  test("keeps the too-large reason when another file imports", async () => {
    const goodFile = await loadFixtureFile(SAMPLE_OBF_FILE);
    const screen = await renderImport([
      goodFile,
      await makeOversizedOBZ("zip-bomb.obz"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board file is too large to import");
    expect(await listBoardSetRecords()).toHaveLength(1);
  });

  test("shows the too-large message when every file exceeds the decompression limit", async () => {
    const screen = await renderImport([
      await makeOversizedOBZ("first.obz"),
      await makeOversizedOBZ("second.obz"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board files are too large to import");
  });

  test("opens the board set picked from the file picker", async () => {
    stubFilePicker(await loadFixtureFile(SAMPLE_OBF_FILE));
    const screen = await renderWithProviders(
      <MemoryRouter>
        <PickTrigger />
      </MemoryRouter>,
    );

    await screen.getByRole("button", { name: "pick" }).click();

    await expect.element(screen.getByTestId("path")).toHaveTextContent(
      rootBoardPath({
        id: SAMPLE_BOARD_SET_ID,
        rootBoardId: "lots_of_stuff",
      }),
    );
  });
});
