import type { OBFBoard } from "./schema";
import { OBFBoardSchema } from "./schema";

const UTF8_BOM = "\uFEFF";

export function parseOBF(json: string): OBFBoard {
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

export async function loadOBF(file: File): Promise<OBFBoard> {
  const json = await file.text();
  return parseOBF(json);
}

export function validateOBF(data: unknown): OBFBoard {
  const result = OBFBoardSchema.safeParse(data);

  if (!result.success) {
    throw new Error(`Invalid OBF: ${result.error.message}`);
  }

  return result.data;
}

export function stringifyOBF(board: OBFBoard): string {
  return JSON.stringify(board, null, 2);
}
