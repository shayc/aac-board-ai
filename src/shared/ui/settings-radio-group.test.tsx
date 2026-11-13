import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { AppProviders } from "@shared/providers/app-providers";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SettingsRadioGroup } from "./settings-radio-group";

type Size = "small" | "large";

const SIZE_OPTIONS = [
  { value: "small", label: "Small" },
  { value: "large", label: "Large" },
] as const;

describe("SettingsRadioGroup", () => {
  test("reports the value of the option that is selected", async () => {
    const onChange = vi.fn<(size: Size) => void>();
    const screen = await render(
      <AppProviders>
        <SettingsRadioGroup
          label="Size"
          value="small"
          onChange={onChange}
          options={SIZE_OPTIONS}
        />
      </AppProviders>,
    );

    await screen.getByRole("radio", { name: "Large" }).click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith("large");
  });

  test("ignores a radio whose value is not one of the options", async () => {
    const onChange = vi.fn<(size: Size) => void>();
    const screen = await render(
      <AppProviders>
        <SettingsRadioGroup
          label="Size"
          value="small"
          onChange={onChange}
          options={SIZE_OPTIONS}
          renderOption={({ value, label }) => (
            <FormControlLabel
              value={value === "large" ? "huge" : value}
              control={<Radio />}
              label={label}
            />
          )}
        />
      </AppProviders>,
    );

    await screen.getByRole("radio", { name: "Large" }).click();

    expect(onChange).not.toHaveBeenCalled();
  });
});
