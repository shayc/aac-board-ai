import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../types";
import {
  BoardNotFoundError,
  getAssetBlob,
  getBoard,
} from "./board-content-storage";

interface LoadBoardOptions {
  setId: string;
  boardId: string;
  signal?: AbortSignal;
}

export async function loadBoard({
  setId,
  boardId,
  signal,
}: LoadBoardOptions): Promise<Board> {
  signal?.throwIfAborted();
  const record = await getBoard(setId, boardId);
  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  const { obf } = record;
  const paths = new Set(
    [...(obf.images ?? []), ...(obf.sounds ?? [])].flatMap((media) =>
      media.path ? [media.path] : [],
    ),
  );
  const entries = await Promise.all(
    Array.from(paths, async (path) => {
      signal?.throwIfAborted();
      const blob = await readOptionalAsset(setId, path);

      return blob ? [[path, blob] as const] : [];
    }),
  );

  signal?.throwIfAborted();

  // Blobs travel with the runtime snapshot. No URL or route-lifecycle resource
  // is created here, so messages can retain individual assets independently.
  return obfToBoard(obf, new Map(entries.flat()));
}

async function readOptionalAsset(
  setId: string,
  path: string,
): Promise<Blob | undefined> {
  try {
    return await getAssetBlob(setId, path);
  } catch {
    // A missing or unreadable recording/image must not hide the board's text.
    return undefined;
  }
}
