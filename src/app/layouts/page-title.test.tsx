import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { PageTitle } from "./page-title";
import { usePageTitle } from "./page-title-store";

function PageTitleProbe() {
  const title = usePageTitle();

  return <p>title: "{title}"</p>;
}

describe("PageTitle", () => {
  test("renders a title element with the given text", async () => {
    await render(<PageTitle>Board Library</PageTitle>);

    await expect.poll(() => document.title).toBe("Board Library");
  });

  test("usePageTitle reflects the rendered title", async () => {
    const screen = await render(
      <>
        <PageTitle>Board Library</PageTitle>
        <PageTitleProbe />
      </>,
    );

    await expect
      .element(screen.getByText('title: "Board Library"'))
      .toBeInTheDocument();
  });

  test("clears the title from the store on unmount", async () => {
    const screen = await render(
      <>
        <PageTitle>Board Library</PageTitle>
        <PageTitleProbe />
      </>,
    );

    await expect
      .element(screen.getByText('title: "Board Library"'))
      .toBeInTheDocument();

    await screen.unmount();

    const second = await render(<PageTitleProbe />);
    await expect.element(second.getByText('title: ""')).toBeInTheDocument();
  });

  test("renders nothing when there are no children", async () => {
    const screen = await render(<PageTitle>{undefined}</PageTitle>);

    expect(screen.container.textContent).toBe("");
  });
});
