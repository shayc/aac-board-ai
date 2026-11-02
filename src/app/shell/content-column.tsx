import { LIBRARY_DRAWER_WIDTH } from "@app/shell/drawer-width";
import Box from "@mui/material/Box";
import type { ReactNode } from "react";

interface ContentColumnProps {
  children: ReactNode;
  isShifted?: boolean;
}

export function ContentColumn({
  children,
  isShifted = false,
}: ContentColumnProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: isShifted ? `calc(100% - ${LIBRARY_DRAWER_WIDTH})` : "100%",
        marginLeft: isShifted ? LIBRARY_DRAWER_WIDTH : 0,
      }}
    >
      {children}
    </Box>
  );
}
