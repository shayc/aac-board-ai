const BOARD_FILE_EXTENSIONS = [".obz", ".obf", ".zip", ".json"] as const;

export const BOARD_FILE_ACCEPT = [
  ...BOARD_FILE_EXTENSIONS,
  "application/zip",
  "application/json",
  "application/octet-stream",
].join(",");

function findBoardFileExtension(fileName: string): string | undefined {
  const name = fileName.toLowerCase();

  return BOARD_FILE_EXTENSIONS.find((extension) => name.endsWith(extension));
}

export function hasBoardFileExtension(file: File): boolean {
  return findBoardFileExtension(file.name) !== undefined;
}

export function stripBoardFileExtension(fileName: string): string {
  const extension = findBoardFileExtension(fileName);

  return extension ? fileName.slice(0, -extension.length) : fileName;
}
