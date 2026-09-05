import { StrictMode } from "react";
import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { MediaSource } from "./media-source";
import { createImageRef } from "./image-ref";

function ImageConsumer({ source }: { source: MediaSource }) {
  return <img ref={createImageRef(source)} alt="Preview" />;
}

test("releases replaced and unmounted URLs while surviving Strict Mode replay", async () => {
  const first = new Blob(["first"]);
  const second = new Blob(["second"]);
  const screen = await render(
    <StrictMode>
      <ImageConsumer source={first} />
    </StrictMode>,
  );
  const output = screen.getByRole("img", { name: "Preview" });
  await expect
    .element(output)
    .toHaveAttribute("src", expect.stringContaining("blob:"));
  const firstUrl = output.element().getAttribute("src") ?? "";
  expect(await (await fetch(firstUrl)).text()).toBe("first");

  await screen.rerender(
    <StrictMode>
      <ImageConsumer source={second} />
    </StrictMode>,
  );
  await expect
    .poll(() => output.element().getAttribute("src"))
    .not.toBe(firstUrl);
  const secondUrl = output.element().getAttribute("src") ?? "";
  expect(await (await fetch(secondUrl)).text()).toBe("second");
  await expect(fetch(firstUrl)).rejects.toThrow();

  await screen.unmount();
  await expect(fetch(secondUrl)).rejects.toThrow();
});
