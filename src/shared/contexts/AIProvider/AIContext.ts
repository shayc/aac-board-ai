import { createContext } from "react";

export interface AIContextValue {
  sharedContext: string;
  setSharedContext: (value: string) => void;
  downloads: Record<string, number>;
  setDownload: (key: string, progress: number) => void;
}

export const AIContext = createContext<AIContextValue | null>(null);
