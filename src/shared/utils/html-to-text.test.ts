import { describe, expect, test } from "vitest";
import { htmlToText } from "./html-to-text";

describe("htmlToText", () => {
  test("keeps inline markup on one line", () => {
    expect(htmlToText("<p>A <strong>communication</strong> board</p>")).toBe(
      "A communication board",
    );
  });

  test("puts each block on its own line", () => {
    const html =
      "Intro<p>First line.</p><p>Second line.</p><ul><li>One</li><li>Two</li></ul>";

    expect(htmlToText(html)).toBe("Intro\nFirst line.\nSecond line.\nOne\nTwo");
  });

  test("breaks the line at a br", () => {
    expect(htmlToText("Made by Ada<br>Free to share")).toBe(
      "Made by Ada\nFree to share",
    );
  });

  test("treats source line breaks and indentation as spaces", () => {
    const html = "<p>\n  A board for\n  first words\n</p>\n<p>Second</p>";

    expect(htmlToText(html)).toBe("A board for first words\nSecond");
  });

  test("leaves out styles and scripts", () => {
    const html =
      "<style>p { color: red }</style><p>Visible</p><script>hidden()</script>";

    expect(htmlToText(html)).toBe("Visible");
  });

  test("decodes entities", () => {
    expect(htmlToText("Fish &amp; chips")).toBe("Fish & chips");
  });
});
