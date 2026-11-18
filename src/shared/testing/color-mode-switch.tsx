import { useColorScheme } from "@mui/material/styles";

export type ColorMode = "light" | "dark";

/** A test-only control; `renderInColorMode` renders and presses it. */
export function ColorModeSwitch({ mode }: { mode: ColorMode }) {
  const { setMode } = useColorScheme();

  return (
    <button type="button" onClick={() => setMode(mode)}>
      Use {mode} mode
    </button>
  );
}
