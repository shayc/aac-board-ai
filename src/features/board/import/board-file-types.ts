export const BOARD_FILE_EXTENSIONS = [".obz", ".obf", ".zip", ".json"] as const;

export const BOARD_FILE_ACCEPT = [
  ...BOARD_FILE_EXTENSIONS,
  "application/zip",
  "application/json",
  "application/octet-stream",
].join(",");

export function isBoardFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return BOARD_FILE_EXTENSIONS.some((extension) => name.endsWith(extension));
}
