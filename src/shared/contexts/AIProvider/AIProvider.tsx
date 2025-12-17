import { usePersistentState } from "@shared/hooks/usePersistentState";
import { type ReactNode, useState } from "react";
import { AIContext, type AIContextValue } from "./AIContext";

export interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [sharedContext, setSharedContext] = usePersistentState<string>(
    "ai-shared-context",
    "",
  );
  const [downloads, setDownloads] = useState<Record<string, number>>({});

  function setDownload(key: string, progress: number) {
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
