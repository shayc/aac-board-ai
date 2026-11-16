import * as axe from "axe-core";
import { expect } from "vitest";

// Axe ships target-size (WCAG 2.5.8) disabled, but people selecting with a
// head pointer, eye gaze or an unsteady hand depend on large enough targets.
const ENABLED_BY_DEFAULT: axe.RuleObject = {
  "target-size": { enabled: true },
};

export const MUI_OUTLINED_INPUT_CONTRAST_REVIEW: ReviewedIncomplete = {
  rule: "color-contrast",
  selector: ".MuiOutlinedInput-input",
  reason:
    "MUI draws the outlined border as a fieldset over the input, so axe cannot tell which background the text sits on.",
};

/** An undecided axe result a person has checked and judged acceptable. */
export interface ReviewedIncomplete {
  rule: string;
  /** Matches the flagged elements; axe's own targets use unstable React IDs. */
  selector: string;
  reason: string;
}

interface A11yCheckOptions extends axe.RunOptions {
  reviewedIncomplete?: readonly ReviewedIncomplete[];
}

export async function expectNoA11yViolations(
  target: Element,
  { reviewedIncomplete = [], ...options }: A11yCheckOptions = {},
) {
  // Wait for final contrast colors while allowing infinite spinners to keep running.
  const finiteAnimations = target
    .getAnimations({ subtree: true })
    .filter(
      (animation) => animation.effect?.getComputedTiming().endTime !== Infinity,
    );
  await Promise.all(finiteAnimations.map((animation) => animation.finished));

  const { violations, incomplete } = await axe.run(target, {
    ...options,
    elementRef: true,
    rules: { ...ENABLED_BY_DEFAULT, ...options.rules },
  });

  expect(violations.length, describeResults(violations)).toBe(0);

  // Results axe could not decide, such as contrast over an image, would
  // otherwise pass unseen.
  const unreviewed = withoutReviewedNodes(incomplete, reviewedIncomplete);
  expect(unreviewed.length, describeResults(unreviewed)).toBe(0);

  const stale = reviewedIncomplete.filter(
    (reviewed) => !incomplete.some((result) => isReviewed(result, reviewed)),
  );
  expect(stale, "these reviewed results no longer occur; remove them").toEqual(
    [],
  );
}

function withoutReviewedNodes(
  results: axe.Result[],
  reviewedIncomplete: readonly ReviewedIncomplete[],
): axe.Result[] {
  return results
    .map((result) => ({
      ...result,
      nodes: result.nodes.filter(
        (node) =>
          !reviewedIncomplete.some(
            (reviewed) =>
              reviewed.rule === result.id &&
              node.element?.matches(reviewed.selector),
          ),
      ),
    }))
    .filter((result) => result.nodes.length > 0);
}

function isReviewed(result: axe.Result, reviewed: ReviewedIncomplete) {
  return (
    result.id === reviewed.rule &&
    result.nodes.some((node) => node.element?.matches(reviewed.selector))
  );
}

function describeResults(results: axe.Result[]) {
  const report = results.map((result) => {
    const nodes = result.nodes
      .map((node) => {
        const reason = [...node.any, ...node.all, ...node.none]
          .map((check) => check.message)
          .join("; ");

        return `${node.target.join(" ")}${reason ? ` — ${reason}` : ""}`;
      })
      .join("\n    ");

    return `${result.id} (${result.impact ?? "unknown"}): ${result.help}\n  ${result.helpUrl}\n    ${nodes}`;
  });

  return report.join("\n\n");
}
