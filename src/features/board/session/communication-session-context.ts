import { createContext } from "react";
import type { CommunicationSession } from "./communication-session";

export const CommunicationSessionContext =
  createContext<CommunicationSession | null>(null);
