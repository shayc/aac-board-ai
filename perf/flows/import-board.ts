import { fileURLToPath } from "node:url";
import { defineFlow } from "../flow.ts";

const BOARD_FILE = fileURLToPath(
  new URL(
    "../../src/features/board/testing/sample-boards/lots-of-stuff.obz",
    import.meta.url,
  ),
);

export default defineFlow({
  title: "Import a board file from the library",
  span: "flow:library:import",
  kind: "interaction",
  isolateRuns: true,
  setup: async ({ page }) => {
    await page.getByRole("button", { name: "Open library" }).click();
    await page.getByRole("button", { name: "Import board files" }).waitFor();
  },
  run: async (app) => {
    const fileChooser = app.page.waitForEvent("filechooser");
    await app.press(
      app.page.getByRole("button", { name: "Import board files" }),
    );
    await (await fileChooser).setFiles(BOARD_FILE);
  },
});
