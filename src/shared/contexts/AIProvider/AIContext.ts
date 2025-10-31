import { createContext } from "react";

export interface AIContextValue {
  sharedContext: string;
  setSharedContext: (value: string) => void;
}

export const AIContext = createContext<AIContextValue | null>(null);
