import type { OBFBoard } from "@shayc/open-board-format";

/** Paths are returned as the boards spell them, which is how media look them up. */
export function collectMediaPaths(boards: readonly OBFBoard[]): Set<string> {
  const paths = new Set<string>();

  for (const board of boards) {
    for (const media of [...(board.images ?? []), ...(board.sounds ?? [])]) {
      if (media.path) {
        paths.add(media.path);
      }
    }
  }

  return paths;
}
