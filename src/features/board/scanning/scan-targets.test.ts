import { describe, expect, onTestFinished, test } from "vitest";
import { findScanGroups } from "./scan-targets";

function mountRoot(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  onTestFinished(() => root.remove());

  return root;
}

function readTargetNames(root: HTMLElement): string[][] {
  return findScanGroups(root, "row-column").map((group) =>
    group.targets.map((target) => target.textContent),
  );
}

describe("findScanGroups", () => {
  test("skips buttons that are disabled, not rendered, or not visible", () => {
    const root = mountRoot(`
      <div data-scan-group>
        <button disabled>disabled</button>
        <button style="display: none">removed</button>
        <button style="visibility: hidden">hidden</button>
        <span hidden><button>inside hidden</button></span>
        <button>yes</button>
        <button>no</button>
      </div>
    `);

    expect(readTargetNames(root)).toEqual([["yes", "no"]]);
  });

  test("leaves out a group with nothing to scan", () => {
    const root = mountRoot(`
      <div data-scan-group><button style="display: none">play</button></div>
      <div data-scan-group><button>yes</button></div>
    `);

    expect(readTargetNames(root)).toEqual([["yes"]]);
  });
});
