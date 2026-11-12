import { onTestFinished } from "vitest";
import { page } from "vitest/browser";

export async function setTestViewport(
  width: number,
  height: number,
): Promise<void> {
  const { innerWidth, innerHeight } = window;
  onTestFinished(() => page.viewport(innerWidth, innerHeight));

  await page.viewport(width, height);
}
