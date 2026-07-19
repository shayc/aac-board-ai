import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { SwitchScanningSettings } from "./switch-scanning-settings";

function renderSettings() {
  return render(
    <AppProviders>
      <SwitchScanningSettings />
    </AppProviders>,
  );
}

describe("SwitchScanningSettings", () => {
  test("keeps scanning opt-in and its configuration collapsed", async () => {
    const screen = await renderSettings();

    await expect
      .element(screen.getByRole("switch", { name: "Switch scanning" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("combobox", { name: "Scan method" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("group", { name: "Select switch" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("uses the scanning switch to expand and collapse configuration", async () => {
    const screen = await renderSettings();
    const scanningSwitch = screen.getByRole("switch", {
      name: "Switch scanning",
    });

    await scanningSwitch.click();

    await expect.element(scanningSwitch).toBeChecked();
    await expect
      .element(screen.getByRole("combobox", { name: "Scan method" }))
      .toBeEnabled();
    await expect
      .element(screen.getByRole("group", { name: "Select switch" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .toBeEnabled();
    await expect.element(screen.getByText("1.2 seconds")).toBeVisible();
    await expect.element(screen.getByText("Faster")).not.toBeInTheDocument();
    await expect.element(screen.getByText("Slower")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Advanced" }))
      .toHaveAttribute("aria-expanded", "false");

    await scanningSwitch.click();

    await expect
      .element(screen.getByRole("combobox", { name: "Scan method" }))
      .not.toBeInTheDocument();
    await expectNoA11yViolations(screen.container);
  });

  test("uses concise mode names with full helper text", async () => {
    const screen = await renderSettings();

    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    await expect
      .element(
        screen.getByText("Items advance automatically. Press to select."),
      )
      .toBeVisible();

    const modes = [
      {
        label: "Step and wait",
        description: "Press to advance. Wait to select.",
      },
      {
        label: "Hold and release",
        description: "Hold to advance. Release to select.",
      },
      {
        label: "Two-switch step",
        description: "Use one switch to advance and another to select.",
      },
    ] as const;

    for (const { label, description } of modes) {
      await screen.getByRole("combobox", { name: "Scan method" }).click();
      await screen.getByRole("option", { name: label }).click();
      await expect.element(screen.getByText(description)).toBeVisible();
    }
  });

  test("configures two-switch scanning", async () => {
    const screen = await renderSettings();

    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    await screen.getByRole("combobox", { name: "Scan method" }).click();
    await screen.getByRole("option", { name: "Two-switch step" }).click();

    await expect
      .element(
        screen
          .getByRole("group", { name: "Next item switch" })
          .getByRole("button", { name: "Space Change" }),
      )
      .toBeVisible();
    await expect
      .element(
        screen
          .getByRole("group", { name: "Select switch" })
          .getByRole("button", { name: "Enter Change" }),
      )
      .toBeVisible();
    await expect.element(screen.getByRole("slider")).not.toBeInTheDocument();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("switch-scanning-config");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({
        enabled: true,
        method: "step",
      });
    });
  });

  test("shows dwell timing only for single-switch step scan", async () => {
    const screen = await renderSettings();

    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    await screen.getByRole("combobox", { name: "Scan method" }).click();
    await expect
      .element(
        screen.getByRole("option", {
          name: "Hold and release",
        }),
      )
      .toBeVisible();
    await screen
      .getByRole("option", {
        name: "Step and wait",
      })
      .click();

    await expect
      .element(screen.getByRole("slider", { name: "Auto-select delay" }))
      .toBeVisible();
    await expect
      .element(screen.getByText("Press to advance. Wait to select."))
      .toBeVisible();
    await expect.element(screen.getByText("Shorter")).not.toBeInTheDocument();
    await expect.element(screen.getByText("Longer")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("group", { name: "Next item switch" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();
  });

  test("assigns arbitrary keyboard keys and mouse buttons", async () => {
    const screen = await renderSettings();

    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    await screen.getByRole("combobox", { name: "Scan method" }).click();
    await screen.getByRole("option", { name: "Two-switch step" }).click();
    const moveSwitch = screen.getByRole("group", {
      name: "Next item switch",
    });
    const selectSwitch = screen.getByRole("group", { name: "Select switch" });

    await moveSwitch.getByRole("button", { name: "Space Change" }).click();
    await expect
      .element(moveSwitch.getByText("Press your switch…", { exact: true }))
      .toBeVisible();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "F13",
        key: "F13",
      }),
    );
    await expect
      .element(moveSwitch.getByRole("button", { name: "F13 Change" }))
      .toBeVisible();

    await selectSwitch.getByRole("button", { name: "Enter Change" }).click();
    document.dispatchEvent(
      new MouseEvent("auxclick", {
        bubbles: true,
        button: 3,
        detail: 1,
      }),
    );
    await expect
      .element(
        selectSwitch.getByRole("button", { name: "Mouse button 4 Change" }),
      )
      .toBeVisible();

    await vi.waitFor(() => {
      const stored = localStorage.getItem("switch-scanning-config");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({
        inputs: {
          next: { kind: "keyboard", code: "F13", label: "F13" },
          select: { kind: "mouse", button: 3 },
        },
      });
    });

    await expectNoA11yViolations(screen.container);
  });

  test("uses familiar names for primary mouse and platform modifier inputs", async () => {
    const screen = await renderSettings();
    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    const selectSwitch = screen.getByRole("group", { name: "Select switch" });

    await selectSwitch.getByRole("button", { name: "Space Change" }).click();
    document.dispatchEvent(
      new MouseEvent("click", { bubbles: true, button: 0, detail: 1 }),
    );
    await expect
      .element(
        selectSwitch.getByRole("button", {
          name: "Left mouse button Change",
        }),
      )
      .toBeVisible();

    await selectSwitch
      .getByRole("button", { name: "Left mouse button Change" })
      .click();
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "MetaLeft",
        key: "Meta",
      }),
    );
    await expect
      .element(
        selectSwitch.getByRole("button", {
          name: /(?:Command|Windows|Meta) key Change/,
        }),
      )
      .toBeVisible();
  });

  test("persists advanced scan and input timing controls", async () => {
    const screen = await renderSettings();

    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    await screen.getByRole("button", { name: "Advanced" }).click();

    const cycles = screen.getByRole("slider", {
      name: "Cycles before pausing",
    });
    const firstItemPause = screen.getByRole("slider", {
      name: "First-item pause",
    });
    const ignoreRepeatedPresses = screen.getByRole("slider", {
      name: "Ignore repeated presses",
    });
    const minimumPressDuration = screen.getByRole("slider", {
      name: "Minimum press duration",
    });

    await expect.element(cycles).toBeVisible();
    await expect.element(firstItemPause).toBeVisible();
    await expect.element(ignoreRepeatedPresses).toBeVisible();
    await expect.element(minimumPressDuration).toBeVisible();

    cycles.element().focus();
    await userEvent.keyboard("{ArrowRight}");
    minimumPressDuration.element().focus();
    await userEvent.keyboard("{ArrowRight}");

    await vi.waitFor(() => {
      const stored = localStorage.getItem("switch-scanning-config");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({
        cyclesBeforePausing: 4,
        minimumPressDurationMs: 100,
      });
    });

    await expectNoA11yViolations(screen.container);
  });
});
