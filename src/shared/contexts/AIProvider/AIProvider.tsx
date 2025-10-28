import { usePersistentState } from "@/shared/hooks/usePersistentState";
import { createContext, type ReactNode } from "react";

export interface AIContextValue {
  sharedContext: string;
  setSharedContext: (value: string) => void;
}

export const AIContext = createContext<AIContextValue | null>(null);

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

  return (
    <AIContext.Provider value={contextValue}>{children}</AIContext.Provider>
  );
}
