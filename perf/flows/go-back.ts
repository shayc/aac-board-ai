import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Go back to the previous board",
  span: "route:board:open",
  kind: "interaction",
  setup: async ({ page }) => {
    await page.getByRole("button", { name: "eat", exact: true }).click();
    await page.getByRole("grid", { name: "Core 24 - eat" }).waitFor();
  },
  run: (app) => app.press(app.page.getByRole("button", { name: "Go back" })),
});
