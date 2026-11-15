import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { afterEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import {
  queueBoardTranslationPass,
  stopBoardTranslation,
} from "./board-translation-coordinator";
import { BoardTranslationNotice } from "./board-translation-notice";

function renderNotice() {
  return render(
    <AppProviders>
      <BoardTranslationNotice />
    </AppProviders>,
  );
}

describe("BoardTranslationNotice", () => {
  afterEach(stopBoardTranslation);

  test("shows nothing while no pass has left boards untranslated", async () => {
    const screen = await renderNotice();

    await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
  });

  test("announces boards that will stay in their original language with no accessibility violations", async () => {
    const screen = await renderNotice();

    queueBoardTranslationPass("es", () => Promise.resolve("incomplete"));

    await expect
      .element(screen.getByRole("status"))
      .toHaveTextContent("Some boards will stay in their original language.");

    await expectNoA11yViolations(screen.container);
  });
});
