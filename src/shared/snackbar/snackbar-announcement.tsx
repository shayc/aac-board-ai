import visuallyHidden from "@mui/utils/visuallyHidden";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const ANNOUNCEMENT_DELAY_MS = 100;

interface SnackbarAnnouncementProps {
  role: "alert" | "status";
  children: ReactNode;
}

export function SnackbarAnnouncement({
  role,
  children,
}: SnackbarAnnouncementProps) {
  const [announcement, setAnnouncement] = useState<ReactNode>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setAnnouncement(children);
    }, ANNOUNCEMENT_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [children]);

  return createPortal(
    <div role={role} style={visuallyHidden}>
      {announcement}
    </div>,
    document.body,
  );
}
