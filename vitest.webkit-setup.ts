import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// A profile reused between runs serves modules its HTTP cache kept from the
// previous run, and carries over that run's stored board sets.
export const WEBKIT_PROFILE_DIR = join(
  tmpdir(),
  `vitest-webkit-${process.pid}`,
);

export function teardown() {
  rmSync(WEBKIT_PROFILE_DIR, { recursive: true, force: true });
}
