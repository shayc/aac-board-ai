import { rmSync } from "node:fs";

export const WEBKIT_PROFILE_DIR = "node_modules/.cache/vitest-webkit-profile";

// A profile reused between runs serves modules its HTTP cache kept from the
// previous run, and carries over that run's stored board sets. Clearing it
// before the browser launches avoids racing WebKit's shutdown for the files.
export function setup() {
  rmSync(WEBKIT_PROFILE_DIR, { recursive: true, force: true });
}
