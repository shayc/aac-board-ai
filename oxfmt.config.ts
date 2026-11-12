import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  sortImports: {
    groups: [
      ["builtin", "external", "internal", "subpath"],
      "parent",
      ["sibling", "index"],
    ],
    newlinesBetween: false,
  },
});
