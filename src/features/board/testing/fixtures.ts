/**
 * Minimal valid 1x1 transparent PNG as data URI.
 * Use this in tests that need an image src to avoid network requests.
 */
export const TEST_IMAGE_SRC =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SAMPLE_BOARDS_DIR = "/src/features/board/testing/sample-boards";

/**
 * Loads a board file from sample-boards/ off the test server as a File,
 * ready to feed into import flows.
 */
export async function loadFixtureFile(name: string): Promise<File> {
  const response = await fetch(`${SAMPLE_BOARDS_DIR}/${name}`);

  if (!response.ok) {
    throw new Error(`Failed to load test fixture: ${response.status}`);
  }

  const blob = await response.blob();

  return new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
}
