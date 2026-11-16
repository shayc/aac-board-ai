import { afterEach, describe, test } from "vitest";
import { expectNoA11yViolations } from "./axe";

const LONG_ANIMATION_MS = 60_000;

describe("expectNoA11yViolations", () => {
  let paragraph: HTMLParagraphElement;

  afterEach(() => {
    paragraph.remove();
  });

  test("passes when an animation it waits for is cancelled", async () => {
    paragraph = mountParagraph();
    const animation = paragraph.animate({ opacity: [0, 1] }, LONG_ANIMATION_MS);

    const check = expectNoA11yViolations(paragraph);
    animation.cancel();

    await check;
  });

  test("does not wait for a paused animation", async () => {
    paragraph = mountParagraph();
    paragraph.animate({ opacity: [0, 1] }, LONG_ANIMATION_MS).pause();

    await expectNoA11yViolations(paragraph);
  });
});

function mountParagraph() {
  const paragraph = document.createElement("p");
  paragraph.textContent = "Hello";
  document.body.append(paragraph);

  return paragraph;
}
