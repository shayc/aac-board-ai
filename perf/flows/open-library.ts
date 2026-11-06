import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Open the library",
  span: "flow:library:open",
  kind: "interaction",
  run: (app) =>
    app.press(app.page.getByRole("button", { name: "Open library" })),
});
