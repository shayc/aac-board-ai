import { usePersistentState } from "@shared/hooks/usePersistentState";
import { type ReactNode } from "react";
import { AIContext, type AIContextValue } from "./AIContext";

export interface AIProviderProps {
  children: ReactNode;
}

export function AIProvider({ children }: AIProviderProps) {
  const [sharedContext, setSharedContext] = usePersistentState<string>(
    "ai-shared-context",
    ""
  );

  const contextValue: AIContextValue = {
    sharedContext,
    setSharedContext,
  };

  return <AIContext value={contextValue}>{children}</AIContext>;
}
