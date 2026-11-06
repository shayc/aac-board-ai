import { getAssetBlob } from "./board-content-storage";
import { normalizeAssetPath } from "./boards-db";

// Stored assets are immutable, so a URL stays correct for as long as its board
// set exists. Message parts rely on this to keep their media after leaving the
// board they came from. Replacing an asset at the same path would need its URL
// revoked first.
const urlsByBoardSetId = new Map<string, Map<string, string>>();

export async function getAssetURL(
  boardSetId: string,
  path: string,
): Promise<string | undefined> {
  const normalizedPath = normalizeAssetPath(path);
  const cachedURL = urlsByBoardSetId.get(boardSetId)?.get(normalizedPath);
  if (cachedURL) {
    return cachedURL;
  }

  const blob = await getAssetBlob(boardSetId, normalizedPath);
  if (!blob) {
    return undefined;
  }

  return ensureAssetURL(boardSetId, normalizedPath, blob);
}

function ensureAssetURL(
  boardSetId: string,
  normalizedPath: string,
  blob: Blob,
): string {
  const urlsByPath =
    urlsByBoardSetId.get(boardSetId) ?? new Map<string, string>();
  urlsByBoardSetId.set(boardSetId, urlsByPath);

  // A concurrent load of the same asset may have finished during the read.
  const existingURL = urlsByPath.get(normalizedPath);
  if (existingURL) {
    return existingURL;
  }

  const url = URL.createObjectURL(blob);
  urlsByPath.set(normalizedPath, url);

  return url;
}

export function revokeAssetURLsExcept(boardSetIds: ReadonlySet<string>): void {
  for (const [boardSetId, urlsByPath] of urlsByBoardSetId) {
    if (boardSetIds.has(boardSetId)) {
      continue;
    }

    for (const url of urlsByPath.values()) {
      URL.revokeObjectURL(url);
    }

    urlsByBoardSetId.delete(boardSetId);
  }
}
