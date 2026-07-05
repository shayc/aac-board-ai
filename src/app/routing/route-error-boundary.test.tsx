import { createMemoryRouter, data } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { RouteErrorBoundary } from "./route-error-boundary";

function renderWithLoader(loader: () => never) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        loader,
        ErrorBoundary: RouteErrorBoundary,
      },
    ],
    { initialEntries: ["/"] },
  );

  return render(<RouterProvider router={router} />);
}

describe("RouteErrorBoundary", () => {
  test("shows the custom title for a data() response with a string message", async () => {
    const screen = await renderWithLoader(() => {
      // Mirrors the data() idiom used by real loaders (exempted from this
      // rule via their `*-loader.ts` filename, which this test file isn't).
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw data("Custom title", { status: 404 });
    });

    await expect.element(screen.getByText("Custom title")).toBeVisible();
  });

  test("shows the generic title for a plain error", async () => {
    const screen = await renderWithLoader(() => {
      throw new Error("boom");
    });

    await expect
      .element(screen.getByText("Something went wrong"))
      .toBeVisible();
  });

  test("links go home to the root route", async () => {
    const screen = await renderWithLoader(() => {
      throw new Error("boom");
    });

    await expect
      .element(screen.getByRole("link", { name: "Go home" }))
      .toHaveAttribute("href", "/");
  });
});
