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

// Zeros compress to a tiny archive that still declares an oversized
// uncompressed size, so the limit trips before inflation.
async function createOversizedOBZ(name: string) {
  const oversized = new Uint8Array(BOARD_IMPORT_LIMITS.maxEntrySize! + 1);
  const zipped = await zip(new Map([["big.bin", oversized]]));

  return new File([zipped], name, { type: "application/octet-stream" });
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

  test("names the file when a single import fails", async () => {
    const screen = await renderImport([createCorruptBoardFile("corrupt.obf")]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent('Couldn\'t import board file "corrupt.obf"');
  });

  test("names the failed file while keeping the board sets that imported", async () => {
    const goodFile = await loadFixtureFile(OBF_FIXTURE);
    const corruptFile = createCorruptBoardFile("corrupt.obf");
    const screen = await renderImport([goodFile, corruptFile]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent('Couldn\'t import board file "corrupt.obf"');
    expect(await listBoardSetRecords()).toHaveLength(1);
  });

  test("reports how many files failed when several fail alongside imports", async () => {
    const goodFile = await loadFixtureFile(OBF_FIXTURE);
    const screen = await renderImport([
      goodFile,
      createCorruptBoardFile("first.obf"),
      createCorruptBoardFile("second.obf"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Some board files couldn't be imported (2 of 3)");
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

  test("names the file when it exceeds the decompression limit", async () => {
    const screen = await renderImport([
      await createOversizedOBZ("zip-bomb.obz"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent('Board file "zip-bomb.obz" is too large to import');
  });

  test("shows the too-large message when every file exceeds the decompression limit", async () => {
    const screen = await renderImport([
      await createOversizedOBZ("first.obz"),
      await createOversizedOBZ("second.obz"),
    ]);

    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board files are too large to import");
  });
});
