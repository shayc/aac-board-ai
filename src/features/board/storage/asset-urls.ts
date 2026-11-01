import { getAssetBlob } from "./board-content-storage";
import { normalizeAssetPath } from "./boards-db";

// Stored assets are immutable, so a URL stays correct for as long as its board
// set exists. Message parts rely on this to outlive the board they came from.
// Replacing an asset at the same path would need its URL released first.
const urlsBySetId = new Map<string, Map<string, string>>();

export async function getAssetUrl(
  setId: string,
  path: string,
): Promise<string | undefined> {
  const assetPath = normalizeAssetPath(path);
  const cachedUrl = urlsBySetId.get(setId)?.get(assetPath);
  if (cachedUrl) {
    return cachedUrl;
  }

  const blob = await getAssetBlob(setId, assetPath);
  if (!blob) {
    return undefined;
  }

  return cacheAssetUrl(setId, assetPath, blob);
}

function cacheAssetUrl(setId: string, path: string, blob: Blob): string {
  const urls = urlsBySetId.get(setId) ?? new Map<string, string>();
  urlsBySetId.set(setId, urls);

  // A concurrent load of the same asset may have finished during the read.
  const existingUrl = urls.get(path);
  if (existingUrl) {
    return existingUrl;
  }

  const url = URL.createObjectURL(blob);
  urls.set(path, url);

  return url;
}

export function releaseAssetUrlsExcept(setIds: ReadonlySet<string>): void {
  for (const [setId, urls] of urlsBySetId) {
    if (setIds.has(setId)) {
      continue;
    }

    for (const url of urls.values()) {
      URL.revokeObjectURL(url);
    }

    urlsBySetId.delete(setId);
  }
}
