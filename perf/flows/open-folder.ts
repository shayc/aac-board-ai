import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Open a folder tile",
  span: "route:board:open",
  kind: "interaction",
  run: (app) =>
    app.press(app.page.getByRole("button", { name: "eat", exact: true })),
});
