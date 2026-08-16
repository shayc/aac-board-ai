/** Inline 1×1 PNG for tests that need an image source without a network request. */
export const TEST_IMAGE_SRC =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const SAMPLE_BOARDS_DIR = "/src/features/board/testing/sample-boards";

export async function loadTestImageBlob(): Promise<Blob> {
  const response = await fetch(TEST_IMAGE_SRC);

  return response.blob();
}

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
