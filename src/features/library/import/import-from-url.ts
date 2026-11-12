import {
  deriveBoardSetId,
  importBoardFile,
  type ImportedBoardSet,
} from "./board-file-import";

export const MAX_BOARD_FILE_DOWNLOAD_BYTES = 150 * 1024 * 1024;

type BoardFileURLErrorCode =
  | "unsupported-scheme"
  | "cross-host-redirect"
  | "download-too-large";

class BoardFileURLError extends Error {
  readonly code: BoardFileURLErrorCode;

  constructor(code: BoardFileURLErrorCode, message: string) {
    super(message);
    this.name = "BoardFileURLError";
    this.code = code;
  }
}

// The ?board= param is attacker-controlled and confirmed by its host, so only
// http(s) may reach fetch. Schemes such as data: carry a payload with no host.
export function parseBoardFileURL(url: string): URL {
  const resolved = new URL(url, window.location.origin);

  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    throw new BoardFileURLError(
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
  return deriveBoardSetId(deriveFileName(parseBoardFileURL(url)));
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
  const fileURL = parseBoardFileURL(url);
  const blob = await downloadBoardFile(fileURL, { signal, onProgress });
  signal?.throwIfAborted();
  onImportStart?.();

  const file = new File([blob], deriveFileName(fileURL), {
    type: blob.type || "application/octet-stream",
  });

  // Once local importing starts, let its atomic write finish even if navigation changes.
  return importBoardFile(file);
}

function expectedDownloadBytes(headers: Headers): number | undefined {
  const contentLength = headers.get("content-length");
  if (contentLength === null || headers.has("content-encoding")) {
    return undefined;
  }

  const total = Number(contentLength);

  return Number.isSafeInteger(total) && total > 0 ? total : undefined;
}

function assertSameHost(requestedURL: URL, response: Response): void {
  const servedHost = new URL(response.url).host;
  if (servedHost === requestedURL.host) {
    return;
  }

  void response.body?.cancel();
  throw new BoardFileURLError(
    "cross-host-redirect",
    `Board URL redirected from ${requestedURL.host} to ${servedHost}`,
  );
}

async function downloadBoardFile(
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

  // The response must come from the host the user confirmed.
  if (response.redirected) {
    assertSameHost(url, response);
  }

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
    if (receivedBytes > MAX_BOARD_FILE_DOWNLOAD_BYTES) {
      await reader.cancel();
      throw new BoardFileURLError(
        "download-too-large",
        `Board download exceeded ${MAX_BOARD_FILE_DOWNLOAD_BYTES} bytes`,
      );
    }

    chunks.push(value);
    onProgress?.({ loaded: receivedBytes, total });
  }

  return new Blob(chunks, {
    type: response.headers.get("content-type") ?? "",
  });
}
