import { AppProviders } from "@shared/providers/app-providers";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { HomeIcon, PlayIcon } from "./icons";

describe("icons", () => {
  test("draws line icons as open strokes", async () => {
    const screen = await render(
      <AppProviders>
        <HomeIcon />
      </AppProviders>,
    );
    const icon = screen.getByTestId("HomeIcon").element();

    expect(getComputedStyle(icon).fill).toBe("none");
    expect(getComputedStyle(icon).stroke).not.toBe("none");
  });

  test("fills icons that are solid shapes", async () => {
    const screen = await render(
      <AppProviders>
        <PlayIcon />
      </AppProviders>,
    );
    const icon = screen.getByTestId("PlayIcon").element();

    expect(getComputedStyle(icon).fill).not.toBe("none");
  });

  test("keeps the stroke weight when an icon is drawn larger", async () => {
    const screen = await render(
      <AppProviders>
        <HomeIcon sx={{ fontSize: 48 }} />
      </AppProviders>,
    );
    const shape = screen.getByTestId("HomeIcon").element().firstElementChild;

    expect(shape && getComputedStyle(shape).vectorEffect).toBe(
      "non-scaling-stroke",
    );
  });
});
