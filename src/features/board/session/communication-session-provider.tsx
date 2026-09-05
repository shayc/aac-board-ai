import { m } from "@paraglide/messages.js";
import { usePlayback } from "@shared/playback/use-playback";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useState, type ReactNode } from "react";
import { createBoardPlayback } from "../playback/board-playback";
import { createCommunicationSession } from "./communication-session";
import { CommunicationSessionContext } from "./communication-session-context";

export function CommunicationSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const playback = usePlayback();
  const { showSnackbar } = useSnackbar();
  const [session] = useState(() =>
    createCommunicationSession({
      playback: createBoardPlayback(playback),
      onPlaybackFailure: () =>
        showSnackbar({
          message: (translate) => translate(m.errorGenericTitle),
          severity: "error",
        }),
    }),
  );

  useEffect(() => () => session.dispose(), [session]);

  return (
    <CommunicationSessionContext value={session}>
      {children}
    </CommunicationSessionContext>
  );
}
