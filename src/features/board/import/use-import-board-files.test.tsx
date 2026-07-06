import { AppProviders } from "@shared/providers/app-providers";
import { zip } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import { BOARD_IMPORT_LIMITS, importBoardSets } from "./board-import";
import { useImportBoardFiles } from "./use-import-board-files";

const OBF_FIXTURE = "lots-of-stuff.obf";

function ImportTrigger({ files }: { files: File[] }) {
  const { importBoardFiles } = useImportBoardFiles();

  return (
    <button onClick={() => void importBoardFiles(files).catch(() => undefined)}>
      import
    </button>
  );
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
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board imported");
  });

  test("shows the replaced message when the set already exists", async () => {
    const file = await loadFixtureFile(OBF_FIXTURE);
    await importBoardSets(file);

    const screen = await renderImport([file]);
    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board replaced");
  });

  test("shows the too-large message when an OBZ exceeds the decompression limit", async () => {
    // Zeros compress to a tiny archive that still declares an oversized
    // uncompressed size, so the limit trips before inflation.
    const oversized = new Uint8Array(BOARD_IMPORT_LIMITS.maxEntrySize! + 1);
    const zipped = await zip(new Map([["big.bin", oversized]]));
    const file = new File([zipped as Uint8Array<ArrayBuffer>], "zip-bomb.obz", {
      type: "application/octet-stream",
    });

    const screen = await renderImport([file]);
    await screen.getByRole("button", { name: "import" }).click();

    await expect
      .element(screen.getByRole("alert"))
      .toHaveTextContent("Board is too large to import");
  });
});
