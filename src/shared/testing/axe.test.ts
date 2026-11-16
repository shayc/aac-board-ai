import { afterEach, describe, expect, test } from "vitest";
import { expectNoA11yViolations } from "./axe";

const LONG_ANIMATION_MS = 60_000;

describe("expectNoA11yViolations", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test("passes when an animation it waits for is cancelled", async () => {
    const container = renderParagraph();
    const animation = container.animate({ opacity: [0, 1] }, LONG_ANIMATION_MS);

    const check = expectNoA11yViolations(container);
    animation.cancel();

    await expect(check).resolves.toBeUndefined();
  });

  test("does not wait for a paused animation", async () => {
    const container = renderParagraph();
    const animation = container.animate({ opacity: [0, 1] }, LONG_ANIMATION_MS);
    animation.pause();

    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});

function renderParagraph() {
  const container = document.createElement("div");
  const paragraph = document.createElement("p");
  paragraph.textContent = "Hello";
  container.append(paragraph);
  document.body.append(container);

  return container;
}
