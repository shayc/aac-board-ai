import Box from "@mui/material/Box";

interface TileDimmingFilterProps {
  id: string;
  brightness: number;
}

export function TileDimmingFilter({ id, brightness }: TileDimmingFilterProps) {
  const linearLightScale = brightness ** 3;

  return (
    <Box
      component="svg"
      aria-hidden="true"
      sx={{ position: "absolute", width: 0, height: 0 }}
    >
      <filter id={id} colorInterpolationFilters="linearRGB">
        <feComponentTransfer>
          <feFuncR type="linear" slope={linearLightScale} />
          <feFuncG type="linear" slope={linearLightScale} />
          <feFuncB type="linear" slope={linearLightScale} />
        </feComponentTransfer>
      </filter>
    </Box>
  );
}
