import { expect, test } from "@playwright/test";

test("a stored board opens and remains usable offline", async ({
  context,
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("grid", { name: "Quick Core 24" })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(
      () => page.evaluate(() => navigator.serviceWorker.controller !== null),
      { timeout: 15_000 },
    )
    .toBe(true);

  await page.close();
  await context.setOffline(true);

  const offlinePage = await context.newPage();
  await offlinePage.goto("/");

  await expect(
    offlinePage.getByRole("grid", { name: "Quick Core 24" }),
  ).toBeVisible();

  const playMessageButton = offlinePage.getByRole("button", {
    name: "Play message",
  });
  await expect(playMessageButton).toBeDisabled();

  await offlinePage.getByRole("button", { name: "want" }).click();
  await expect(playMessageButton).toBeEnabled();
});
