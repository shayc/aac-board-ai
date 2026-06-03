import * as axe from "axe-core";
import { expect } from "vitest";

export async function expectNoA11yViolations(
  target: Element,
  options: axe.RunOptions = {},
) {
  const { violations } = await axe.run(target, options);

  const report = violations.map((violation) => {
    const nodes = violation.nodes
      .map((node) => node.target.join(" "))
      .join("\n    ");
    return `${violation.id} (${violation.impact}): ${violation.help}\n  ${violation.helpUrl}\n    ${nodes}`;
  });

  expect(violations.length, report.join("\n\n")).toBe(0);
}
