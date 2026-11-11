import { extractOBZ } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import { importBoardFile } from "../import/board-import";
import { listBoardRecords } from "../storage/board-content-storage";
import {
  getBoardSetRecord,
  saveBoardSetTranslations,
} from "../storage/board-set-storage";
import {
  loadFixtureFile,
  loadTestImageBlob,
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "../testing";
import { boardSetToOBZ } from "./board-set-export";

async function importFixtureSet() {
  const { id } = await importBoardFile(
    await loadFixtureFile("lots-of-stuff.obz"),
  );
  const boardSet = await getBoardSetRecord(id);
  if (!boardSet) {
    throw new Error("Fixture set was not imported");
  }

  return boardSet;
}

async function reimport(archive: Blob) {
  const { id } = await importBoardFile(
    new File([archive], "exported.obz", { type: archive.type }),
  );

  return listBoardRecords(id);
}

describe("boardSetToOBZ", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("exports every board and asset, and the archive imports back", async () => {
    const boardSet = await importFixtureSet();
    const storedBoards = await listBoardRecords(boardSet.id);

    const archive = await boardSetToOBZ(boardSet);
    const { rootBoard, resources } = await extractOBZ(archive);
    const reimportedBoards = await reimport(archive);

    expect(rootBoard.id).toBe(boardSet.rootBoardId);
    expect(resources.has("images/happy.png")).toBe(true);
    expect(resources.has("sounds/sigh.mp3")).toBe(true);
    expect(reimportedBoards.map((board) => board.id).sort()).toEqual(
      storedBoards.map((board) => board.id).sort(),
    );
  });

  test("includes the translations saved on this device", async () => {
    const boardSet = await importFixtureSet();
    await saveBoardSetTranslations(boardSet.id, "es", {
      name: "Muchas cosas",
      stringsByBoardId: new Map([
        [boardSet.rootBoardId, new Map([["happy", "feliz"]])],
      ]),
    });

    const { rootBoard } = await extractOBZ(await boardSetToOBZ(boardSet));

    expect(rootBoard.strings?.es).toEqual({ happy: "feliz" });
  });

  test("points board links at the boards' paths inside the archive", async () => {
    const boardSet = await importFixtureSet();

    const { manifest, boards } = await extractOBZ(
      await boardSetToOBZ(boardSet),
    );
    const links = [...boards.values()].flatMap((board) =>
      board.buttons.flatMap((button) =>
        button.load_board ? [button.load_board] : [],
      ),
    );

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.path).toBe(manifest.paths.boards[link.id ?? ""]);
    }
  });

  test("drops the path of media whose file was never stored", async () => {
    const image = {
      id: "img",
      path: "images/missing.png",
      url: "https://example.com/missing.png",
    };
    await seedBoardSets([
      {
        id: "partial",
        rootBoardId: "root",
        boards: [makeOBFBoard({ id: "root", images: [image] })],
      },
    ]);

    const { rootBoard } = await extractOBZ(
      await boardSetToOBZ({ id: "partial", rootBoardId: "root" }),
    );

    expect(rootBoard.images).toEqual([
      { id: "img", url: "https://example.com/missing.png" },
    ]);
  });

  test("packages a stored asset under the path its board declares", async () => {
    const image = { id: "img", path: "/images/photo.png" };
    await seedBoardSets([
      {
        id: "photos",
        rootBoardId: "root",
        boards: [makeOBFBoard({ id: "root", images: [image] })],
        assets: [{ path: "images/photo.png", blob: await loadTestImageBlob() }],
      },
    ]);

    const { resources } = await extractOBZ(
      await boardSetToOBZ({ id: "photos", rootBoardId: "root" }),
    );

    expect(resources.has("/images/photo.png")).toBe(true);
  });
});
