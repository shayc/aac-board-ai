import Box from "@mui/material/Box";

export interface GridProps<TItem> {
  grid: (TItem | null)[][];
  gap?: number;
  renderCell: (item: TItem) => React.ReactNode;
  renderEmptyCell?: () => React.ReactNode;
}

export function Grid<TItem>(props: GridProps<TItem>) {
  const { grid, gap = 2, renderCell, renderEmptyCell } = props;

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
