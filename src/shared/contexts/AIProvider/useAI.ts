import { use } from "react";
import { AIContext, type AIContextValue } from "./AIProvider";

export function useAI(): AIContextValue {
  const context = use(AIContext);

  if (!context) {
    throw new Error("useAI must be used within AIProvider");
  }

  return context;
}
