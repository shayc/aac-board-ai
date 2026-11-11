import { beforeEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { DocumentLanguage } from "./document-language";
import { DEFAULT_LANGUAGE, setStoredLanguage } from "./language-store";

beforeEach(() => {
  setStoredLanguage(DEFAULT_LANGUAGE);
});

describe("DocumentLanguage", () => {
  test("declares the chosen language when the interface is translated into it", async () => {
    await render(<DocumentLanguage />);

    setStoredLanguage("he");

    await expect
      .element(document.documentElement)
      .toHaveAttribute("lang", "he");
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
  });

  test("declares English when the chosen language has no interface translation", async () => {
    await render(<DocumentLanguage />);

    setStoredLanguage("ca");

    await expect
      .element(document.documentElement)
      .toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
