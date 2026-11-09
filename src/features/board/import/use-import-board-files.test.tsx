import { AppProviders } from "@shared/providers/app-providers";
import { zip } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router";
import { listBoardSetRecords } from "../storage/board-set-storage";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import { BOARD_IMPORT_LIMITS } from "./board-import";
import { useImportBoardFiles } from "./use-import-board-files";

const OBF_FIXTURE = "lots-of-stuff.obf";

function createCorruptBoardFile(name: string) {
  return new File(["not valid json"], name, { type: "application/json" });
}

function ImportTrigger({ files }: { files: File[] }) {
  const { importFiles } = useImportBoardFiles();

  return <button onClick={() => void importFiles(files)}>import</button>;
}

function renderImport(files: File[]) {
  return render(
    <MemoryRouter>
      <AppProviders>
        <ImportTrigger files={files} />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("useImportBoardFiles", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("shows the imported message for a fresh import", async () => {
    const file = await loadFixtureFile(OBF_FIXTURE);
    const screen = await renderImport([file]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board set imported");
  });

  test("shows the plural imported message for multiple files", async () => {
    const firstFile = await loadFixtureFile(OBF_FIXTURE);
    const secondFile = await loadFixtureFile(OBF_FIXTURE);
    const screen = await renderImport([firstFile, secondFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board sets imported");
  });

  test("imports only the board files when other files are included", async () => {
    const pdf = new File(["%PDF"], "manual.pdf", { type: "application/pdf" });
    const boardFile = await loadFixtureFile(OBF_FIXTURE);
    const screen = await renderImport([pdf, boardFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Board set imported");
  });

  test("reports an error when no file is a board file", async () => {
    const pdf = new File(["%PDF"], "manual.pdf", { type: "application/pdf" });
    const screen = await renderImport([pdf]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Only board files can be imported");
  });

  test("reports how many files failed while keeping the board sets that imported", async () => {
    const goodFile = await loadFixtureFile(OBF_FIXTURE);
    const corruptFile = createCorruptBoardFile("corrupt.obf");
    const screen = await renderImport([goodFile, corruptFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Some board files couldn't be imported (1 of 2)");
    expect(await listBoardSetRecords()).toHaveLength(1);
  });

  test("shows the failed message when every file fails", async () => {
    const screen = await renderImport([
      createCorruptBoardFile("first.obf"),
      createCorruptBoardFile("second.obf"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Couldn't import board files");
  });

  test("shows the too-large message when an OBZ exceeds the decompression limit", async () => {
    // Zeros compress to a tiny archive that still declares an oversized
    // uncompressed size, so the limit trips before inflation.
    const oversized = new Uint8Array(BOARD_IMPORT_LIMITS.maxEntrySize! + 1);
    const zipped = await zip(new Map([["big.bin", oversized]]));
    const file = new File([zipped], "zip-bomb.obz", {
      type: "application/octet-stream",
    });

    const screen = await renderImport([file]);
    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board file is too large to import");
  });
});
