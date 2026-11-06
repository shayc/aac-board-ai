import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Move tile labels (settings)",
  span: "flow:settings:label-placement",
  kind: "interaction",
  setup: async ({ page }) => {
    await page.getByRole("button", { name: "Open settings" }).click();
    await page.getByRole("radio", { name: "Bottom" }).waitFor();
  },
  run: (app) => app.press(app.page.getByRole("radio", { name: "Bottom" })),
});
