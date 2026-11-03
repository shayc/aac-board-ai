import Box from "@mui/material/Box";

interface TileDimmingFilterProps {
  id: string;
  brightness: number;
}

export function TileDimmingFilter({ id, brightness }: TileDimmingFilterProps) {
  const slope = brightness ** 3;

  return (
    <Box
      component="svg"
      aria-hidden="true"
      sx={{ position: "absolute", width: 0, height: 0 }}
    >
      <filter id={id} colorInterpolationFilters="linearRGB">
        <feComponentTransfer>
          <feFuncR type="linear" slope={slope} />
          <feFuncG type="linear" slope={slope} />
          <feFuncB type="linear" slope={slope} />
        </feComponentTransfer>
      </filter>
    </Box>
  );
}
