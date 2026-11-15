const BOARD_FILE_EXTENSIONS_BY_MIME_TYPE: Record<string, string[]> = {
  "application/zip": [".obz", ".zip"],
  "application/json": [".obf", ".json"],
};

const BOARD_FILE_EXTENSIONS = Object.values(
  BOARD_FILE_EXTENSIONS_BY_MIME_TYPE,
).flat();

export const BOARD_FILE_ACCEPT = [
  ...BOARD_FILE_EXTENSIONS,
  ...Object.keys(BOARD_FILE_EXTENSIONS_BY_MIME_TYPE),
  "application/octet-stream",
].join(",");

// The OS offers the installed app for these files, so claim only the
// board-specific extensions rather than every .zip and .json file.
export const BOARD_FILE_HANDLER_ACCEPT: Record<string, string[]> = {
  "application/zip": [".obz"],
  "application/json": [".obf"],
};

export function hasBoardFileExtension(file: File): boolean {
  return findBoardFileExtension(file.name) !== undefined;
}

export function stripBoardFileExtension(fileName: string): string {
  const extension = findBoardFileExtension(fileName);

  return extension ? fileName.slice(0, -extension.length) : fileName;
}

function findBoardFileExtension(fileName: string): string | undefined {
  const name = fileName.toLowerCase();

  return BOARD_FILE_EXTENSIONS.find((extension) => name.endsWith(extension));
}
