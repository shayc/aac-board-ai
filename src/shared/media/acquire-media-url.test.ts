import { describe, expect, test } from "vitest";
import { acquireMediaUrl } from "./acquire-media-url";

describe("acquireMediaUrl", () => {
  test("retains blob contents through independent URL consumers", async () => {
    const blob = new Blob(["retained content"]);
    const first = acquireMediaUrl(blob);
    const second = acquireMediaUrl(blob);

    expect(await (await fetch(first.url)).text()).toBe("retained content");
    first.release();
    await expect(fetch(first.url)).rejects.toThrow();
    expect(await (await fetch(second.url)).text()).toBe("retained content");

    first.release();
    second.release();
    await expect(fetch(second.url)).rejects.toThrow();

    const later = acquireMediaUrl(blob);
    expect(await (await fetch(later.url)).text()).toBe("retained content");
    later.release();
  });

  test("leaves URL sources unchanged and does not take ownership of them", async () => {
    const source = URL.createObjectURL(new Blob(["external owner"]));
    const media = acquireMediaUrl(source);

    expect(media.url).toBe(source);
    media.release();
    expect(await (await fetch(source)).text()).toBe("external owner");
    URL.revokeObjectURL(source);
  });
});
