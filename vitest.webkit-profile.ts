import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const WEBKIT_PROFILE_DIR = fileURLToPath(
  new URL("node_modules/.cache/vitest-webkit-profile", import.meta.url),
);

// A reused profile keeps an HTTP cache of Vite's pre-bundled dependencies, and
// once Vite re-bundles them the stale entries stop the test page from ever
// connecting. Nothing needs to survive between runs.
export default function resetWebKitProfile() {
  rmSync(WEBKIT_PROFILE_DIR, { recursive: true, force: true });
}
