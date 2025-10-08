import { useState } from "react";

export function useGrid<TItem>(
  items: TItem[],
  options: {
    rows: number;
    columns: number;
  }
) {
  const [rows, setRows] = useState(options.rows);
  const [columns, setColumns] = useState(options.columns);

  const grid = Array.from({ length: rows }, () => Array(columns).fill(null));

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    grid[row][col] = item;
  });

  return { grid, rows, columns, setRows, setColumns };
}
