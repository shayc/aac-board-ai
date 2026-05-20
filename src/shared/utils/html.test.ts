import { describe, expect, test } from "vitest";
import { htmlToText } from "./html";

describe("htmlToText", () => {
  test("returns plain text from HTML", () => {
    expect(htmlToText("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  test("strips nested HTML tags", () => {
    expect(htmlToText("<div><p><span>nested</span></p></div>")).toBe("nested");
  });

  test("handles HTML entities", () => {
    expect(htmlToText("<p>&amp; &lt; &gt;</p>")).toBe("& < >");
  });

  test("returns the same string when there are no tags", () => {
    expect(htmlToText("plain text")).toBe("plain text");
  });

  test("returns empty string for empty input", () => {
    expect(htmlToText("")).toBe("");
  });

  test("returns empty string for empty HTML elements", () => {
    expect(htmlToText("<div></div>")).toBe("");
  });
});
