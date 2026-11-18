import { beforeEach, describe, expect, onTestFinished, test, vi } from "vitest";
import { getBoardSetRecord } from "../storage/board-set-storage";
import {
  makeBoardSetInput,
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "../testing";
import { addBoardSet, saveBoardSetTranslations } from "./board-sets-store";

function listenForSync(): Promise<void> {
  const channel = new BroadcastChannel("board-sets-sync");
  onTestFinished(() => channel.close());

  const { promise, resolve } = Promise.withResolvers<void>();
  channel.addEventListener("message", () => resolve(), { once: true });

  return promise;
}

beforeEach(async () => {
  await resetBoardsDB();
});

describe("addBoardSet", () => {
  test("asks the browser to keep stored boards only once a board set is stored", async () => {
    const persist = vi
      .spyOn(navigator.storage, "persist")
      .mockResolvedValue(true);

    await expect(
      addBoardSet(makeBoardSetInput({ rootBoardId: "missing" })),
    ).rejects.toThrow("Root board not found");

    expect(persist).not.toHaveBeenCalled();

    await addBoardSet(makeBoardSetInput());

    expect(persist).toHaveBeenCalledOnce();
  });

  test("stores a board set without asking to persist outside a secure context", async () => {
    vi.spyOn(window, "isSecureContext", "get").mockReturnValue(false);
    const persist = vi.spyOn(navigator.storage, "persist");

    await addBoardSet(makeBoardSetInput({ id: "insecure" }));

    expect(persist).not.toHaveBeenCalled();
    expect(await getBoardSetRecord("insecure")).toBeDefined();
  });
});

describe("saveBoardSetTranslations", () => {
  test("tells other tabs to refresh their board sets", async () => {
    await seedBoardSets([
      {
        id: "food",
        name: "Food",
        rootBoardId: "home",
        boards: [makeOBFBoard({ id: "home", name: "Home" })],
      },
    ]);
    const sync = listenForSync();

    await saveBoardSetTranslations("food", "es", {
      name: "Comida",
      translationsByBoardId: new Map([["home", new Map([["Home", "Inicio"]])]]),
    });

    await expect(sync).resolves.toBeUndefined();
  });
});
