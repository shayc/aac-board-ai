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
export function createTestAudioBlob(): Blob {
  // One second of decodable, silent 8-bit mono PCM. Invalid media would trigger
  // Chromium's real error event even when HTMLAudioElement.play is stubbed.
  const bytes = new Uint8Array(8044);
  const header = new DataView(bytes.buffer);
  const encoder = new TextEncoder();
  bytes.set(encoder.encode("RIFF"), 0);
  header.setUint32(4, bytes.length - 8, true);
  bytes.set(encoder.encode("WAVEfmt "), 8);
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, 8000, true);
  header.setUint32(28, 8000, true);
  header.setUint16(32, 1, true);
  header.setUint16(34, 8, true);
  bytes.set(encoder.encode("data"), 36);
  header.setUint32(40, 8000, true);
  bytes.fill(128, 44);

  return new Blob([bytes], { type: "audio/wav" });
}
