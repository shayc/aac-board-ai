import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { computeSnapMetrics, type SnapMetrics } from "./grid-metrics";

/**
 * Observes a scroll container and reports scroll-snap geometry for the board
 * inside it. The board is never reflowed — every button keeps its authored
 * position; this only decides where snap points go and which axes snap.
 *
 * The arithmetic lives in {@link computeSnapMetrics}; this hook only handles the
 * DOM measurement (size + overflow) on resize.
 */
export function useGridSnap(
  scrollRef: RefObject<HTMLElement | null>,
  columns: number,
  rows: number,
  gap = 2,
): SnapMetrics {
  const theme = useTheme();
  // Gap between cells in px, from the same theme spacing the grid uses.
  const gapPx = Number.parseFloat(theme.spacing(gap)) || gap * 8;

  const [metrics, setMetrics] = useState<SnapMetrics>({
    snapColumns: columns,
    snapRows: rows,
    snapType: "none",
  });

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setMetrics(
        computeSnapMetrics({
          clientWidth: element.clientWidth,
          clientHeight: element.clientHeight,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
          columns,
          rows,
          gapPx,
        }),
      );
    };

    // ResizeObserver delivers an initial callback on observe(), which performs
    // the first measurement — so we avoid a synchronous setState in the effect.
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [scrollRef, columns, rows, gapPx]);

  return metrics;
}
