import Box from "@mui/material/Box";

const TILE_ROWS = [
  ["#C9B8F0", "#FBE89A", "#BFE3C6"],
  ["#FBE89A", "#F5B3B0", "#BFE3C6"],
  ["#F9C99A", "#BFE3C6", "#ECEEF2"],
];

// Matches the installed app icon (public/board.svg), not the app background.
const MARK_BACKGROUND = "#0e1014";

const MARK_SIZE = 560;
const GRID_OFFSET = 104;
const TILE_SIZE = 104;
const TILE_STRIDE = 124;
const TILE_RADIUS = 20;

export function BoardMark() {
  return (
    <Box
      component="svg"
      aria-hidden
      viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      sx={{
        display: "block",
        width: 96,
        height: 96,
        mx: "auto",
        mb: 2,
        borderRadius: "22%",
        boxShadow: (theme) => `0 0 0 1px ${theme.vars.palette.divider}`,
      }}
    >
      <rect width="100%" height="100%" fill={MARK_BACKGROUND} />

      {TILE_ROWS.flatMap((row, rowIndex) =>
        row.map((fill, columnIndex) => (
          <rect
            key={`${rowIndex}-${columnIndex}`}
            x={GRID_OFFSET + columnIndex * TILE_STRIDE}
            y={GRID_OFFSET + rowIndex * TILE_STRIDE}
            width={TILE_SIZE}
            height={TILE_SIZE}
            rx={TILE_RADIUS}
            fill={fill}
          />
        )),
      )}
    </Box>
  );
}
