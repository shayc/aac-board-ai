import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  measureJourney,
  type JourneySample,
  type PageProbe,
  type TimingMetric,
} from "./harness.ts";
import { LARGE_ROOT_BOARD, writeLargeBoardSet } from "./large-board-set.ts";

const STARTER_BOARD = "First Words";
const CORE_BOARD = "Quick Core 60";
const LINKED_BOARD = "Core 60 - eat";
const NAVIGATION_LOOP_COUNT = 10;

// The message bar has no role or name of its own; its parts sit in the element
// just before the play button.
const MESSAGE_PARTS = ':has(+ [aria-label="Play message"]) > *';

// A grid behind an open dialog or drawer is rendered but hidden from assistive
// technology, so it does not count as usable yet.
const BEHIND_MODAL = '[aria-hidden="true"] *, [inert] *';

function renderedGridSelector(boardName: string): string {
  return `[role="grid"][aria-label="${boardName}"]`;
}

function gridSelector(boardName: string): string {
  return `${renderedGridSelector(boardName)}:not(${BEHIND_MODAL})`;
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

async function openStarterBoard(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("grid", { name: STARTER_BOARD })).toBeVisible();
  await waitForServiceWorkerControl(page);
}

// The starter board has 12 tiles and no symbols, so tile journeys run on the
// largest bundled board set instead.
async function openCoreBoard(page: Page): Promise<void> {
  await openStarterBoard(page);
  await page.getByRole("button", { name: "Open library" }).click();
  await page.getByRole("button", { name: `Download ${CORE_BOARD}` }).click();
  await page.getByRole("link", { name: CORE_BOARD }).click({ timeout: 60_000 });
  await page.getByRole("button", { name: "Close library" }).click();
  await expect(page.getByRole("grid", { name: CORE_BOARD })).toBeVisible();
}

async function tapToGrid(
  sample: JourneySample,
  probe: PageProbe,
  target: Locator,
  boardName: string,
  metric: TimingMetric,
): Promise<void> {
  const tap = await probe.tap(target, gridSelector(boardName));
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
  await tapToGrid(sample, probe, back, CORE_BOARD, {
    name: `${phase}.backToGrid`,
    description: "Back tap → previous board grid rendered.",
  });
}

test("startup", async ({ browser }) => {
  await measureJourney(browser, "startup", async (sample) => {
    const firstLaunch = await sample.openPage({
      onboarding: '[role="dialog"]',
    });
    const { page } = firstLaunch;

    await sample.measure(firstLaunch, "firstLaunch", async () => {
      await page.goto("/");
      const continueTap = await firstLaunch.tap(
        page.getByRole("button", { name: "Continue" }),
        gridSelector(STARTER_BOARD),
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
        end: continueTap.visibleAt,
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
    await openCoreBoard(page);

    await sample.measure(probe, "taps", async () => {
      const message: string[] = [];

      async function tapWord(word: string): Promise<void> {
        message.push(word);
        const tap = await probe.tap(
          tile(page, word),
          `${MESSAGE_PARTS}:nth-child(${message.length})`,
        );
        await expect(page.locator(MESSAGE_PARTS)).toHaveText(message);

        await sample.recordInterval({
          name: "taps.wordTap",
          description: "Tap on a word tile → the word rendered in the message.",
          start: tap.start,
          end: tap.visibleAt,
        });
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

      // The library stays open, so the grid renders behind it.
      const renderedGrid = renderedGridSelector(LARGE_ROOT_BOARD.name);
      const openTap = await probe.tap(importedSet, renderedGrid);
      await expect(page.locator(renderedGrid)).toBeVisible();
      await sample.recordInterval({
        name: "import.openImportedToGrid",
        description:
          "Tap on the imported board set → its grid rendered behind the library.",
        start: openTap.start,
        end: openTap.visibleAt,
      });
    });
  });
});
