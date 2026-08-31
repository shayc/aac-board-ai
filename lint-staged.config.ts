import { defineConfig } from "lint-staged/config";

export default defineConfig({
  "*.{ts,tsx}": [
    "oxlint --fix --no-error-on-unmatched-pattern",
    "oxfmt --no-error-on-unmatched-pattern",
  ],
  "!(*.{ts,tsx})": "oxfmt --no-error-on-unmatched-pattern",
});
