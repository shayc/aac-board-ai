import { parseOBF } from "./obf";
import type { Board, Manifest } from "./schema";
import { ManifestSchema } from "./schema";
import { isZip, unzip, zip } from "./zip";

export interface ParsedOBZ {
  manifest: Manifest;
  boards: Map<string, Board>;
  files: Map<string, Uint8Array>;
}

/**
 * Load OBZ package from File
 * @param file - File object
 * @returns Parsed OBZ with manifest, boards, and files
 */
export async function loadOBZ(file: File): Promise<ParsedOBZ> {
  const buffer = await file.arrayBuffer();
  return extractOBZ(buffer);
}

/**
 * Extract OBZ package from ArrayBuffer
 * @param buffer - OBZ file as ArrayBuffer
 * @returns Parsed OBZ with manifest, boards, and files
 */
export async function extractOBZ(buffer: ArrayBuffer): Promise<ParsedOBZ> {
  if (!isZip(buffer)) {
    throw new Error("Invalid OBZ: not a ZIP file");
  }

  const files = await unzip(buffer);

  const manifestBuffer = files.get("manifest.json");
  if (!manifestBuffer) {
    throw new Error("Invalid OBZ: missing manifest.json");
  }

  const manifestText = new TextDecoder().decode(manifestBuffer);
  const manifest = parseManifest(manifestText);

  const boards = new Map<string, Board>();
  for (const [id, path] of Object.entries(manifest.paths.boards)) {
    const boardBuffer = files.get(path);
    if (!boardBuffer) {
      console.warn(`Board ${id} not found at ${path}`);
      continue;
    }

    const boardText = new TextDecoder().decode(boardBuffer);
    const board = parseOBF(boardText);
    
    console.log(`🔍 DEBUG - OBZ extraction: manifest key="${id}", board.id="${board.id}", path="${path}"`);
    
    boards.set(id, board);
  }

  return { manifest, boards, files };
}

/**
 * Parse manifest.json from OBZ package
 * @param json - Manifest JSON string
 * @returns Validated Manifest object
 */
export function parseManifest(json: string): Manifest {
  const data = JSON.parse(json) as unknown;
  const result = ManifestSchema.safeParse(data);

  if (!result.success) {
    throw new Error(`Invalid manifest: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Create OBZ package from boards and resources
 * @param boards - Array of Board objects
 * @param rootBoardId - ID of the root board
 * @param resources - Optional map of resource paths to buffers
 * @returns OBZ package as Blob
 */
export async function createOBZ(
  boards: Board[],
  rootBoardId: string,
  resources?: Map<string, Uint8Array | ArrayBuffer>
): Promise<Blob> {
  const files = new Map<string, Uint8Array | ArrayBuffer>();

  // Create and validate manifest
  const manifest = ManifestSchema.parse({
    format: "open-board-0.1",
    root: `boards/${rootBoardId}.obf`,
    paths: {
      boards: Object.fromEntries(
        boards.map((board) => [board.id, `boards/${board.id}.obf`])
      ),
      images: {},
      sounds: {},
    },
  });

  // Add manifest.json
  const manifestJSON = JSON.stringify(manifest, null, 2);
  files.set("manifest.json", new TextEncoder().encode(manifestJSON).buffer);

  // Add board files
  for (const board of boards) {
    const boardJSON = JSON.stringify(board, null, 2);
    const path = `boards/${board.id}.obf`;
    files.set(path, new TextEncoder().encode(boardJSON).buffer);
  }

  // Add resource files
  if (resources) {
    for (const [path, buffer] of resources.entries()) {
      files.set(path, buffer);
    }
  }

  // Create ZIP
  const zipBuffer = await zip(files);
  return new Blob([new Uint8Array(zipBuffer)], { type: "application/zip" });
}
