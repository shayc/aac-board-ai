import { type ReactNode } from "react";

export interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  return <>{children}</>;
}
