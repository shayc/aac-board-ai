import { type ReactNode } from "react";

export interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  return <>{children}</>;
}
