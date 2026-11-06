import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Play the message",
  span: "flow:message:play",
  kind: "interaction",
  setup: async ({ page }) => {
    for (const label of ["I", "want", "good"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
    }
  },
  run: (app) =>
    app.press(app.page.getByRole("button", { name: "Play message" })),
});
