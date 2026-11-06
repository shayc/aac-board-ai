import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Repeat visit (board from IndexedDB)",
  span: "load:app:board",
  kind: "load",
  run: (app) => app.goto("/"),
});
