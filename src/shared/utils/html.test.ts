import { describe, expect, test } from "vitest";
import { stripHtmlTags } from "./html";

describe("stripHtmlTags", () => {
  test("returns plain text from HTML", () => {
    expect(stripHtmlTags("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  test("strips nested HTML tags", () => {
    expect(stripHtmlTags("<div><p><span>nested</span></p></div>")).toBe(
      "nested",
    );
  });

  test("handles HTML entities", () => {
    expect(stripHtmlTags("<p>&amp; &lt; &gt;</p>")).toBe("& < >");
  });

  test("returns the same string when there are no tags", () => {
    expect(stripHtmlTags("plain text")).toBe("plain text");
  });

  test("returns empty string for empty input", () => {
    expect(stripHtmlTags("")).toBe("");
  });

  test("returns empty string for empty HTML elements", () => {
    expect(stripHtmlTags("<div></div>")).toBe("");
  });
});
