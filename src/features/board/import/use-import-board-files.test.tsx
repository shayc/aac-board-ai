import { AppProviders } from "@shared/providers/app-providers";
import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { MemoryRouter } from "react-router";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import { importBoardSets } from "./board-import";
import { useImportBoardFiles } from "./use-import-board-files";

const OBF_FIXTURE = "lots-of-stuff.obf";

function ImportTrigger({ files }: { files: File[] }) {
  const { importBoardFiles } = useImportBoardFiles();

  return <button onClick={() => void importBoardFiles(files)}>import</button>;
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
});
