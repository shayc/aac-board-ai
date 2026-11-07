import { expect, test, type Locator, type Page } from "@playwright/test";
import { measureJourney, type PageProbe } from "./harness.ts";
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

async function openLinkedBoard(probe: PageProbe, phase: string): Promise<void> {
  const open = await probe.tap(tile(probe.page, "eat"), {
    until: gridSelector(LINKED_BOARD),
  });
  await expect(
    probe.page.getByRole("grid", { name: LINKED_BOARD }),
  ).toBeVisible();

  await probe.recordInterval(
    `${phase}.openBoardToGrid`,
    open.start,
    open.visibleAt,
  );
}

async function goBack(probe: PageProbe, phase: string): Promise<void> {
  const back = await probe.tap(
    probe.page.getByRole("button", { name: "Go back" }),
    { until: gridSelector(STARTER_BOARD) },
  );
  await expect(
    probe.page.getByRole("grid", { name: STARTER_BOARD }),
  ).toBeVisible();

  await probe.recordInterval(`${phase}.backToGrid`, back.start, back.visibleAt);
}

test("startup", async ({ browser }) => {
  await measureJourney(browser, "startup", async (sample) => {
    const firstLaunch = await sample.openPage({
      onboarding: '[role="dialog"]',
      grid: gridSelector(STARTER_BOARD),
    });
    const { page } = firstLaunch;

    await firstLaunch.measure("firstLaunch", async () => {
      await page.goto("/");
      const continueTap = await firstLaunch.tap(
        page.getByRole("button", { name: "Continue" }),
      );
      await expect(
        page.getByRole("grid", { name: STARTER_BOARD }),
      ).toBeVisible();

      await firstLaunch.recordInterval(
        "firstLaunch.toOnboarding",
        0,
        await firstLaunch.visibleAt("onboarding"),
      );
      await firstLaunch.recordInterval(
        "firstLaunch.continueToGrid",
        continueTap.start,
        await firstLaunch.visibleAt("grid"),
      );
      await firstLaunch.recordPaints("firstLaunch");
    });

    await waitForServiceWorkerControl(page);
    await page.close();

    const returnVisit = await sample.openPage({
      grid: gridSelector(STARTER_BOARD),
    });

    await returnVisit.measure("returnVisit", async () => {
      await returnVisit.page.goto("/");
      await expect(
        returnVisit.page.getByRole("grid", { name: STARTER_BOARD }),
      ).toBeVisible();

      await returnVisit.recordInterval(
        "returnVisit.toGrid",
        0,
        await returnVisit.visibleAt("grid"),
      );
      await returnVisit.recordPaints("returnVisit");
    });
  });
});

test("tileInteraction", async ({ browser }) => {
  await measureJourney(browser, "tileInteraction", async (sample) => {
    const probe = await sample.openPage();
    const { page } = probe;
    await openStarterBoard(page);

    await probe.measure("taps", async () => {
      const message: string[] = [];

      async function tapWord(word: string): Promise<void> {
        await probe.recordTap(
          "taps.wordTap",
          await probe.tap(tile(page, word)),
        );
        message.push(word);
        await expect(messageParts(page)).toHaveText(message);
      }

      await tapWord("I");
      await tapWord("want");
      await tapWord("to");
      await openLinkedBoard(probe, "taps");
      await tapWord("drink");
      await goBack(probe, "taps");
    });

    const start = await probe.readMemory();
    await probe.measure("navigationLoop", async () => {
      for (let index = 0; index < NAVIGATION_LOOP_COUNT; index += 1) {
        await openLinkedBoard(probe, "navigationLoop");
        await goBack(probe, "navigationLoop");
      }
    });
    probe.recordMemoryGrowth("navigationLoop", start, await probe.readMemory());
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

    await probe.measure("import", async () => {
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
      await probe.recordInterval(
        "import.filesChosenToListed",
        filesChosenAt,
        await probe.visibleAt("listed"),
      );

      const open = await probe.tap(importedSet, {
        until: gridSelector(LARGE_ROOT_BOARD.name),
      });
      await expect(
        page.getByRole("grid", { name: LARGE_ROOT_BOARD.name }),
      ).toBeVisible();
      await probe.recordInterval(
        "import.openImportedToGrid",
        open.start,
        open.visibleAt,
      );
    });
  });
});
