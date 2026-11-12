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

test("a stored board opens and remains usable offline", async ({
  context,
  page,
}) => {
  await openStarterBoardSetUnderServiceWorker(page);

  await page.close();
  await context.setOffline(true);

  const offlinePage = await context.newPage();
  await offlinePage.goto("/");

  await expect(
    offlinePage.getByRole("grid", { name: "First Words" }),
  ).toBeVisible();

  const playMessageButton = offlinePage.getByRole("button", {
    name: "Play message",
  });
  await expect(playMessageButton).toBeDisabled();

  await offlinePage.getByRole("button", { name: "want" }).click();
  await expect(playMessageButton).toBeEnabled();
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
