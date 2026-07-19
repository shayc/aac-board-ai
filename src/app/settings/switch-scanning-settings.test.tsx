import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
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
  test("keeps scanning opt-in and offers switch setup", async () => {
    const screen = await renderSettings();

    await expect
      .element(screen.getByRole("switch", { name: "Switch scanning" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("combobox", { name: "Scan method" }))
      .toBeEnabled();
    await expect
      .element(
        screen.getByText(
          "Items advance automatically. Press your switch to select.",
        ),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Switch assignments" }))
      .toBeVisible();
    const switchInput = screen.getByRole("group", { name: "Select switch" });
    await expect
      .element(switchInput.getByRole("button", { name: "Space Change" }))
      .toBeEnabled();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .toBeEnabled();
    await expect.element(screen.getByText("1.2 seconds").first()).toBeVisible();
    await expect.element(screen.getByText("Faster")).toBeVisible();
    await expect.element(screen.getByText("Slower")).toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("configures two-switch scanning while activation remains off", async () => {
    const screen = await renderSettings();

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
        enabled: false,
        method: "step",
      });
    });
  });

  test("shows dwell timing only for single-switch step scan", async () => {
    const screen = await renderSettings();

    await screen.getByRole("switch", { name: "Switch scanning" }).click();
    await screen.getByRole("combobox", { name: "Scan method" }).click();
    await screen
      .getByRole("option", {
        name: "Step, then wait to select",
      })
      .click();

    await expect
      .element(screen.getByRole("slider", { name: "Auto-select delay" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("group", { name: "Next item switch" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("slider", { name: "Scan interval" }))
      .not.toBeInTheDocument();
  });

  test("assigns arbitrary keyboard keys and mouse buttons", async () => {
    const screen = await renderSettings();

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
});
