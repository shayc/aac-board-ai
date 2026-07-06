import { importBoardFromUrl } from "@features/board";
import { resetBoardsDB } from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { stubAudio } from "@shared/testing/stub-audio";
import { stubSpeech } from "@shared/testing/stub-speech";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { appRoutes } from "./app-routes";

const OBZ_FIXTURE_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";

async function renderApp() {
  const router = createMemoryRouter(appRoutes, { initialEntries: ["/"] });

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("app flow", () => {
  let speech: ReturnType<typeof stubSpeech>;

  beforeEach(async () => {
    speech = stubSpeech();
    stubAudio();
    await resetBoardsDB();
  });

  test("first run: imported board set opens, composes across boards, and speaks", async () => {
    await importBoardFromUrl(OBZ_FIXTURE_URL);

    const screen = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Lots of Stuff Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "No way" }).click();
    await screen.getByRole("button", { name: "living things" }).click();

    await expect
      .element(screen.getByRole("grid", { name: "Inline Images Board" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "cat" }).click();
    // Tile taps speak per-tile feedback; only the played message is asserted.
    speech.speak.mockClear();

    await screen.getByRole("button", { name: "Play message" }).click();

    await vi.waitFor(() => {
      expect(speech.speak.mock.calls).toHaveLength(1);
      expect(speech.speak.mock.calls[0][0].text).toBe("no way feline");
    });
  });

  test("empty database: imports and opens the bundled starter board", async () => {
    const screen = await renderApp();

    await screen.getByRole("button", { name: "Continue" }).click();
    await expect
      .element(screen.getByRole("grid", { name: "Quick Core 24" }))
      .toBeVisible();
  });
});
