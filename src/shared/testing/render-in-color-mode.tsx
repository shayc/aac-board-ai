import type { ReactNode } from "react";
import { expect } from "vitest";
import { type ColorMode, ColorModeSwitch } from "./color-mode-switch";
import { renderWithProviders } from "./render-with-providers";

export type { ColorMode };

/** Renders with the app's providers and resolves once the given color mode's colors have settled. */
export async function renderInColorMode(children: ReactNode, mode: ColorMode) {
  const screen = await renderWithProviders(
    <>
      <ColorModeSwitch mode={mode} />
      {children}
    </>,
  );
  await screen.getByRole("button", { name: `Use ${mode} mode` }).click();
  await expect.poll(() => document.documentElement.className).toBe(mode);
  // Switching modes animates the colors.
  await Promise.all(document.getAnimations().map(({ finished }) => finished));

  return screen;
}
