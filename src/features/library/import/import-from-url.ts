import {
  deriveBoardSetId,
  importBoardFile,
  type ImportedBoardSet,
} from "./board-file-import";

export const MAX_BOARD_FILE_DOWNLOAD_BYTES = 150 * 1024 * 1024;

type BoardFileURLErrorCode =
  | "unsupported-scheme"
  | "redirect"
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
  if (!isAllowedBoardFileURL(resolved)) {
    throw new BoardFileURLError(
      "unsupported-scheme",
      `Unsupported board file URL scheme: ${resolved.protocol}`,
    );
  }

  return resolved;
}

// Matches the CSP connect-src ('self' https:) in netlify.toml.
function isAllowedBoardFileURL(url: URL): boolean {
  return (
    url.protocol === "https:" ||
    (url.protocol === "http:" && url.origin === window.location.origin)
  );
}

export function deriveBoardSetIdFromURL(url: string): string {
  return deriveBoardSetId(deriveFileName(parseBoardFileURL(url)));
}

function deriveFileName(url: URL): string {
  const lastSegment = url.pathname.split("/").filter(Boolean).at(-1);

  return lastSegment ? decodePathSegment(lastSegment) : "board.obz";
}

// A malformed escape such as "%E0" is kept as typed rather than failing the import.
function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export interface DownloadProgress {
  loaded: number;
  total?: number;
}

interface ImportFromURLOptions {
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
  onImportStart?: () => void;
}

export async function importBoardFileFromURL(
  url: string,
  { signal, onProgress, onImportStart }: ImportFromURLOptions = {},
): Promise<ImportedBoardSet> {
  const boardFileURL = parseBoardFileURL(url);
  const blob = await downloadBoardFile(boardFileURL, { signal, onProgress });
  signal?.throwIfAborted();
  onImportStart?.();

  const file = new File([blob], deriveFileName(boardFileURL), {
    type: blob.type || "application/octet-stream",
  });

  return importBoardFile(file);
}

async function downloadBoardFile(
  url: URL,
  { signal, onProgress }: Pick<ImportFromURLOptions, "signal" | "onProgress">,
): Promise<Blob> {
  const response = await fetch(url, { signal, redirect: "manual" });
  if (response.type === "opaqueredirect") {
    throw new BoardFileURLError(
      "redirect",
      `Board file URL on ${url.host} answered with a redirect`,
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch board file: HTTP ${response.status}`);
  }

  const total = expectedDownloadBytes(response.headers);
  assertWithinSizeCap(total, response);

  const reader = response.body?.getReader();
  if (!reader) {
    return response.blob();
  }

  const chunks = await readWithinSizeCap(reader, (loaded) =>
    onProgress?.({ loaded, total }),
  );

  return new Blob(chunks, {
    type: response.headers.get("content-type") ?? "",
  });
}

function expectedDownloadBytes(headers: Headers): number | undefined {
  const contentLength = headers.get("content-length");
  if (contentLength === null || headers.has("content-encoding")) {
    return undefined;
  }

  const total = Number(contentLength);

  return Number.isSafeInteger(total) && total > 0 ? total : undefined;
}

function assertWithinSizeCap(
  total: number | undefined,
  response: Response,
): void {
  if (total === undefined || total <= MAX_BOARD_FILE_DOWNLOAD_BYTES) {
    return;
  }

  void response.body?.cancel();
  throw downloadTooLargeError();
}

// The declared size can be missing or wrong, so the cap counts received bytes.
async function readWithinSizeCap(
  reader: ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>,
  onReceived: (receivedBytes: number) => void,
): Promise<BlobPart[]> {
  const chunks: BlobPart[] = [];
  let receivedBytes = 0;
  onReceived(receivedBytes);

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return chunks;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_BOARD_FILE_DOWNLOAD_BYTES) {
      await reader.cancel();
      throw downloadTooLargeError();
    }

    chunks.push(value);
    onReceived(receivedBytes);
  }
}

function downloadTooLargeError(): BoardFileURLError {
  return new BoardFileURLError(
    "download-too-large",
    `Board file download exceeded ${MAX_BOARD_FILE_DOWNLOAD_BYTES} bytes`,
  );
}
