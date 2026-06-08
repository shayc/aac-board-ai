import { describe, expect, it } from "vitest";
import { computeSnapMetrics, type SnapMetricsInput } from "./grid-metrics";

// 72px cells with a 16px gap => 88px pitch.
const base: SnapMetricsInput = {
  clientWidth: 400,
  clientHeight: 600,
  scrollWidth: 400,
  scrollHeight: 600,
  columns: 4,
  rows: 6,
  gapPx: 16,
};

describe("computeSnapMetrics", () => {
  it("does not snap when the board fits both axes", () => {
    const metrics = computeSnapMetrics(base);

    expect(metrics.snapType).toBe("none");
    expect(metrics.snapColumns).toBe(4);
    expect(metrics.snapRows).toBe(6);
  });

  it("snaps on the x axis for a wide board", () => {
    const metrics = computeSnapMetrics({
      ...base,
      columns: 14,
      clientWidth: 360,
      scrollWidth: 1248, // 14*72 + 13*16 + 32 padding
    });

    expect(metrics.snapType).toBe("x mandatory");
    expect(metrics.snapColumns).toBe(4);
  });

  it("snaps on the y axis for a tall board", () => {
    const metrics = computeSnapMetrics({
      ...base,
      rows: 20,
      scrollHeight: 1776, // 20*72 + 19*16 + 32 padding
    });

    expect(metrics.snapType).toBe("y mandatory");
    expect(metrics.snapRows).toBe(7);
  });

  it("snaps on both axes when both overflow", () => {
    const metrics = computeSnapMetrics({
      ...base,
      columns: 14,
      rows: 20,
      clientWidth: 360,
      scrollWidth: 1248,
      scrollHeight: 1776,
    });

    expect(metrics.snapType).toBe("both mandatory");
    expect(metrics.snapColumns).toBe(4);
    expect(metrics.snapRows).toBe(7);
  });

  it("counts the last partially-visible column correctly (no off-by-one)", () => {
    // 360px / 88px pitch fits 4 cells (4*72 + 3*16 = 336 <= 360), not 3.
    const metrics = computeSnapMetrics({
      ...base,
      columns: 14,
      clientWidth: 360,
      scrollWidth: 1248,
    });

    expect(metrics.snapColumns).toBe(4);
  });

  it("never reports more snap stride than authored cells", () => {
    const metrics = computeSnapMetrics({
      ...base,
      columns: 2,
      rows: 2,
    });

    expect(metrics.snapColumns).toBe(2);
    expect(metrics.snapRows).toBe(2);
  });

  it("clamps to at least one cell per page", () => {
    const metrics = computeSnapMetrics({
      ...base,
      columns: 14,
      clientWidth: 0,
      scrollWidth: 1248,
    });

    expect(metrics.snapColumns).toBe(1);
  });
});
