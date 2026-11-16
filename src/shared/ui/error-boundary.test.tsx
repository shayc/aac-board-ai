import { renderWithProviders } from "@shared/testing/render-with-providers";
import type { ReactNode } from "react";
import { describe, expect, test } from "vitest";
import { ErrorBoundary } from "./error-boundary";

function BrokenPart(): ReactNode {
  throw new Error("Part failed to render");
}

describe("ErrorBoundary", () => {
  test("renders its children when they render", async () => {
    const screen = await renderWithProviders(
      <ErrorBoundary fallback={<p>Fallback</p>}>
        <p>Working part</p>
      </ErrorBoundary>,
    );

    await expect.element(screen.getByText("Working part")).toBeVisible();
    await expect.element(screen.getByText("Fallback")).not.toBeInTheDocument();
  });

  test("replaces only the failed part, leaving the rest of the screen", async () => {
    const screen = await renderWithProviders(
      <>
        <p>Board</p>
        <ErrorBoundary fallback={null}>
          <BrokenPart />
        </ErrorBoundary>
      </>,
    );

    await expect.element(screen.getByText("Board")).toBeVisible();
  });
});
