import * as axe from "axe-core";
import { assert } from "vitest";

// Axe ships target-size (WCAG 2.5.8) disabled, but people selecting with a
// head pointer, eye gaze or an unsteady hand depend on large enough targets.
const ENABLED_BY_DEFAULT: axe.RuleObject = {
  "target-size": { enabled: true },
};

export const MUI_OUTLINED_INPUT_CONTRAST_REVIEW: ReviewedIncomplete = {
  rule: "color-contrast",
  cause: "bgOverlap",
  selector: ".MuiOutlinedInput-input",
  reason:
    "MUI draws the outlined border as a fieldset over the input, so axe cannot tell which background the text sits on.",
};

/** An undecided axe result a person has checked and judged acceptable. */
export interface ReviewedIncomplete {
  rule: string;
  /** The check's message key, or its ID when it has none, e.g. "bgOverlap". */
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

  const { violations, incomplete } = await axe.run(
    target,
    withDefaultOptions(options),
  );

  if (violations.length > 0) {
    assert.fail(describeResults(violations));
  }

  // Results axe could not decide, such as contrast over an image, would
  // otherwise pass unseen.
  const unreviewed = withoutReviewedNodes(incomplete, reviewedIncomplete);
  if (unreviewed.length > 0) {
    assert.fail(
      `Undecided: axe could not check these. Review each one, then list it in reviewedIncomplete with a stable selector.\n\n${describeResults(unreviewed, { suggestReview: true })}`,
    );
  }

  const stale = reviewedIncomplete.filter(
    (reviewed) => !incomplete.some((result) => isReviewed(result, reviewed)),
  );
  if (stale.length > 0) {
    assert.fail(
      `These reviewed results no longer occur; remove them:\n${stale.map(describeReview).join("\n")}`,
    );
  }
}

function withDefaultOptions(options: axe.RunOptions): axe.RunOptions {
  // An enabled rule runs even outside runOnly, which narrows a run on purpose.
  const rules = options.runOnly
    ? options.rules
    : { ...ENABLED_BY_DEFAULT, ...options.rules };

  return {
    // Other result types keep one example node, which skips selector work;
    // incomplete needs every node to match against the reviewed list.
    resultTypes: ["violations", "incomplete"],
    ...options,
    rules,
    elementRef: true,
  };
}

function describeResults(
  results: axe.Result[],
  { suggestReview = false } = {},
) {
  const report = results.map((result) =>
    [
      `${result.id} (${result.impact ?? "unknown"}): ${result.help}`,
      `  ${result.helpUrl}`,
      ...result.nodes.map((node) =>
        describeNode(node, { rule: result.id, suggestReview }),
      ),
    ].join("\n"),
  );

  return report.join("\n\n");
}

function describeNode(
  node: axe.NodeResult,
  { rule, suggestReview }: { rule: string; suggestReview: boolean },
) {
  const reviews = suggestReview
    ? causesOf(node).map(
        (cause) =>
          `Review: ${describeReview({ rule, cause, selector: "", reason: "" })}`,
      )
    : [];
  const details = [...describeReasons(node), ...reviews].map(
    (line) => `      ${line}`,
  );

  return [`    ${node.target.join(" ")}`, ...details].join("\n");
}

function describeReasons(node: axe.NodeResult) {
  const required = [...node.all, ...node.none].map((check) => check.message);
  // Passing any one of these checks fixes the element, so they are alternatives.
  const alternatives =
    node.any.length > 1
      ? ["Fix any one of:", ...node.any.map((check) => `- ${check.message}`)]
      : node.any.map((check) => check.message);

  return [...required, ...alternatives];
}

function describeReview({ rule, cause, selector, reason }: ReviewedIncomplete) {
  return `{ rule: ${JSON.stringify(rule)}, cause: ${JSON.stringify(cause)}, selector: ${JSON.stringify(selector)}, reason: ${JSON.stringify(reason)} }`;
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
            matchesReview(result, node, reviewed),
          ),
      ),
    }))
    .filter((result) => result.nodes.length > 0);
}

function matchesReview(
  result: axe.Result,
  node: axe.NodeResult,
  reviewed: ReviewedIncomplete,
) {
  return (
    result.id === reviewed.rule &&
    causesOf(node).includes(reviewed.cause) &&
    node.element?.matches(reviewed.selector) === true
  );
}

function causesOf(node: axe.NodeResult) {
  return [...node.any, ...node.all, ...node.none].map(
    (check) =>
      (check.data as { messageKey?: string } | null)?.messageKey ?? check.id,
  );
}

function isReviewed(result: axe.Result, reviewed: ReviewedIncomplete) {
  return result.nodes.some((node) => matchesReview(result, node, reviewed));
}
