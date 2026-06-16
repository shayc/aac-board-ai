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
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: shifted ? `calc(100% - ${LIBRARY_DRAWER_WIDTH})` : "100%",
        marginLeft: shifted ? LIBRARY_DRAWER_WIDTH : 0,
        transition: theme.transitions.create(
          ["margin", "width"],
          shifted
            ? {
                easing: theme.transitions.easing.easeOut,
                duration: theme.transitions.duration.enteringScreen,
              }
            : {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              },
        ),
      })}
    >
      {children}
    </Box>
  );
}
