import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { AIFeaturesList } from "./AIFeaturesList";

test("renders all AI features", async () => {
  const screen = await render(<AIFeaturesList />);

  await expect.element(screen.getByText("Proofreader")).toBeVisible();
  await expect.element(screen.getByText("Rewriter")).toBeVisible();
  await expect.element(screen.getByText("Translator")).toBeVisible();
});
