import { describe, expect, test, vi } from "vitest";
import { focusableDisabledProps } from "./focusable-disabled";

describe("focusableDisabledProps", () => {
  test("passes the click handler through while enabled", () => {
    const onClick = vi.fn();

    expect(focusableDisabledProps(false, onClick)).toEqual({ onClick });
  });

  test("adds nothing while enabled without a click handler", () => {
    expect(focusableDisabledProps(false)).toEqual({});
  });

  test("marks the button disabled and drops its click handler", () => {
    const props = focusableDisabledProps(true, vi.fn());

    expect(props["aria-disabled"]).toBe(true);
    expect(props).not.toHaveProperty("onClick");
  });
});
