import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "First visit (imports the starter board)",
  span: "load:app:board",
  kind: "load",
  isFirstVisit: true,
  run: (app) => app.goto("/"),
});
