import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Add a tile to the message",
  span: "flow:message:add-tile",
  kind: "interaction",
  run: (app) =>
    app.press(app.page.getByRole("button", { name: "want", exact: true })),
});
