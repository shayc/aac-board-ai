import { LIBRARY_DRAWER_WIDTH } from "@app/library/library-drawer";
import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export interface ContentColumnProps {
  children: ReactNode;
  shifted?: boolean;
}

export function ContentColumn({
  children,
  shifted = false,
}: ContentColumnProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        marginInlineStart: shifted ? LIBRARY_DRAWER_WIDTH : 0,
      }}
    >
      {children}
    </Box>
  );
}
