import { describe, expect, test, vi } from "vitest";
import { prepareQuietly } from "./prepare-quietly";

describe("prepareQuietly", () => {
  test("invokes prepare", () => {
    const prepare = vi.fn(() => Promise.resolve());

    prepareQuietly({ prepare });

    expect(prepare).toHaveBeenCalledOnce();
  });

  test("swallows a rejection", async () => {
    const prepare = vi.fn(() =>
      Promise.reject(new Error("user activation required")),
    );

    prepareQuietly({ prepare });

    await vi.waitFor(() => expect(prepare).toHaveBeenCalledOnce());
  });
});
