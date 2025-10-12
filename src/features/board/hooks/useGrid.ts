import { useEffect, useState } from "react";

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
    // Only add item if it fits in the grid
    if (row < rows && col < columns && grid[row]) {
      grid[row][col] = item;
    }
  });

  useEffect(() => {
    setRows(options.rows);
    setColumns(options.columns);
  }, [options.rows, options.columns]);

  return { grid, rows, columns, setRows, setColumns };
}
