import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import type { SxProps, Theme } from "@mui/material/styles";
import type { CSSProperties, ReactNode } from "react";
import { TILE_BRIGHTNESS } from "../board-preferences-store";

const SRGB_GAMMA = 2.2;

interface TileColorScopeProps {
  saturation: number;
  brightness: number;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

type TileColorScopeStyle = CSSProperties & {
  "--tile-saturation": string;
  "--tile-brightness": string;
  "--symbol-image-filter": string;
};

function symbolImageFilter(brightness: number): string {
  if (brightness >= TILE_BRIGHTNESS.max) {
    return "none";
  }

  const linearLightScale = brightness ** 3;
  return `brightness(${linearLightScale ** (1 / SRGB_GAMMA)})`;
}

function TileDarkeningProperty() {
  return (
    <GlobalStyles
      styles={{
        "@property --tile-darkening": {
          syntax: "'<percentage>'",
          inherits: String(false),
          initialValue: "0%",
        },
      }}
    />
  );
}

export function TileColorScope({
  saturation,
  brightness,
  children,
  sx,
}: TileColorScopeProps) {
  const style: TileColorScopeStyle = {
    "--tile-saturation": String(saturation),
    "--tile-brightness": String(brightness),
    "--symbol-image-filter": symbolImageFilter(brightness),
  };

  return (
    <Box style={style} sx={sx}>
      <TileDarkeningProperty />
      {children}
    </Box>
  );
}
