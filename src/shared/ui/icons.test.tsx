import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test } from "vitest";
import * as icons from "./icons";

const TEXT_COLOR = "rgb(200, 0, 0)";

describe("icons", () => {
  test.each(Object.entries(icons))(
    "%s draws in the text color",
    async (_name, Icon) => {
      const screen = await renderWithProviders(
        <span style={{ color: TEXT_COLOR }}>
          <Icon />
        </span>,
      );

      const svg = screen.container.querySelector("svg");

      expect(svg && getComputedStyle(svg).fill).toBe(TEXT_COLOR);
    },
  );
});
