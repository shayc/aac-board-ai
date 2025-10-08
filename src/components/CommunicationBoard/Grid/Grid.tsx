import Box from "@mui/material/Box";

export interface GridProps<TItem> {
  grid: TItem[][];
  renderCell: (item: TItem) => React.ReactNode;
  renderEmptyCell?: () => React.ReactNode;
}

export function Grid<TItem>(props: GridProps<TItem>) {
  const { grid, renderCell, renderEmptyCell } = props;

  return (
    <Box>
      {grid.map((row, rowIndex) => (
        <Box key={rowIndex} sx={{ display: "flex" }}>
          {row.map((item, cellIndex) => (
            <Box key={cellIndex}>
              {item ? renderCell(item) : renderEmptyCell?.()}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
