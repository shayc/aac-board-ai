import Container, { type ContainerProps } from "@mui/material/Container";
import type { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
  maxWidth?: ContainerProps["maxWidth"];
}

export function PageContainer({
  children,
  maxWidth = "sm",
}: PageContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
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
