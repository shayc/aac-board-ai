import { routePatterns } from "./perf-names";

function matchesPattern(pathSegments: string[], pattern: string): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);

  return (
    patternSegments.length === pathSegments.length &&
    patternSegments.every(
      (segment, index) =>
        segment.startsWith(":") || segment === pathSegments[index],
    )
  );
}

export function routeOf(pathname: string): string {
  const pathSegments = pathname.split("/").filter(Boolean);
  const pattern = routePatterns.find((candidate) =>
    matchesPattern(pathSegments, candidate),
  );

  return pattern ?? (pathSegments.length === 0 ? "/" : "(other)");
}

export function sanitizeURL(rawURL: string | undefined): string {
  if (!rawURL) {
    return "";
  }

  let url: URL;
  try {
    url = new URL(rawURL, location.href);
  } catch {
    return "(invalid)";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return url.protocol;
  }

  if (url.origin !== location.origin) {
    return url.origin;
  }

  const route = routeOf(url.pathname);

  return route === "(other)" ? url.pathname : route;
}

const HASHED_CLASS = /^(css|muiltr|muirtl)-/;

function describeNode(element: Element): string {
  const role = element.getAttribute("role");
  const classes = Array.from(element.classList)
    .filter((name) => !HASHED_CLASS.test(name))
    .slice(0, 2);

  return [
    element.localName,
    role ? `[role=${role}]` : "",
    ...classes.map((name) => `.${name}`),
  ].join("");
}

export function describeElement(node: Node | null | undefined): string {
  const element = node instanceof Element ? node : node?.parentElement;
  if (!element) {
    return "";
  }

  const parent = element.parentElement?.closest("[role]");

  return parent && parent !== element
    ? `${describeNode(parent)} > ${describeNode(element)}`
    : describeNode(element);
}
