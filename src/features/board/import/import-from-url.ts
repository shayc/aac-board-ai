import { importBoardSets, type BoardSetImportResult } from "./board-import";

/**
 * Hard cap on a board download, enforced while the response streams so an
 * oversized transfer is cancelled mid-flight instead of buffered whole.
 * Generous versus real boards (observed up to ~70MB) but bounded — the
 * network-side counterpart of `BOARD_IMPORT_LIMITS`.
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

export async function importBoardSetFromUrl(
  url: string,
  signal?: AbortSignal,
): Promise<BoardSetImportResult> {
  const boardUrl = parseBoardUrl(url);
  const blob = await downloadBoard(boardUrl, signal);
  signal?.throwIfAborted();

  const file = new File([blob], deriveFilename(boardUrl), {
    type: blob.type || "application/octet-stream",
  });

  // Once local importing starts, let its atomic write finish even if navigation changes.
  const [result] = await importBoardSets(file);

  return result;
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
