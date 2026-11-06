import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Open settings",
  span: "flow:settings:open",
  kind: "interaction",
  run: (app) =>
    app.press(app.page.getByRole("button", { name: "Open settings" })),
});
