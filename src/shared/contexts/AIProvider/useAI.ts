import { useContext } from "react";
import { AIContext, type AIContextValue } from "./AIProvider";

export function useAI(): AIContextValue {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error("useAI must be used within AIProvider");
  }

  return context;
}