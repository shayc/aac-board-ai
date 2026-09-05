import { use, useSyncExternalStore } from "react";
import { CommunicationSessionContext } from "./communication-session-context";

export function useCommunicationSession() {
  const session = use(CommunicationSessionContext);
  if (!session) {
    throw new Error(
      "useCommunicationSession must be used within CommunicationSessionProvider",
    );
  }

  const message = useSyncExternalStore(session.subscribe, session.getSnapshot);

  return { session, message };
}
