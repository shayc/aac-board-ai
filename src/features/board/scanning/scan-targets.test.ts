import { afterEach, describe, expect, test } from "vitest";
import { readScanGroups } from "./scan-targets";

function mountScope(html: string): HTMLElement {
  const scope = document.createElement("div");
  scope.innerHTML = html;
  document.body.append(scope);

  return scope;
}

function readItemNames(scope: HTMLElement): string[][] {
  return readScanGroups(scope).map((group) =>
    group.items.map((item) => item.textContent),
  );
}

describe("readScanGroups", () => {
  let scope: HTMLElement;

  afterEach(() => {
    scope.remove();
  });

  test("lists the buttons of each group in document order", () => {
    scope = mountScope(`
      <div data-scan-group><button>play</button></div>
      <div data-scan-group>
        <button>yes</button>
        <div role="button">no</div>
      </div>
    `);

    expect(readItemNames(scope)).toEqual([["play"], ["yes", "no"]]);
  });

  test("ignores buttons outside a group", () => {
    scope = mountScope(`
      <button>settings</button>
      <div data-scan-group><button>yes</button></div>
    `);

    expect(readItemNames(scope)).toEqual([["yes"]]);
  });

  test("skips disabled buttons", () => {
    scope = mountScope(`
      <div data-scan-group>
        <button disabled>back</button>
        <div role="button" aria-disabled="true">suggestion</div>
        <button>home</button>
      </div>
    `);

    expect(readItemNames(scope)).toEqual([["home"]]);
  });

  test("skips buttons that are not rendered or not visible", () => {
    scope = mountScope(`
      <div data-scan-group>
        <button style="display: none">removed</button>
        <button style="visibility: hidden">hidden</button>
        <span hidden><button>inside hidden</button></span>
        <button>shown</button>
      </div>
    `);

    expect(readItemNames(scope)).toEqual([["shown"]]);
  });

  test("skips groups with nothing to scan", () => {
    scope = mountScope(`
      <div data-scan-group><button disabled>play</button></div>
      <div data-scan-group></div>
      <div data-scan-group><button>yes</button></div>
    `);

    expect(readItemNames(scope)).toEqual([["yes"]]);
  });
});
