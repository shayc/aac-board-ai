import { beforeEach, describe, expect, onTestFinished, test } from "vitest";
import { makeOBFBoard, resetBoardsDB, seedBoardSets } from "../testing";
import { saveBoardSetTranslations } from "./board-sets-store";

function listenForSync(): Promise<void> {
  const channel = new BroadcastChannel("board-sets-sync");
  onTestFinished(() => channel.close());

  const { promise, resolve } = Promise.withResolvers<void>();
  channel.addEventListener("message", () => resolve(), { once: true });

  return promise;
}

describe("saveBoardSetTranslations", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

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
