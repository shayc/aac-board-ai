import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import type { TileLabelPlacement } from "../appearance/appearance-store";

interface SymbolLayoutProps {
  image?: ReactNode;
  label: ReactNode;
  labelPlacement: TileLabelPlacement;
}

export function SymbolLayout({
  image,
  label,
  labelPlacement,
}: SymbolLayoutProps) {
  return (
    <Box
      component="span"
      sx={{
        display: "flex",
        flexDirection: labelPlacement === "top" ? "column-reverse" : "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        gap: 0.5,
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {image}
      {label}
    </Box>
  );
}
