import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  measureJourney,
  type JourneySample,
  type PageProbe,
  type TimingMetric,
} from "./harness.ts";
import { LARGE_ROOT_BOARD, writeLargeBoardSet } from "./large-board-set.ts";

const STARTER_BOARD = "Quick Core 24";
const LINKED_BOARD = "Core 24 - eat";
const NAVIGATION_LOOP_COUNT = 10;

function gridSelector(boardName: string): string {
  return `[role="grid"][aria-label="${boardName}"]`;
}

function tile(page: Page, label: string): Locator {
  return page.getByRole("gridcell").getByRole("button", {
    name: label,
    exact: true,
  });
}

function messageParts(page: Page): Locator {
  return page
    .getByRole("button", { name: "Play message" })
    .locator("xpath=preceding-sibling::*[1]/*");
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

async function openStarterBoard(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("grid", { name: STARTER_BOARD })).toBeVisible();
  await waitForServiceWorkerControl(page);
}

async function tapToGrid(
  sample: JourneySample,
  probe: PageProbe,
  target: Locator,
  boardName: string,
  metric: TimingMetric,
): Promise<void> {
  const tap = await probe.tap(target, { until: gridSelector(boardName) });
  await expect(probe.page.getByRole("grid", { name: boardName })).toBeVisible();

  await sample.recordInterval({
    ...metric,
    start: tap.start,
    end: tap.visibleAt,
  });
}

async function openLinkedBoard(
  sample: JourneySample,
  probe: PageProbe,
  phase: string,
): Promise<void> {
  await tapToGrid(sample, probe, tile(probe.page, "eat"), LINKED_BOARD, {
    name: `${phase}.openBoardToGrid`,
    description: "Tap on a linking tile → linked board grid rendered.",
  });
}

async function goBack(
  sample: JourneySample,
  probe: PageProbe,
  phase: string,
): Promise<void> {
  const back = probe.page.getByRole("button", { name: "Go back" });
  await tapToGrid(sample, probe, back, STARTER_BOARD, {
    name: `${phase}.backToGrid`,
    description: "Back tap → previous board grid rendered.",
  });
}

test("startup", async ({ browser }) => {
  await measureJourney(browser, "startup", async (sample) => {
    const firstLaunch = await sample.openPage({
      onboarding: '[role="dialog"]',
      grid: gridSelector(STARTER_BOARD),
    });
    const { page } = firstLaunch;

    await sample.measure(firstLaunch, "firstLaunch", async () => {
      await page.goto("/");
      const continueTap = await firstLaunch.tap(
        page.getByRole("button", { name: "Continue" }),
      );
      await expect(
        page.getByRole("grid", { name: STARTER_BOARD }),
      ).toBeVisible();

      await sample.recordInterval({
        name: "firstLaunch.toOnboarding",
        description: "Navigation start → onboarding dialog rendered.",
        start: 0,
        end: await firstLaunch.visibleAt("onboarding"),
      });
      await sample.recordInterval({
        name: "firstLaunch.continueToGrid",
        description:
          "Continue tap → starter board grid rendered and exposed to assistive technology.",
        start: continueTap.start,
        end: await firstLaunch.visibleAt("grid"),
      });
      await sample.recordPaints(firstLaunch, "firstLaunch");
    });

    await waitForServiceWorkerControl(page);
    await page.close();

    const returnVisit = await sample.openPage({
      grid: gridSelector(STARTER_BOARD),
    });

    await sample.measure(returnVisit, "returnVisit", async () => {
      await returnVisit.page.goto("/");
      await expect(
        returnVisit.page.getByRole("grid", { name: STARTER_BOARD }),
      ).toBeVisible();

      await sample.recordInterval({
        name: "returnVisit.toGrid",
        description:
          "Navigation start → grid rendered, from the service worker and stored boards.",
        start: 0,
        end: await returnVisit.visibleAt("grid"),
      });
      await sample.recordPaints(returnVisit, "returnVisit");
    });
  });
});

test("tileInteraction", async ({ browser }) => {
  await measureJourney(browser, "tileInteraction", async (sample) => {
    const probe = await sample.openPage();
    const { page } = probe;
    await openStarterBoard(page);

    await sample.measure(probe, "taps", async () => {
      const message: string[] = [];

      async function tapWord(word: string): Promise<void> {
        await sample.recordTap(
          {
            name: "taps.wordTap",
            description:
              "Event Timing duration of a word tile tap: input delay + processing + next paint, in 8 ms steps, never below 16 ms.",
          },
          await probe.tap(tile(page, word)),
        );
        message.push(word);
        await expect(messageParts(page)).toHaveText(message);
      }

      await tapWord("I");
      await tapWord("want");
      await tapWord("to");
      await openLinkedBoard(sample, probe, "taps");
      await tapWord("drink");
      await goBack(sample, probe, "taps");
    });

    const start = await probe.readMemory();
    await sample.measure(probe, "navigationLoop", async () => {
      for (let index = 0; index < NAVIGATION_LOOP_COUNT; index += 1) {
        await openLinkedBoard(sample, probe, "navigationLoop");
        await goBack(sample, probe, "navigationLoop");
      }
    });
    sample.recordMemoryGrowth(
      "navigationLoop",
      start,
      await probe.readMemory(),
    );
  });
});

test("largeImport", async ({ browser }) => {
  const boardSetFile = await writeLargeBoardSet();
  const boardSetLink = `a[href="/sets/large-board-set/boards/${LARGE_ROOT_BOARD.id}"]`;

  await measureJourney(browser, "largeImport", async (sample) => {
    const probe = await sample.openPage();
    const { page } = probe;
    await openStarterBoard(page);
    await page.getByRole("button", { name: "Open library" }).click();

    await sample.measure(probe, "import", async () => {
      await probe.watch("listed", boardSetLink);
      const fileChooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Import board files" }).click();
      const filesChosenAt = await probe.chooseFiles(
        await fileChooser,
        boardSetFile,
      );

      const importedSet = page.getByRole("link", {
        name: LARGE_ROOT_BOARD.name,
      });
      await expect(importedSet).toBeVisible({ timeout: 60_000 });
      await sample.recordInterval({
        name: "import.filesChosenToListed",
        description: "File chosen → imported board set listed in the library.",
        start: filesChosenAt,
        end: await probe.visibleAt("listed"),
      });

      await tapToGrid(sample, probe, importedSet, LARGE_ROOT_BOARD.name, {
        name: "import.openImportedToGrid",
        description: "Tap on the imported board set → its grid rendered.",
      });
    });
  });
});
