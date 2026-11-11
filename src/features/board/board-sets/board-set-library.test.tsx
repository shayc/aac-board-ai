import { resetBoardsDB, seedBoardSets } from "../testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { extractOBZ } from "@shayc/open-board-format";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { listBoardSetRecords } from "../storage/board-set-storage";
import { closeBoardsDB, getBoardsDB } from "../storage/boards-db";
import { starterBoardSet } from "./board-set-catalog";
import { cancelBoardSetDownload } from "./board-set-downloads";
import { BoardSetLibrary } from "./board-set-library";
import { refreshBoardSets } from "./board-sets-store";

function renderBoardSetLibrary() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <BoardSetLibrary />
      </AppProviders>
    </MemoryRouter>,
  );
}

function stubStreamingDownload(headers?: HeadersInit) {
  let stream!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream = controller;
    },
  });

  vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
    const signal = init?.signal;
    signal?.addEventListener("abort", () => stream.error(signal.reason));

    return new Response(body, { headers });
  });

  return {
    send: (bytes: number | Uint8Array) =>
      stream.enqueue(typeof bytes === "number" ? new Uint8Array(bytes) : bytes),
    finish: () => stream.close(),
  };
}

function recordUnavailableButtons() {
  const buttons: { name: string | null; description?: string }[] = [];

  const observer = new MutationObserver(() => {
    const button = document.querySelector('button[aria-disabled="true"]');
    if (!button) {
      return;
    }

    const descriptionId = button.getAttribute("aria-describedby");
    buttons.push({
      name: button.getAttribute("aria-label"),
      description: descriptionId
        ? document.getElementById(descriptionId)?.textContent
        : undefined,
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  return {
    stop: () => {
      observer.disconnect();
      return buttons;
    },
  };
}

function listedBoardSetNames(screen: RenderResult) {
  return screen
    .getByRole("navigation", { name: "Board sets" })
    .getByRole("listitem")
    .elements()
    .map((row) => row.textContent)
    .filter((name) => name !== "Board sets");
}

describe("BoardSetLibrary", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(async () => {
    await closeBoardsDB();
  });

  describe("listing", () => {
    test("offers the import action and catalog downloads when no sets are stored", async () => {
      const screen = await renderBoardSetLibrary();

      await expect
        .element(screen.getByRole("button", { name: "Import board files" }))
        .toBeInTheDocument();
      await expect
        .element(
          screen
            .getByRole("navigation", { name: "Board sets" })
            .getByRole("button", { name: "Download First Words" }),
        )
        .toBeInTheDocument();
    });

    test("shows an error instead of the empty state when sets cannot be retrieved", async () => {
      const db = await getBoardsDB();
      db.close();
      await refreshBoardSets();

      const screen = await renderBoardSetLibrary();

      await expect
        .element(screen.getByText("Couldn't load library"))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .not.toBeInTheDocument();
    });

    test("hides catalog downloads for board sets that are already stored", async () => {
      await seedBoardSets([
        { id: "first-words", rootBoardId: "root", name: "First Words" },
      ]);

      const screen = await renderBoardSetLibrary();

      await expect
        .element(screen.getByRole("link", { name: "First Words" }))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .not.toBeInTheDocument();
    });

    test("lists stored and downloadable board sets together in name order", async () => {
      await seedBoardSets([
        { id: "zoo", rootBoardId: "root", name: "Zoo" },
        { id: "animals", rootBoardId: "root", name: "Animals" },
      ]);

      const screen = await renderBoardSetLibrary();

      await expect
        .element(screen.getByRole("link", { name: "Zoo" }))
        .toBeInTheDocument();
      expect(listedBoardSetNames(screen)).toEqual([
        "Animals",
        "First Words",
        "Quick Core 24",
        "Quick Core 60",
        "Zoo",
      ]);
    });

    test("lists stored and downloadable board sets with no accessibility violations", async () => {
      await seedBoardSets([
        { id: "animals", rootBoardId: "root", name: "Animals" },
        { id: "core-words", rootBoardId: "root", name: "Core Words" },
      ]);

      const screen = await renderBoardSetLibrary();

      await expect.element(screen.getByText("Board sets")).toBeInTheDocument();
      await expect.element(screen.getByText("Animals")).toBeInTheDocument();
      await expect.element(screen.getByText("Core Words")).toBeInTheDocument();
      await expect.element(screen.getByText("First Words")).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });
  });

  describe("downloading", () => {
    // Downloads outlive the component, so one left pending by a failed
    // assertion would block every later download of the same board set.
    afterEach(() => {
      cancelBoardSetDownload(starterBoardSet.url);
    });

    test("downloads a catalog board set and focuses its new library entry", async () => {
      const screen = await renderBoardSetLibrary();

      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();

      const link = screen.getByRole("link", { name: "First Words" });
      await expect.element(link).toHaveFocus();
      await expect
        .element(screen.getByText('Board set "First Words" downloaded'))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .not.toBeInTheDocument();
    });

    test("keeps a downloaded board set in its place in the list", async () => {
      await seedBoardSets([
        { id: "animals", rootBoardId: "root", name: "Animals" },
        { id: "zoo", rootBoardId: "root", name: "Zoo" },
      ]);

      const screen = await renderBoardSetLibrary();
      await expect
        .element(screen.getByRole("link", { name: "Zoo" }))
        .toBeInTheDocument();
      const namesBeforeDownload = listedBoardSetNames(screen);

      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();

      await expect
        .element(screen.getByRole("link", { name: "First Words" }))
        .toHaveFocus();
      expect(listedBoardSetNames(screen)).toEqual(namesBeforeDownload);
    });

    test("describes how much of a download has arrived", async () => {
      const download = stubStreamingDownload({ "content-length": "2000000" });

      const screen = await renderBoardSetLibrary();
      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();
      download.send(500_000);

      const cancelButton = screen.getByRole("button", {
        name: "Cancel downloading First Words",
      });
      await expect
        .element(cancelButton)
        .toHaveAccessibleDescription("0.5 of 2 MB");
      await expect
        .element(cancelButton)
        .toHaveAttribute("aria-disabled", "false");

      await cancelButton.click();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .toBeInTheDocument();
    });

    test("describes a download of unknown size as in progress without a percentage", async () => {
      const download = stubStreamingDownload();

      const screen = await renderBoardSetLibrary();
      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();
      download.send(500_000);

      const cancelButton = screen.getByRole("button", {
        name: "Cancel downloading First Words",
      });
      await expect
        .element(cancelButton)
        .toHaveAccessibleDescription("Downloading…");
      await expect
        .element(screen.getByRole("progressbar", { includeHidden: true }))
        .not.toHaveAttribute("aria-valuenow");

      await cancelButton.click();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .toBeInTheDocument();
    });

    test("shows an empty progress ring while the download has not responded yet", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            const signal = init?.signal;
            signal?.addEventListener("abort", () => reject(signal.reason));
          }),
      );

      const screen = await renderBoardSetLibrary();
      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();

      await expect
        .element(screen.getByRole("progressbar", { includeHidden: true }))
        .toHaveAttribute("aria-valuenow", "0");

      await screen
        .getByRole("button", { name: "Cancel downloading First Words" })
        .click();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .toBeInTheDocument();
    });

    test("shows download progress with no accessibility violations", async () => {
      const download = stubStreamingDownload({ "content-length": "2000000" });

      const screen = await renderBoardSetLibrary();
      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();
      download.send(500_000);
      await expect
        .element(
          screen.getByRole("button", {
            name: "Cancel downloading First Words",
          }),
        )
        .toHaveAccessibleDescription("0.5 of 2 MB");

      await expectNoA11yViolations(
        screen.getByRole("navigation", { name: "Board sets" }).element(),
      );

      await screen
        .getByRole("button", { name: "Cancel downloading First Words" })
        .click();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .toBeInTheDocument();
    });

    test("cancels a download without storing the board set or reporting an error", async () => {
      const download = stubStreamingDownload({ "content-length": "2000000" });

      const screen = await renderBoardSetLibrary();
      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();
      download.send(500_000);
      await screen
        .getByRole("button", { name: "Cancel downloading First Words" })
        .click();

      const downloadButton = screen.getByRole("button", {
        name: "Download First Words",
      });
      await expect.element(downloadButton).toHaveFocus();
      await expect.element(downloadButton).not.toHaveAccessibleDescription();
      await expect
        .element(screen.getByText(`Couldn't download board set "First Words"`))
        .not.toBeInTheDocument();
      expect(await listBoardSetRecords()).toEqual([]);
    });

    test("keeps the download action when a download fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(null, { status: 500 }),
      );

      const screen = await renderBoardSetLibrary();

      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();

      await expect
        .element(screen.getByText(`Couldn't download board set "First Words"`))
        .toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .toHaveFocus();
      expect(await listBoardSetRecords()).toEqual([]);
    });

    test("marks the button unavailable while a downloaded board set imports", async () => {
      const starterBoardBytes = await fetch("/first-words.obz").then(
        (response) => response.bytes(),
      );
      const download = stubStreamingDownload({
        "content-length": String(starterBoardBytes.byteLength),
      });
      const unavailableButtons = recordUnavailableButtons();

      const screen = await renderBoardSetLibrary();
      await screen
        .getByRole("button", { name: "Download First Words" })
        .click();
      download.send(starterBoardBytes);
      download.finish();

      await expect
        .element(screen.getByRole("link", { name: "First Words" }))
        .toHaveFocus();
      expect(unavailableButtons.stop()).toContainEqual({
        name: "Download First Words",
        description: "Importing…",
      });
    });

    test("focuses a download's entry when it finishes after reopening the library", async () => {
      const starterBoardBytes = await fetch("/first-words.obz").then(
        (response) => response.bytes(),
      );
      const download = stubStreamingDownload({
        "content-length": String(starterBoardBytes.byteLength),
      });

      const closedScreen = await renderBoardSetLibrary();
      await closedScreen
        .getByRole("button", { name: "Download First Words" })
        .click();
      await expect
        .element(
          closedScreen.getByRole("button", {
            name: "Cancel downloading First Words",
          }),
        )
        .toBeInTheDocument();
      await closedScreen.unmount();

      const screen = await renderBoardSetLibrary();
      download.send(starterBoardBytes);
      download.finish();

      await expect
        .element(screen.getByRole("link", { name: "First Words" }))
        .toHaveFocus();
      expect(globalThis.fetch).toHaveBeenCalledOnce();
      expect(await listBoardSetRecords()).toHaveLength(1);
    });

    test("keeps describing download progress after reopening the library", async () => {
      const download = stubStreamingDownload({ "content-length": "2000000" });

      const closedScreen = await renderBoardSetLibrary();
      await closedScreen
        .getByRole("button", { name: "Download First Words" })
        .click();
      download.send(500_000);
      await expect
        .element(
          closedScreen.getByRole("button", {
            name: "Cancel downloading First Words",
          }),
        )
        .toHaveAccessibleDescription("0.5 of 2 MB");
      await closedScreen.unmount();

      const screen = await renderBoardSetLibrary();
      const cancelButton = screen.getByRole("button", {
        name: "Cancel downloading First Words",
      });
      await expect
        .element(cancelButton)
        .toHaveAccessibleDescription("0.5 of 2 MB");

      await cancelButton.click();
      await expect
        .element(screen.getByRole("button", { name: "Download First Words" }))
        .toBeInTheDocument();
      expect(await listBoardSetRecords()).toEqual([]);
    });
  });

  describe("exporting", () => {
    function captureSavedFile(): Promise<File> {
      const { promise, resolve, reject } = Promise.withResolvers<File>();

      // Saving a file is device output; read it back instead of downloading.
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
        function (this: HTMLAnchorElement) {
          const { download } = this;
          void fetch(this.href)
            .then((response) => response.blob())
            .then((blob) => resolve(new File([blob], download)), reject);
        },
      );

      return promise;
    }

    test("saves the set as an OBZ file named after it", async () => {
      await seedBoardSets([
        { id: "animals", rootBoardId: "root", name: "Animals" },
      ]);
      const savedFile = captureSavedFile();

      const screen = await renderBoardSetLibrary();

      await screen
        .getByRole("button", { name: "More options for Animals" })
        .click();
      await screen.getByRole("menuitem", { name: "Export" }).click();

      const file = await savedFile;
      const { rootBoard } = await extractOBZ(file);

      expect(file.name).toBe("Animals.obz");
      expect(rootBoard.id).toBe("root");
    });

    test("reports a set that cannot be exported", async () => {
      await seedBoardSets([
        { id: "broken", rootBoardId: "root", name: "Broken" },
      ]);
      void captureSavedFile();
      const db = await getBoardsDB();
      await db.delete("boards", ["broken", "root"]);

      const screen = await renderBoardSetLibrary();

      await screen
        .getByRole("button", { name: "More options for Broken" })
        .click();
      await screen.getByRole("menuitem", { name: "Export" }).click();

      await expect
        .element(screen.getByText('Couldn\'t export board set "Broken"'))
        .toBeInTheDocument();
    });
  });

  describe("deleting", () => {
    test("deletes a set after confirmation", async () => {
      await seedBoardSets([
        { id: "animals", rootBoardId: "root", name: "Animals" },
      ]);

      const screen = await renderBoardSetLibrary();

      await screen
        .getByRole("button", { name: "More options for Animals" })
        .click();
      await screen.getByRole("menuitem", { name: "Delete" }).click();

      await expect
        .element(screen.getByText("Delete board set?"))
        .toBeInTheDocument();
      await screen.getByRole("button", { name: "Delete" }).click();

      await expect
        .element(screen.getByRole("link", { name: "Animals" }))
        .not.toBeInTheDocument();
    });

    test("keeps the set when the delete dialog is cancelled", async () => {
      await seedBoardSets([
        { id: "animals", rootBoardId: "root", name: "Animals" },
      ]);

      const screen = await renderBoardSetLibrary();

      await screen
        .getByRole("button", { name: "More options for Animals" })
        .click();
      await screen.getByRole("menuitem", { name: "Delete" }).click();
      await screen.getByRole("button", { name: "Cancel" }).click();

      await expect.element(screen.getByText("Animals")).toBeInTheDocument();
      await expect
        .element(screen.getByText("Delete board set?"))
        .not.toBeInTheDocument();
    });
  });
});
