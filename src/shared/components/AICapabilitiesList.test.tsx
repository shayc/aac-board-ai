import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { AICapabilitiesList } from "./AICapabilitiesList";

test("smoke", async () => {
  const screen = await render(<AICapabilitiesList />);

  await expect.element(screen.getByText("Proofreader")).toBeVisible();
  await expect.element(screen.getByText("Rewriter")).toBeVisible();
  await expect.element(screen.getByText("Translator")).toBeVisible();
});
