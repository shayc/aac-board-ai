import { createContext } from "react";

export type DownloadKey = "proofreader" | "rewriter" | "translator";

export interface AIContextValue {
  sharedContext: string;
  setSharedContext: (value: string) => void;
  downloads: Record<DownloadKey, number>;
  setDownload: (key: DownloadKey, progress: number) => void;
}

export const AIContext = createContext<AIContextValue | null>(null);
