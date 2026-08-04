import { AppProviders } from "@shared/providers/app-providers";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { ExternalLink } from "./external-link";

describe("ExternalLink", () => {
  test("merges caller styles after its base styles", async () => {
    const screen = await render(
      <AppProviders>
        <ExternalLink href="https://example.com" sx={{ whiteSpace: "normal" }}>
          Example
        </ExternalLink>
      </AppProviders>,
    );

    const link = screen.getByRole("link", {
      name: "Example (opens in new tab)",
    });
    expect(getComputedStyle(link.element()).whiteSpace).toBe("normal");
  });
});
