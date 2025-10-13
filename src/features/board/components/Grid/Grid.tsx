import Box from "@mui/material/Box";

export interface GridProps<TItem> {
  rows: number;
  columns: number;
  items: TItem[];
  order?: (string | null)[][];
  gap?: number;
  renderCell: (item: TItem) => React.ReactNode;
  renderEmptyCell?: () => React.ReactNode;
}

export function Grid<TItem>({
  rows,
  columns,
  items,
  order: _order,
  gap = 2,
  renderCell,
  renderEmptyCell,
}: GridProps<TItem>) {
  const grid = Array.from({ length: rows }, () => Array(columns).fill(null));

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    if (row < rows && col < columns && grid[row]) {
      grid[row][col] = item;
    }
  });

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: gap,
        gap,
        flexGrow: 1,
      }}
    >
      {grid.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "row",
            gap,
            flexGrow: 1,
          }}
        >
          {row.map((item, cellIndex) => (
            <Box key={cellIndex} sx={{ flex: 1 }}>
              {item ? renderCell(item) : renderEmptyCell?.()}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
