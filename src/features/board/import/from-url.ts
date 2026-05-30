import { importBoardFiles, type ImportResult } from "./board-import";

export async function importBoardFromUrl(url: string): Promise<ImportResult> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch board: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const pathname = new URL(url, window.location.origin).pathname;
  const filename = pathname.split("/").at(-1) ?? "board.obz";

  const file = new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });

  const [result] = await importBoardFiles(file);

  return result;
}
