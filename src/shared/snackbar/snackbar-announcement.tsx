import visuallyHidden from "@mui/utils/visuallyHidden";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ANNOUNCEMENT_DELAY_MS = 100;

interface SnackbarAnnouncementProps {
  message: string;
  isAssertive: boolean;
}

export function SnackbarAnnouncement({
  message,
  isAssertive,
}: SnackbarAnnouncementProps) {
  const [announcedMessage, setAnnouncedMessage] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAnnouncedMessage(message);
    }, ANNOUNCEMENT_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [message]);

  return createPortal(
    <div role={isAssertive ? "alert" : "status"} style={visuallyHidden}>
      {announcedMessage}
    </div>,
    document.body,
  );
}
