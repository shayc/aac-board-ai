import type { Board } from "./schema";
import { BoardSchema } from "./schema";

const UTF8_BOM = "\uFEFF";

export function parseOBF(json: string): Board {
  const trimmed = json.startsWith(UTF8_BOM) ? json.slice(1) : json;

  let data: unknown;
  try {
    data = JSON.parse(trimmed) as unknown;
  } catch (error) {
    throw new Error(
      `Invalid OBF: JSON parse failed${
        (error as Error)?.message ? ` — ${(error as Error).message}` : ""
      }`
    );
  }

  return validateOBF(data);
}

export async function loadOBF(file: File): Promise<Board> {
  const json = await file.text();
  return parseOBF(json);
}

export function validateOBF(data: unknown): Board {
  const result = BoardSchema.safeParse(data);

  if (!result.success) {
    throw new Error(`Invalid OBF: ${result.error.message}`);
  }

  return result.data;
}

export function stringifyOBF(board: Board): string {
  return JSON.stringify(board, null, 2);
}
