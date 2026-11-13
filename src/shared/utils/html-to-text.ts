const NON_CONTENT_SELECTOR = "script, style, template";
const BLOCK_SELECTOR =
  "address, article, aside, blockquote, dd, div, dl, dt, figcaption, figure, footer, h1, h2, h3, h4, h5, h6, header, hr, li, main, nav, ol, p, pre, section, table, tr, ul";

/**
 * Returns the text a browser would show for the HTML, with a line break at
 * each `<br>` and block boundary. The parsed document is never rendered, so
 * `innerText` cannot supply those breaks, and rendering third-party HTML to
 * get them would load its images.
 */
export function htmlToText(html: string): string {
  const { body } = new DOMParser().parseFromString(html, "text/html");

  removeNonContent(body);
  collapseSourceWhitespace(body);
  insertLineBreaks(body);

  return body.textContent.replace(/ *\n[ \n]*/g, "\n").trim();
}

function removeNonContent(root: HTMLElement): void {
  for (const element of root.querySelectorAll(NON_CONTENT_SELECTOR)) {
    element.remove();
  }
}

function collapseSourceWhitespace(root: HTMLElement): void {
  const textNodes = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );

  while (textNodes.nextNode()) {
    const textNode = textNodes.currentNode;
    textNode.textContent = (textNode.textContent ?? "").replace(/\s+/g, " ");
  }
}

function insertLineBreaks(root: HTMLElement): void {
  for (const lineBreak of root.querySelectorAll("br")) {
    lineBreak.replaceWith("\n");
  }

  for (const block of root.querySelectorAll(BLOCK_SELECTOR)) {
    block.before("\n");
    block.after("\n");
  }
}
