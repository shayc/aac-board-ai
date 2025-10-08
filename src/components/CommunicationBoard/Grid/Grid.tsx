import Box from "@mui/material/Box";

export interface GridProps<TItem> {
  grid: TItem[][];
  renderCell: (item: TItem) => React.ReactNode;
  renderEmptyCell?: () => React.ReactNode;
}

export function Grid<TItem>(props: GridProps<TItem>) {
  const { grid, renderCell, renderEmptyCell } = props;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
      {grid.map((row, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex", flexGrow: 1 }}>
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
