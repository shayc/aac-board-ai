import { usePersistentState } from "@shared/hooks/usePersistentState";
import { type ReactNode, useState } from "react";
import { AIContext, type AIContextValue, type DownloadKey } from "./AIContext";

export interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [sharedContext, setSharedContext] = usePersistentState<string>(
    "ai-shared-context",
    "",
  );
  const [downloads, setDownloads] = useState<Record<DownloadKey, number>>({
    proofreader: 0,
    rewriter: 0,
    translator: 0,
  });

  function setDownload(key: DownloadKey, progress: number) {
    setDownloads((prev) => ({ ...prev, [key]: progress }));
  }

  const contextValue: AIContextValue = {
    sharedContext,
    setSharedContext,
    downloads,
    setDownload,
  };

  return <AIContext value={contextValue}>{children}</AIContext>;
}
