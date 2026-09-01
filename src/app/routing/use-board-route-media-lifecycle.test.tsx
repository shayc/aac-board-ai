import { hydrateBoard, type HydratedBoard } from "@features/board";
import {
  loadTestImageBlob,
  makeOBFBoard,
  seedBoardSets,
} from "@features/board/testing";
import { assertDefined } from "@shared/testing/assert-defined";
import { StrictMode } from "react";
import {
  createMemoryRouter,
  Outlet,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { BOARD_ROUTE_ID } from "./route-ids";
import { useBoardRouteMediaLifecycle } from "./use-board-route-media-lifecycle";

const SET_ID = "media-lifetime-set";
const IMAGE_PATH = "images/test.png";

interface Gate {
  promise: Promise<void>;
  open(): void;
}

function createGate(): Gate {
  let open: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });

  return { promise, open };
}

function getAbortError(signal: AbortSignal): Error {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException("The operation was aborted", "AbortError");
}

async function waitForGate(gate: Gate, signal: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    function handleAbort() {
      signal.removeEventListener("abort", handleAbort);
      reject(getAbortError(signal));
    }

    if (signal.aborted) {
      handleAbort();
      return;
    }

    signal.addEventListener("abort", handleAbort, { once: true });
    void gate.promise.then(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    });
  });
}

function TestShell() {
  useBoardRouteMediaLifecycle();

  return <Outlet />;
}

function TestHydrateFallback() {
  return null;
}

function TestBoard() {
  const { board } = useLoaderData<HydratedBoard>();
  const imageUrl = board.buttons[0].imageSrc;
  assertDefined(imageUrl);

  return <img src={imageUrl} alt={board.name} />;
}

function isObjectUrlAlive(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    const settle = (result: boolean) => {
      image.onload = null;
      image.onerror = null;
      resolve(result);
    };

    image.onload = () => settle(true);
    image.onerror = () => settle(false);
    image.src = url;
  });
}

function getImageUrl(loadedBoard: HydratedBoard): string {
  const imageUrl = loadedBoard.board.buttons[0].imageSrc;
  assertDefined(imageUrl);

  return imageUrl;
}

function makeBoard(boardId: string, name: string) {
  const obf = makeOBFBoard({
    id: boardId,
    name,
    grid: { rows: 1, columns: 1, order: [["button-1"]] },
    buttons: [{ id: "button-1", label: name, image_id: "image-1" }],
    images: [{ id: "image-1", path: IMAGE_PATH, content_type: "image/png" }],
  });

  return { boardId, name, obf };
}

async function seedBoards(): Promise<void> {
  const pngBlob = await loadTestImageBlob();

  await seedBoardSets([
    {
      setId: SET_ID,
      name: "Media Lifetime",
      rootBoardId: "first",
      boards: [
        makeBoard("first", "First Board"),
        makeBoard("second", "Second Board"),
        makeBoard("third", "Third Board"),
      ],
      assets: [{ path: IMAGE_PATH, blob: pngBlob }],
    },
  ]);
}

test("owns media according to the committed board route", async () => {
  await seedBoards();

  const loadedBoards = new Map<string, HydratedBoard>();
  const gates = new Map([
    ["second", createGate()],
    ["third", createGate()],
  ]);

  async function loader({
    params,
    request,
  }: LoaderFunctionArgs): Promise<HydratedBoard> {
    const boardId = params.boardId;
    assertDefined(boardId);

    const loadedBoard = await hydrateBoard(SET_ID, boardId, request.signal);
    loadedBoards.set(boardId, loadedBoard);

    const gate = gates.get(boardId);
    if (gate) {
      await waitForGate(gate, request.signal);
    }

    request.signal.throwIfAborted();

    return loadedBoard;
  }

  const router = createMemoryRouter(
    [
      {
        path: "/",
        Component: TestShell,
        HydrateFallback: TestHydrateFallback,
        children: [
          { index: true, element: <p>Outside board route</p> },
          {
            id: BOARD_ROUTE_ID,
            path: "boards/:boardId",
            loader,
            Component: TestBoard,
          },
        ],
      },
    ],
    { initialEntries: ["/boards/first"] },
  );

  const screen = await render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );

  await expect
    .element(screen.getByRole("img", { name: "First Board" }))
    .toBeVisible();

  const first = loadedBoards.get("first");
  assertDefined(first);
  const firstUrl = getImageUrl(first);
  expect(await isObjectUrlAlive(firstUrl)).toBe(true);

  const secondNavigation = router.navigate("/boards/second");
  await vi.waitFor(() => expect(loadedBoards.has("second")).toBe(true));

  const second = loadedBoards.get("second");
  assertDefined(second);
  const secondUrl = getImageUrl(second);

  await expect
    .element(screen.getByRole("img", { name: "First Board" }))
    .toBeVisible();
  expect(await isObjectUrlAlive(firstUrl)).toBe(true);
  expect(await isObjectUrlAlive(secondUrl)).toBe(true);

  const thirdNavigation = router.navigate("/boards/third");
  await secondNavigation;
  gates.get("second")?.open();
  await vi.waitFor(() => expect(loadedBoards.has("third")).toBe(true));

  const third = loadedBoards.get("third");
  assertDefined(third);
  const thirdUrl = getImageUrl(third);

  await vi.waitFor(async () => {
    expect(await isObjectUrlAlive(secondUrl)).toBe(false);
  });
  expect(await isObjectUrlAlive(firstUrl)).toBe(true);
  expect(await isObjectUrlAlive(thirdUrl)).toBe(true);

  gates.get("third")?.open();
  await thirdNavigation;
  await expect
    .element(screen.getByRole("img", { name: "Third Board" }))
    .toBeVisible();
  await vi.waitFor(async () => {
    expect(await isObjectUrlAlive(firstUrl)).toBe(false);
  });
  expect(await isObjectUrlAlive(thirdUrl)).toBe(true);

  await router.navigate("/");
  await expect.element(screen.getByText("Outside board route")).toBeVisible();
  await vi.waitFor(async () => {
    expect(await isObjectUrlAlive(thirdUrl)).toBe(false);
  });
});
