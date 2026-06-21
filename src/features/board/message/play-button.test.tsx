import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { describe, expect, test, vi } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import { render } from "vitest-browser-react";
import { PlayButton } from "./play-button";

function createHandlers() {
  return {
    onPlayClick: vi.fn(),
    onStopClick: vi.fn(),
  };
}

describe("PlayButton", () => {
  test("calls onPlayClick when clicked while not playing", async () => {
    const handlers = createHandlers();

    const screen = await render(<PlayButton isPlaying={false} {...handlers} />);

    const button = screen.getByRole("button", { name: "Play message" });
    await button.click();

    expect(handlers.onPlayClick).toHaveBeenCalledTimes(1);
    expect(handlers.onStopClick).not.toHaveBeenCalled();
  });

  test("calls onStopClick when clicked while playing", async () => {
    const handlers = createHandlers();

    const screen = await render(<PlayButton isPlaying={true} {...handlers} />);

    const button = screen.getByRole("button", { name: "Stop" });
    await button.click();

    expect(handlers.onStopClick).toHaveBeenCalledTimes(1);
    expect(handlers.onPlayClick).not.toHaveBeenCalled();
  });

  describe("RTL icon mirroring", () => {
    test("play arrow icon is flipped in RTL", async () => {
      const theme = createTheme({ direction: "rtl" });
      const handlers = createHandlers();

      const screen = await render(
        <MUIThemeProvider theme={theme}>
          <PlayButton isPlaying={false} {...handlers} />
        </MUIThemeProvider>,
      );

      const button = screen.getByRole("button", { name: "Play message" });
      const icon = button.element().querySelector("svg");

      assertDefined(icon);
      // Browsers resolve scaleX(-1) to its matrix equivalent
      const styles = getComputedStyle(icon);
      expect(styles.transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("play arrow icon is not flipped in LTR", async () => {
      const theme = createTheme({ direction: "ltr" });
      const handlers = createHandlers();

      const screen = await render(
        <MUIThemeProvider theme={theme}>
          <PlayButton isPlaying={false} {...handlers} />
        </MUIThemeProvider>,
      );

      const button = screen.getByRole("button", { name: "Play message" });
      const icon = button.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("stop icon is not flipped in RTL", async () => {
      const theme = createTheme({ direction: "rtl" });
      const handlers = createHandlers();

      const screen = await render(
        <MUIThemeProvider theme={theme}>
          <PlayButton isPlaying={true} {...handlers} />
        </MUIThemeProvider>,
      );

      const button = screen.getByRole("button", { name: "Stop" });
      const icon = button.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });
  });
});
