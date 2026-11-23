import { useColorScheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { expect } from "vitest";
import { renderWithProviders } from "./render-with-providers";

export type ColorMode = "light" | "dark";

/**
 * Renders with the app's providers and resolves once the given color mode's
 * colors have settled. A "Use … mode" button is rendered before the children.
 */
export async function renderInColorMode(children: ReactNode, mode: ColorMode) {
  function ColorModeSwitch() {
    const { setMode } = useColorScheme();

    return (
      <button type="button" onClick={() => setMode(mode)}>
        Use {mode} mode
      </button>
    );
  }

  const screen = await renderWithProviders(
    <>
      <ColorModeSwitch />
      {children}
    </>,
  );
  await screen.getByRole("button", { name: `Use ${mode} mode` }).click();
  await expect.poll(() => document.documentElement.className).toBe(mode);
  await Promise.all(
    colorTransitions(screen.container).map(({ finished }) => finished),
  );

  return screen;
}

// Switching modes transitions the colors. Other animations in the rendered
// content may never end.
function colorTransitions(container: Element) {
  return container
    .getAnimations({ subtree: true })
    .filter((animation) => animation instanceof CSSTransition);
}
