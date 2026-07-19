import { importBoardSets, type ImportResult } from "./board-import";

/**
 * Hard cap on a board download, enforced while the response streams so an
 * oversized transfer is cancelled mid-flight instead of buffered whole.
 * Generous versus real boards (observed up to ~70MB) but bounded — the
 * network-side counterpart of `BOARD_IMPORT_LIMITS`.
 */
export const MAX_BOARD_DOWNLOAD_BYTES = 150 * 1024 * 1024;

type BoardUrlErrorCode = "unsupported-scheme" | "download-too-large";

/** Thrown when a board URL is rejected before or during download. */
class BoardUrlError extends Error {
  readonly code: BoardUrlErrorCode;

  constructor(code: BoardUrlErrorCode, message: string) {
    super(message);
    this.name = "BoardUrlError";
    this.code = code;
  }
}

// The ?board= param is attacker-controlled, so only http(s) may reach fetch —
// schemes like data: would smuggle a payload past any host-based reasoning.
function parseBoardUrl(url: string): URL {
  const resolved = new URL(url, window.location.origin);

  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new BoardUrlError(
      "unsupported-scheme",
      `Unsupported board URL scheme: ${resolved.protocol}`,
    );
  }

  return resolved;
}

function deriveFilename(url: URL): string {
  return url.pathname.split("/").filter(Boolean).at(-1) ?? "board.obz";
}

export async function importBoardFromUrl(url: string): Promise<ImportResult> {
  const boardUrl = parseBoardUrl(url);
  const blob = await downloadBoard(boardUrl);

  const file = new File([blob], deriveFilename(boardUrl), {
    type: blob.type || "application/octet-stream",
  });

  const [result] = await importBoardSets(file);

  return result;
}

async function downloadBoard(url: URL): Promise<Blob> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch board: HTTP ${response.status}`);
  }

  // Not a cap bypass: browsers only leave body null for null-body statuses
  // (e.g. 204), which carry no payload for the size cap to bound.
  const reader = response.body?.getReader();
  if (!reader) {
    return response.blob();
  }

  const chunks: BlobPart[] = [];
  let receivedBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_BOARD_DOWNLOAD_BYTES) {
      await reader.cancel();
      throw new BoardUrlError(
        "download-too-large",
        `Board download exceeded ${MAX_BOARD_DOWNLOAD_BYTES} bytes`,
      );
    }

    chunks.push(value);
  }

  return new Blob(chunks, {
    type: response.headers.get("content-type") ?? "",
  });
}
