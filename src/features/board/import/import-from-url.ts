import { importBoardSets, type ImportedBoardSet } from "./board-import";

/**
 * Enforced while the response streams, so an oversized download is cancelled
 * instead of buffered. Like `BOARD_IMPORT_LIMITS`, it sits well above observed
 * boards (~70 MB) while bounding memory.
 */
export const MAX_BOARD_DOWNLOAD_BYTES = 150 * 1024 * 1024;

type BoardUrlErrorCode = "unsupported-scheme" | "download-too-large";

class BoardUrlError extends Error {
  readonly code: BoardUrlErrorCode;

  constructor(code: BoardUrlErrorCode, message: string) {
    super(message);
    this.name = "BoardUrlError";
    this.code = code;
  }
}

// Board URLs come from untrusted links, so only http(s) may reach fetch;
// schemes like data: would let a link carry its own payload.
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

function deriveFileName(url: URL): string {
  return url.pathname.split("/").filter(Boolean).at(-1) ?? "board.obz";
}

export async function importBoardSetFromUrl(
  url: string,
  signal?: AbortSignal,
): Promise<ImportedBoardSet> {
  const boardUrl = parseBoardUrl(url);
  const blob = await downloadBoard(boardUrl, signal);
  signal?.throwIfAborted();

  const file = new File([blob], deriveFileName(boardUrl), {
    type: blob.type || "application/octet-stream",
  });

  // Once local importing starts, its atomic write finishes even if navigation
  // changes.
  const [boardSet] = await importBoardSets(file);

  return boardSet;
}

async function downloadBoard(url: URL, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch board: HTTP ${response.status}`);
  }

  // A null body has no payload to exceed the download cap.
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
