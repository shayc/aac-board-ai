import { expect, type Page, test } from "@playwright/test";

async function openStarterBoardSetUnderServiceWorker(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("grid", { name: "First Words" })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(
      () => page.evaluate(() => navigator.serviceWorker.controller !== null),
      { timeout: 15_000 },
    )
    .toBe(true);
}

async function expectBoardUsable(
  page: Page,
  boardName: string,
  tileName: string,
) {
  await expect(page.getByRole("grid", { name: boardName })).toBeVisible();

  const playMessageButton = page.getByRole("button", { name: "Play message" });
  await expect(playMessageButton).toBeDisabled();

  await page.getByRole("button", { name: tileName }).click();
  await expect(playMessageButton).toBeEnabled();
}

test("a stored board opens and remains usable offline", async ({
  context,
  page,
}) => {
  await openStarterBoardSetUnderServiceWorker(page);

  await page.close();
  await context.setOffline(true);

  const offlinePage = await context.newPage();
  await offlinePage.goto("/");

  await expectBoardUsable(offlinePage, "First Words", "want");
});

test("a nested board opened directly offline remains usable", async ({
  context,
  page,
}) => {
  await openStarterBoardSetUnderServiceWorker(page);
  await page.getByRole("button", { name: "food" }).click();
  await expect(page).toHaveURL(/\/boards\/food$/);
  const foodBoardURL = page.url();

  await page.close();
  await context.setOffline(true);

  const offlinePage = await context.newPage();
  await offlinePage.goto(foodBoardURL);

  await expectBoardUsable(offlinePage, "Food", "water");
});

test("a message being composed survives an offline reload", async ({
  context,
  page,
}) => {
  await openStarterBoardSetUnderServiceWorker(page);
  await page.getByRole("button", { name: "want" }).click();
  await context.setOffline(true);

  await page.reload();

  const message = page.getByRole("list", { name: "Message" });
  await expect(message.getByRole("listitem")).toHaveText(["want"]);
  await expect(message.locator("img")).toHaveJSProperty("complete", true);
  await expect(message.locator("img")).not.toHaveJSProperty("naturalWidth", 0);
});

test("deleting the last board set offline restores the starter board set", async ({
  context,
  page,
}) => {
  await openStarterBoardSetUnderServiceWorker(page);
  await context.setOffline(true);

  await page.getByRole("button", { name: "Open library" }).click();
  await page.getByRole("link", { name: "First Words" }).hover();
  await page
    .getByRole("button", { name: "More options for First Words" })
    .click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("link", { name: "First Words" })).toBeVisible();

  await page.getByRole("button", { name: "Close library" }).click();

  await expect(page.getByRole("grid", { name: "First Words" })).toBeVisible();
});
