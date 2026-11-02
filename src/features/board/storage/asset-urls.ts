import { getAssetBlob } from "./board-content-storage";
import { normalizeAssetPath } from "./boards-db";

// Stored assets are immutable, so a URL stays correct for as long as its board
// set exists. Message parts rely on this to keep their media after leaving the
// board they came from. Replacing an asset at the same path would need its URL
// revoked first.
const urlsByBoardSetId = new Map<string, Map<string, string>>();

export async function getAssetUrl(
  boardSetId: string,
  path: string,
): Promise<string | undefined> {
  const normalizedPath = normalizeAssetPath(path);
  const cachedUrl = urlsByBoardSetId.get(boardSetId)?.get(normalizedPath);
  if (cachedUrl) {
    return cachedUrl;
  }

  const blob = await getAssetBlob(boardSetId, normalizedPath);
  if (!blob) {
    return undefined;
  }

  return ensureAssetUrl(boardSetId, normalizedPath, blob);
}

function ensureAssetUrl(
  boardSetId: string,
  normalizedPath: string,
  blob: Blob,
): string {
  const urlsByPath =
    urlsByBoardSetId.get(boardSetId) ?? new Map<string, string>();
  urlsByBoardSetId.set(boardSetId, urlsByPath);

  // A concurrent load of the same asset may have finished during the read.
  const existingUrl = urlsByPath.get(normalizedPath);
  if (existingUrl) {
    return existingUrl;
  }

  const url = URL.createObjectURL(blob);
  urlsByPath.set(normalizedPath, url);

  return url;
}

export function revokeAssetUrlsExcept(boardSetIds: ReadonlySet<string>): void {
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
