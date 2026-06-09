import { describe, expect, test, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { render } from "vitest-browser-react";
import { LanguageProvider } from "./language-provider";
import { setStoredLanguage } from "./language-store";
import { useRevalidateOnLanguageChange } from "./use-revalidate-on-language-change";

function Probe() {
  useRevalidateOnLanguageChange();

  return <p>probe ready</p>;
}

describe("useRevalidateOnLanguageChange", () => {
  test("re-runs route loaders only when the language actually changes", async () => {
    setStoredLanguage("en");
    const loader = vi.fn(() => null);
    const router = createMemoryRouter([
      { path: "/", element: <Probe />, loader },
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
