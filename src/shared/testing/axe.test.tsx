import TextField from "@mui/material/TextField";
import { afterEach, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import {
  expectNoA11yViolations,
  MUI_OUTLINED_INPUT_CONTRAST_REVIEW,
  type ReviewedIncomplete,
} from "./axe";

const LONG_ANIMATION_MS = 60_000;

const EMPTY_LIST_REVIEW: ReviewedIncomplete = {
  rule: "aria-required-children",
  cause: "aria-required-children",
  selector: "[aria-label='Empty']",
  reason: "Fixture list that is empty on purpose.",
};

function SmallAdjacentButtons() {
  return (
    <div style={{ display: "flex" }}>
      <button
        aria-label="First"
        style={{ width: 12, height: 12, padding: 0 }}
      />
      <button
        aria-label="Second"
        style={{ width: 12, height: 12, padding: 0 }}
      />
    </div>
  );
}

describe("expectNoA11yViolations", () => {
  test("fails on targets smaller than WCAG's minimum size", async () => {
    const screen = await render(<SmallAdjacentButtons />);

    await expect(expectNoA11yViolations(screen.container)).rejects.toThrow(
      /target-size/,
    );
  });

  test("leaves target size out when a run is narrowed to chosen rules", async () => {
    const screen = await render(<SmallAdjacentButtons />);

    await expectNoA11yViolations(screen.container, {
      runOnly: ["button-name"],
    });
  });

  test("fails on a result axe could not decide and suggests its review", async () => {
    const screen = await render(<div role="list" aria-label="Empty" />);

    await expect(expectNoA11yViolations(screen.container)).rejects.toThrow(
      /^Undecided:[\s\S]*Review: \{ rule: "aria-required-children", cause: "aria-required-children", selector: "", reason: "" \}/,
    );
  });

  test("lists alternative fixes as a choice", async () => {
    const screen = await render(<div />);
    // Built outside JSX, since lint rightly rejects an unnamed button there.
    screen.container.append(document.createElement("button"));

    await expect(expectNoA11yViolations(screen.container)).rejects.toThrow(
      /button-name[\s\S]*Fix any one of:\n\s+- .+\n\s+- aria-label attribute/,
    );
  });

  test("accepts an undecided result reviewed by rule, cause and selector", async () => {
    const screen = await render(<div role="list" aria-label="Empty" />);

    await expectNoA11yViolations(screen.container, {
      reviewedIncomplete: [EMPTY_LIST_REVIEW],
    });
  });

  test("fails on an unreviewed element when another of the same rule is reviewed", async () => {
    const screen = await render(
      <>
        <div role="list" aria-label="Empty" />
        <div role="list" aria-label="Also empty" />
      </>,
    );

    await expect(
      expectNoA11yViolations(screen.container, {
        reviewedIncomplete: [EMPTY_LIST_REVIEW],
      }),
    ).rejects.toThrow(/aria-required-children/);
  });

  test("fails when the reviewed cause differs from axe's", async () => {
    const screen = await render(<div role="list" aria-label="Empty" />);

    await expect(
      expectNoA11yViolations(screen.container, {
        reviewedIncomplete: [{ ...EMPTY_LIST_REVIEW, cause: "aria-busy" }],
      }),
    ).rejects.toThrow(/aria-required-children/);
  });

  test("fails when a reviewed result no longer occurs", async () => {
    const screen = await render(
      <div role="list" aria-label="Empty">
        <div role="listitem">Item</div>
      </div>,
    );

    await expect(
      expectNoA11yViolations(screen.container, {
        reviewedIncomplete: [EMPTY_LIST_REVIEW],
      }),
    ).rejects.toThrow(/no longer occur/);
  });

  test("fails on MUI's outlined border over a field's text until reviewed", async () => {
    const screen = await render(<TextField label="Name" defaultValue="Ada" />);

    await expect(expectNoA11yViolations(screen.container)).rejects.toThrow(
      /color-contrast/,
    );
    await expectNoA11yViolations(screen.container, {
      reviewedIncomplete: [MUI_OUTLINED_INPUT_CONTRAST_REVIEW],
    });
  });

  describe("with animations", () => {
    let paragraph: HTMLParagraphElement;

    afterEach(() => {
      paragraph.remove();
    });

    test("passes when an animation it waits for is cancelled", async () => {
      paragraph = mountParagraph();
      const animation = paragraph.animate(
        { opacity: [0, 1] },
        LONG_ANIMATION_MS,
      );

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
});

function mountParagraph() {
  const paragraph = document.createElement("p");
  paragraph.textContent = "Hello";
  document.body.append(paragraph);

  return paragraph;
}
