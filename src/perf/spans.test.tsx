import { useState } from "react";
import {
  createMemoryRouter,
  Link,
  useLoaderData,
  type RouteObject,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeAll, describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { beginWindow, takeSnapshot, waitForSpan } from "./perf-store";
import { ProfiledSubtree } from "./profiled-subtree";
import { routerInstrumentation, trackInputEvents, useSpan } from "./spans";

function MessageCounter() {
  const [count, setCount] = useState(0);
  const span = useSpan("flow:message:add-tile", count);

  function addTile() {
    span.start();
    setCount(count + 1);
  }

  return <button onClick={addTile}>Parts: {count}</button>;
}

function ImportButton({ onImport }: { onImport: () => void }) {
  const span = useSpan("flow:library:import");

  return (
    <button
      onClick={() => {
        span.start();
        onImport();
      }}
    >
      Import
    </button>
  );
}

function Library() {
  const [boardSetCount, setBoardSetCount] = useState(0);

  useSpan("flow:library:import", boardSetCount);

  return (
    <>
      <ImportButton onImport={() => setBoardSetCount(boardSetCount + 1)} />
      <p>Board sets: {boardSetCount}</p>
    </>
  );
}

function BoardRoute() {
  const boardName = useLoaderData<string>();

  useSpan("route:board:open", boardName);

  return (
    <>
      <h1>{boardName}</h1>
      <Link to="/sets/core/boards/eat">Open eat</Link>
    </>
  );
}

const routes: RouteObject[] = [
  {
    path: "/sets/:boardSetId/boards/:boardId",
    loader: ({ params }) => params.boardId ?? "",
    HydrateFallback: () => null,
    Component: BoardRoute,
  },
];

describe("spans", () => {
  beforeAll(() => {
    trackInputEvents();
  });

  test("end at the paint after the result commits, starting at the input", async () => {
    const since = beginWindow();
    const screen = await render(<MessageCounter />);

    await screen.getByRole("button", { name: "Parts: 0" }).click();
    const span = await waitForSpan("flow:message:add-tile", since);

    await expect
      .element(screen.getByRole("button", { name: "Parts: 1" }))
      .toBeVisible();
    expect(span.startTime).toBeGreaterThanOrEqual(since);
    expect(span.commitTime).toBeGreaterThanOrEqual(span.startTime);
    expect(span.endTime).toBeGreaterThanOrEqual(span.commitTime);
    expect(
      performance.getEntriesByName("flow:message:add-tile", "measure"),
    ).not.toHaveLength(0);
  });

  test("can start in one component and end where the result renders", async () => {
    const since = beginWindow();
    const screen = await render(<Library />);

    await screen.getByRole("button", { name: "Import" }).click();
    const span = await waitForSpan("flow:library:import", since);

    await expect.element(screen.getByText("Board sets: 1")).toBeVisible();
    expect(span.endTime).toBeGreaterThan(span.startTime);
  });

  test("time route changes from navigation to the new board's paint", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/sets/core/boards/home"],
      instrumentations: [routerInstrumentation],
    });
    const screen = await render(<RouterProvider router={router} />);
    await expect
      .element(screen.getByRole("heading", { name: "home" }))
      .toBeVisible();
    const since = beginWindow();

    await screen.getByRole("link", { name: "Open eat" }).click();
    const span = await waitForSpan("route:board:open", since);

    await expect
      .element(screen.getByRole("heading", { name: "eat" }))
      .toBeVisible();
    expect(span.endTime).toBeGreaterThan(span.startTime);
  });

  test("profiled subtrees record renders with their parent", async () => {
    const since = beginWindow();

    await render(
      <ProfiledSubtree id="App">
        <ProfiledSubtree id="Grid">
          <p>Tiles</p>
        </ProfiledSubtree>
      </ProfiledSubtree>,
    );

    const renders = takeSnapshot().renders.filter(
      (render) => render.commitTime >= since,
    );
    expect(renders).toContainEqual(
      expect.objectContaining({ id: "Grid", parent: "App", phase: "mount" }),
    );
    expect(renders).toContainEqual(
      expect.objectContaining({ id: "App", parent: undefined }),
    );
  });
});
