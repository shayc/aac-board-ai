import * as axe from "axe-core";
import { assert } from "vitest";

// Axe ships target-size (WCAG 2.5.8) disabled, but people selecting with a
// head pointer, eye gaze or an unsteady hand depend on large enough targets.
const ENABLED_BY_DEFAULT: axe.RuleObject = {
  "target-size": { enabled: true },
};

/** An incomplete axe result a person has checked and judged acceptable. */
export interface ReviewedIncomplete {
  rule: string;
  /** The bracketed cause a failure report prints, e.g. "aria-required-children". */
  cause: string;
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
  // Wait for final contrast colors; infinite spinners and paused animations never finish.
  const endingAnimations = target
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation.playState === "running" &&
        animation.effect?.getComputedTiming().endTime !== Infinity,
    );
  await Promise.allSettled(
    endingAnimations.map((animation) => animation.finished),
  );

  const { violations, incomplete } = await axe.run(target, {
    // Other result types keep one example node, which skips selector work;
    // incomplete needs every node to match against the reviewed list.
    resultTypes: ["violations", "incomplete"],
    ...options,
    rules: { ...ENABLED_BY_DEFAULT, ...options.rules },
    elementRef: true,
  });

  if (violations.length > 0) {
    assert.fail(describeResults(violations));
  }

  // Incomplete results, which axe could not decide, would otherwise pass
  // unseen. Contrast is left out: axe cannot see through layering such as
  // MUI's outline drawn over a field's text, so those results say nothing
  // about the colors.
  const reviewableIncomplete = incomplete.filter(
    (result) => result.id !== "color-contrast",
  );
  const unreviewedResults = withoutReviewedNodes(
    reviewableIncomplete,
    reviewedIncomplete,
  );
  if (unreviewedResults.length > 0) {
    assert.fail(
      `Incomplete: axe could not decide these. Review each one, then list it in reviewedIncomplete by rule, bracketed cause and a stable selector.\n\n${describeResults(unreviewedResults)}`,
    );
  }

  const staleReviews = reviewedIncomplete
    .filter(
      (reviewed) =>
        !reviewableIncomplete.some((result) =>
          hasReviewedNode(result, reviewed),
        ),
    )
    .map(({ rule, cause, selector }) => `${rule} [${cause}] on ${selector}`);
  if (staleReviews.length > 0) {
    assert.fail(
      `These reviewed results no longer occur; remove them:\n${staleReviews.join("\n")}`,
    );
  }
}

function describeResults(results: axe.Result[]) {
  const report = results.map((result) =>
    [
      `${result.id} (${result.impact ?? "unknown"}): ${result.help}`,
      `  ${result.helpUrl}`,
      ...result.nodes.map(describeNode),
    ].join("\n"),
  );

  return report.join("\n\n");
}

function describeNode(node: axe.NodeResult) {
  const describeCheck = (check: axe.CheckResult) =>
    `${check.message} [${causeOf(check)}]`;
  const required = [...node.all, ...node.none].map(describeCheck);
  // Passing any one of these checks fixes the element, so they are alternatives.
  const alternatives =
    node.any.length > 1
      ? [
          "Fix any one of:",
          ...node.any.map((check) => `- ${describeCheck(check)}`),
        ]
      : node.any.map(describeCheck);
  const details = [...required, ...alternatives].map((line) => `      ${line}`);

  return [`    ${node.target.join(" ")}`, ...details].join("\n");
}

function causeOf(check: axe.CheckResult) {
  return (check.data as { messageKey?: string } | null)?.messageKey ?? check.id;
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
          !reviewedIncomplete.some((reviewed) =>
            isNodeReviewed(result, node, reviewed),
          ),
      ),
    }))
    .filter((result) => result.nodes.length > 0);
}

function isNodeReviewed(
  result: axe.Result,
  node: axe.NodeResult,
  reviewed: ReviewedIncomplete,
) {
  const causes = [...node.any, ...node.all, ...node.none].map(causeOf);

  return (
    result.id === reviewed.rule &&
    causes.includes(reviewed.cause) &&
    node.element?.matches(reviewed.selector) === true
  );
}

function hasReviewedNode(result: axe.Result, reviewed: ReviewedIncomplete) {
  return result.nodes.some((node) => isNodeReviewed(result, node, reviewed));
}
