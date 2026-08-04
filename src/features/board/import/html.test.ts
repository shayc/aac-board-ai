import { describe, expect, test } from "vitest";
import { htmlToText } from "./html";

describe("htmlToText", () => {
  test("returns plain text from HTML", () => {
    expect(htmlToText("<p>Hello <b>world</b></p>")).toBe("Hello world");
  });

  test("decodes HTML entities", () => {
    expect(htmlToText("<p>&amp; &lt; &gt;</p>")).toBe("& < >");
  });
});
