/** Empty when the path names no file; no asset is stored under an empty path. */
export function normalizeAssetPath(rawPath: string): string {
  return rawPath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");
}
