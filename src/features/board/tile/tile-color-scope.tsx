import Box from "@mui/material/Box";
import GlobalStyles from "@mui/material/GlobalStyles";
import type { SxProps, Theme } from "@mui/material/styles";
import { useId, type CSSProperties, type ReactNode } from "react";
import { SymbolDimmingFilter } from "../aac-symbol/symbol-dimming-filter";
import { TILE_BRIGHTNESS } from "../board-preferences-store";

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
  const dimmingFilterId = useId();
  const areSymbolsDimmed = brightness < TILE_BRIGHTNESS.max;

  const style: TileColorScopeStyle = {
    "--tile-saturation": String(saturation),
    "--tile-brightness": String(brightness),
    "--symbol-image-filter": areSymbolsDimmed
      ? `url("#${dimmingFilterId}")`
      : "none",
  };

  return (
    <Box style={style} sx={sx}>
      <TileDarkeningProperty />

      {areSymbolsDimmed && (
        <SymbolDimmingFilter id={dimmingFilterId} brightness={brightness} />
      )}

      {children}
    </Box>
  );
}
