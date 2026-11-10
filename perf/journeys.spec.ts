import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  measureJourney,
  type JourneySample,
  type PageProbe,
} from "./harness.ts";

const STARTER_BOARD = "First Words";
const CORE_BOARD = "Quick Core 60";
const LINKED_BOARD = "Core 60 - eat";

// The message bar has no role or name of its own; its parts sit in the element
// just before the play button.
const MESSAGE_PARTS = ':has(+ [aria-label="Play message"]) > *';

// A grid behind an open dialog or drawer is rendered but hidden from assistive
// technology, so it does not count as usable yet.
function gridSelector(boardName: string): string {
  return `[role="grid"][aria-label="${boardName}"]:not([aria-hidden="true"] *, [inert] *)`;
}

function tile(page: Page, label: string): Locator {
  return page.getByRole("gridcell").getByRole("button", {
    name: label,
    exact: true,
  });
}

async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller !== null),
    )
    .toBe(true);
}

// The starter board has 12 tiles and no symbols, so tile taps run on the
// largest bundled board set instead.
async function openCoreBoard(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Open library" }).click();
  await page.getByRole("button", { name: `Download ${CORE_BOARD}` }).click();
  await page.getByRole("link", { name: CORE_BOARD }).click({ timeout: 60_000 });
  await page.getByRole("button", { name: "Close library" }).click();
  await expect(page.getByRole("grid", { name: CORE_BOARD })).toBeVisible();
  await waitForServiceWorkerControl(page);
}

async function tapToGrid(
  sample: JourneySample,
  probe: PageProbe,
  timing: string,
  target: Locator,
  boardName: string,
): Promise<void> {
  sample.record(timing, await probe.tap(target, gridSelector(boardName)));
  await expect(probe.page.getByRole("grid", { name: boardName })).toBeVisible();
}

test("startup", async ({ browser }) => {
  await measureJourney(browser, "startup", async (sample) => {
    const firstLaunch = await sample.openPage({
      onboarding: '[role="dialog"]',
    });
    const { page } = firstLaunch;

    await firstLaunch.slowCPUDuring(async () => {
      await page.goto("/");
      sample.record("firstLaunch.toOnboarding", {
        start: 0,
        end: await firstLaunch.visibleAt("onboarding"),
      });
      await tapToGrid(
        sample,
        firstLaunch,
        "firstLaunch.continueToGrid",
        page.getByRole("button", { name: "Continue" }),
        STARTER_BOARD,
      );
    });

    await waitForServiceWorkerControl(page);
    await page.close();

    const returnVisit = await sample.openPage({
      grid: gridSelector(STARTER_BOARD),
    });

    await returnVisit.slowCPUDuring(async () => {
      await returnVisit.page.goto("/");
      sample.record("returnVisit.toGrid", {
        start: 0,
        end: await returnVisit.visibleAt("grid"),
      });
      await expect(
        returnVisit.page.getByRole("grid", { name: STARTER_BOARD }),
      ).toBeVisible();
    });
  });
});

test("tileInteraction", async ({ browser }) => {
  await measureJourney(browser, "tileInteraction", async (sample) => {
    const probe = await sample.openPage();
    const { page } = probe;
    await openCoreBoard(page);

    await probe.slowCPUDuring(async () => {
      const message: string[] = [];

      async function tapWord(word: string): Promise<void> {
        message.push(word);
        sample.record(
          "wordTap",
          await probe.tap(
            tile(page, word),
            `${MESSAGE_PARTS}:nth-child(${message.length})`,
          ),
        );
        await expect(page.locator(MESSAGE_PARTS)).toHaveText(message);
      }

      await tapWord("I");
      await tapWord("want");
      await tapWord("to");
      await tapToGrid(
        sample,
        probe,
        "openBoardToGrid",
        tile(page, "eat"),
        LINKED_BOARD,
      );
      await tapWord("drink");
      await tapToGrid(
        sample,
        probe,
        "backToGrid",
        page.getByRole("button", { name: "Go back" }),
        CORE_BOARD,
      );
    });
  });
});
