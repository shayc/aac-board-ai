import { importBoardSets, type ImportResult } from "./board-import";
import {
  BoardFileTooLargeError,
  MAX_BOARD_FILE_BYTES,
  UnsupportedBoardUrlError,
} from "./import-limits";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

function resolveAllowedUrl(url: string): URL {
  let resolved: URL;

  try {
    resolved = new URL(url, window.location.origin);
  } catch {
    throw new UnsupportedBoardUrlError(url);
  }

  if (!ALLOWED_PROTOCOLS.has(resolved.protocol)) {
    throw new UnsupportedBoardUrlError(url);
  }

  return resolved;
}

async function readBoundedBody(response: Response): Promise<Blob> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BOARD_FILE_BYTES) {
    throw new BoardFileTooLargeError();
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    if (blob.size > MAX_BOARD_FILE_BYTES) {
      throw new BoardFileTooLargeError();
    }
    return blob;
  }

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_BOARD_FILE_BYTES) {
      await reader.cancel();
      throw new BoardFileTooLargeError();
    }

    chunks.push(value);
  }

  return new Blob(chunks as BlobPart[], {
    type: response.headers.get("content-type") ?? undefined,
  });
}

export async function importBoardFromUrl(url: string): Promise<ImportResult> {
  const resolved = resolveAllowedUrl(url);
  const response = await fetch(resolved);

  if (!response.ok) {
    throw new Error(`Failed to fetch board: HTTP ${response.status}`);
  }

  const blob = await readBoundedBody(response);
  const filename =
    resolved.pathname.split("/").filter(Boolean).at(-1) ?? "board.obz";

  const file = new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });

  const [result] = await importBoardSets(file);

  return result;
}
