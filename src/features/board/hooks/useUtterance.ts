import { useState } from "react";

export interface UtteranceToken {
  id: string;
  label: string;
  image?: string;
  vocalization?: string;
}

export function useUtterance() {
  const [tokens, setTokens] = useState<UtteranceToken[]>([]);

  const pushToken = (token: UtteranceToken) => {
    setTokens((prev) => [...prev, token]);
  };

  const popToken = () => {
    setTokens((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    setTokens([]);
  };

  return {
    tokens,
    pushToken,
    popToken,
    clear,
  };
}
