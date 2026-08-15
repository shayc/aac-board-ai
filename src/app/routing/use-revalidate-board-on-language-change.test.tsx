import { LanguageProvider } from "@shared/language/language-provider";
import { setStoredLanguage } from "@shared/language/language-store";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { useRevalidateBoardOnLanguageChange } from "./use-revalidate-board-on-language-change";

function Probe() {
  useRevalidateBoardOnLanguageChange();

  return <p>probe ready</p>;
}

function TestHydrateFallback() {
  return null;
}

describe("useRevalidateBoardOnLanguageChange", () => {
  test("re-runs route loaders only when the language actually changes", async () => {
    setStoredLanguage("en");
    const loader = vi.fn(() => null);
    const router = createMemoryRouter([
      {
        path: "/",
        element: <Probe />,
        loader,
        HydrateFallback: TestHydrateFallback,
      },
    ]);

    const screen = await render(
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>,
    );

    await expect.element(screen.getByText("probe ready")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(1);

    setStoredLanguage("en");
    // Flush a render round trip so a wrongly-triggered revalidation would land.
    await expect.element(screen.getByText("probe ready")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(1);

    setStoredLanguage("es");

    await vi.waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(2);
    });

    setStoredLanguage("fr");

    await vi.waitFor(() => {
      expect(loader).toHaveBeenCalledTimes(3);
    });
  });
});
