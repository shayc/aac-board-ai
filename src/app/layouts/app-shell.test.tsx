import { AppProviders } from "@shared/providers/app-providers";
import { stubProofreader, stubRewriter } from "@shared/testing/built-in-ai";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AppShell } from "./app-shell";

function renderAppShell() {
  const router = createMemoryRouter([
    {
      element: <AppShell />,
      children: [{ path: "/", element: <p>page content</p> }],
    },
  ]);

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe("AppShell", () => {
  test("dismissing onboarding warms up the suggestion models", async () => {
    const proofreader = stubProofreader();
    const rewriter = stubRewriter();

    const screen = await renderAppShell();

    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .toBeVisible();

    await screen.getByRole("button", { name: "Continue" }).click();

    await vi.waitFor(() => {
      expect(proofreader.create).toHaveBeenCalledOnce();
      expect(rewriter.create).toHaveBeenCalledOnce();
    });
    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .not.toBeInTheDocument();

    // The dismissal persists on a debounce after this test ends, and test
    // files share localStorage. Wait it out and clear, or the flag leaks
    // into other files' import-time store reads.
    await vi.waitFor(() => {
      expect(localStorage.getItem("hasSeenOnboarding")).toBe("true");
    });
    localStorage.clear();
  });
});
