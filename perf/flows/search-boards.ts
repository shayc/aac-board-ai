import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Search boards and open a match",
  span: "route:board:open",
  kind: "interaction",
  run: async (app) => {
    await app.press(app.page.getByRole("combobox", { name: "Board" }));
    await app.type("tell");
    await app.page.getByRole("option", { name: "Core 24 - tell" }).waitFor();
    await app.page.keyboard.press("Enter");
  },
});
