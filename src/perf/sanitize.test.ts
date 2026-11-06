import { describe, expect, test } from "vitest";
import { describeElement, routeOf, sanitizeURL } from "./sanitize";

describe("sanitize", () => {
  test("reduces app routes to their patterns", () => {
    expect(routeOf("/sets/my-words/boards/food")).toBe(
      "/sets/:boardSetId/boards/:boardId",
    );
    expect(routeOf("/sets/my-words")).toBe("/sets/:boardSetId");
    expect(routeOf("/")).toBe("/");
    expect(routeOf("/unknown/page")).toBe("(other)");
  });

  test("keeps asset paths but drops board IDs, queries and other origins", () => {
    expect(sanitizeURL(`${location.origin}/assets/index.js?v=1`)).toBe(
      "/assets/index.js",
    );
    expect(sanitizeURL(`${location.origin}/sets/a/boards/b?board=x`)).toBe(
      "/sets/:boardSetId/boards/:boardId",
    );
    expect(sanitizeURL("https://boards.example/private/words.obz")).toBe(
      "https://boards.example",
    );
    expect(sanitizeURL("blob:https://app.example/1234")).toBe("blob:");
    expect(sanitizeURL(undefined)).toBe("");
  });

  test("describes elements by structure, never by text or IDs", () => {
    document.body.innerHTML = `
      <div role="gridcell">
        <button id="tile-secret" class="MuiButton-root css-1x2y3z">I want cake</button>
      </div>`;
    const button = document.querySelector("button");

    const description = describeElement(button?.firstChild);

    expect(description).toBe("div[role=gridcell] > button.MuiButton-root");
    expect(description).not.toMatch(/cake|secret|css-/);
  });
});
