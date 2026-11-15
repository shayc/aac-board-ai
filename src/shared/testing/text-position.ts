import { assert } from "vitest";

// DOM text order alone misses bidi rendering errors.
export function textLeft(root: Element, substring: string): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    assert(node instanceof Text);

    const start = node.data.indexOf(substring);
    if (start === -1) {
      continue;
    }

    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + substring.length);

    return range.getBoundingClientRect().left;
  }

  throw new Error(`No text node contains "${substring}"`);
}
