import * as axe from "axe-core";
import { expect } from "vitest";

export async function expectNoA11yViolations(
  target: Element,
  options: axe.RunOptions = {},
) {
  // Wait for final contrast colors while allowing infinite spinners to keep running.
  const finiteAnimations = target
    .getAnimations({ subtree: true })
    .filter(
      (animation) => animation.effect?.getComputedTiming().endTime !== Infinity,
    );
  await Promise.all(finiteAnimations.map((animation) => animation.finished));

  const { violations } = await axe.run(target, options);

  const report = violations.map((violation) => {
    const nodes = violation.nodes
      .map((node) => node.target.join(" "))
      .join("\n    ");

    return `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n  ${violation.helpUrl}\n    ${nodes}`;
  });

  expect(violations.length, report.join("\n\n")).toBe(0);
}
