import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { expectNoA11yViolations, type ReviewedIncomplete } from "./axe";

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

  test("fails on a result axe could not decide", async () => {
    const screen = await render(<div role="list" aria-label="Empty" />);

    await expect(expectNoA11yViolations(screen.container)).rejects.toThrow(
      /aria-required-children/,
    );
  });

  test("accepts an undecided result reviewed by rule, cause and selector", async () => {
    const screen = await render(<div role="list" aria-label="Empty" />);

    await expectNoA11yViolations(screen.container, {
      reviewedIncomplete: [EMPTY_LIST_REVIEW],
    });
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
});
