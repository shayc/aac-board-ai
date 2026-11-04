import { LanguageProvider } from "@shared/language/language-provider";
import {
  getStoredLanguage,
  setStoredLanguage,
} from "@shared/language/language-store";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { useRevalidateOnLanguageChange } from "./use-revalidate-on-language-change";

function Probe() {
  useRevalidateOnLanguageChange();

  return <p>probe ready</p>;
}

function TestHydrateFallback() {
  return null;
}

describe("useRevalidateOnLanguageChange", () => {
  test("re-runs route loaders once per language change, never on mount", async () => {
    setStoredLanguage("en");
    const loadedLanguages: string[] = [];
    const router = createMemoryRouter([
      {
        path: "/",
        element: <Probe />,
        loader: () => {
          loadedLanguages.push(getStoredLanguage());
          return null;
        },
        HydrateFallback: TestHydrateFallback,
      },
    ]);

    const screen = await render(
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>,
    );
    await expect.element(screen.getByText("probe ready")).toBeInTheDocument();

    setStoredLanguage("es");
    await expect.poll(() => loadedLanguages).toEqual(["en", "es"]);

    setStoredLanguage("fr");
    await expect.poll(() => loadedLanguages).toEqual(["en", "es", "fr"]);
  });
});
