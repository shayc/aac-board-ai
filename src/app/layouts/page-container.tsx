import Container from "@mui/material/Container";
import type { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <Container
      maxWidth="md"
      sx={[
        { height: "100%" },
        (theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
            pr: `calc(${theme.spacing(2)} + env(safe-area-inset-right))`,
          },
        }),
      ]}
    >
      {children}
    </Container>
  );
}
