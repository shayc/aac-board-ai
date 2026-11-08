import {
  deriveBoardSetId,
  importBoardFiles,
  type ImportedBoardSet,
} from "./board-import";

// Generous relative to observed boards (~70 MB) while bounding downloads.
export const MAX_BOARD_DOWNLOAD_BYTES = 150 * 1024 * 1024;

type BoardURLErrorCode = "unsupported-scheme" | "download-too-large";

class BoardURLError extends Error {
  readonly code: BoardURLErrorCode;

  constructor(code: BoardURLErrorCode, message: string) {
    super(message);
    this.name = "BoardURLError";
    this.code = code;
  }
}

// The ?board= param is attacker-controlled, so only http(s) may reach fetch —
// schemes like data: would smuggle a payload past any host-based reasoning.
function parseBoardURL(url: string): URL {
  const resolved = new URL(url, window.location.origin);

  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new BoardURLError(
      "unsupported-scheme",
      `Unsupported board URL scheme: ${resolved.protocol}`,
    );
  }

  return resolved;
}

function deriveFileName(url: URL): string {
  return url.pathname.split("/").filter(Boolean).at(-1) ?? "board.obz";
}

export function deriveBoardSetIdFromURL(url: string): string {
  return deriveBoardSetId(deriveFileName(parseBoardURL(url)));
}

export interface DownloadProgress {
  loaded: number;
  total?: number;
}

interface ImportBoardFileFromURLOptions {
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
  onImportStart?: () => void;
}

export async function importBoardFileFromURL(
  url: string,
  { signal, onProgress, onImportStart }: ImportBoardFileFromURLOptions = {},
): Promise<ImportedBoardSet> {
  const boardURL = parseBoardURL(url);
  const blob = await downloadBoard(boardURL, { signal, onProgress });
  signal?.throwIfAborted();
  onImportStart?.();

  const file = new File([blob], deriveFileName(boardURL), {
    type: blob.type || "application/octet-stream",
  });

  // Once local importing starts, let its atomic write finish even if navigation changes.
  const [boardSet] = await importBoardFiles([file]);

  return boardSet;
}

function expectedDownloadBytes(headers: Headers): number | undefined {
  const contentLength = headers.get("content-length");
  if (contentLength === null || headers.has("content-encoding")) {
    return undefined;
  }

  const total = Number(contentLength);

  return Number.isSafeInteger(total) && total > 0 ? total : undefined;
}

async function downloadBoard(
  url: URL,
  {
    signal,
    onProgress,
  }: Pick<ImportBoardFileFromURLOptions, "signal" | "onProgress">,
): Promise<Blob> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to fetch board: HTTP ${response.status}`);
  }

  // A null body has no payload to exceed the download cap.
  const reader = response.body?.getReader();
  if (!reader) {
    return response.blob();
  }

  const total = expectedDownloadBytes(response.headers);
  const chunks: BlobPart[] = [];
  let receivedBytes = 0;
  onProgress?.({ loaded: receivedBytes, total });

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_BOARD_DOWNLOAD_BYTES) {
      await reader.cancel();
      throw new BoardURLError(
        "download-too-large",
        `Board download exceeded ${MAX_BOARD_DOWNLOAD_BYTES} bytes`,
      );
    }

    chunks.push(value);
    onProgress?.({ loaded: receivedBytes, total });
  }

  return new Blob(chunks, {
    type: response.headers.get("content-type") ?? "",
  });
}
