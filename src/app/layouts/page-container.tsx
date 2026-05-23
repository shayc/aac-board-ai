import Container from "@mui/material/Container";
import type { ReactNode } from "react";

export interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <Container maxWidth="sm" sx={{ height: "100%" }}>
      {children}
    </Container>
  );
}
