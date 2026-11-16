import Box from "@mui/material/Box";
import visuallyHidden from "@mui/utils/visuallyHidden";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

interface RestoredMessageNoticeProps {
  isShown: boolean;
}

/** Tells assistive technology that new symbols add to a message from before. */
export function RestoredMessageNotice({ isShown }: RestoredMessageNoticeProps) {
  const t = useTranslate();

  return (
    <Box role="status" sx={visuallyHidden}>
      {isShown ? t(m.messageRestored) : null}
    </Box>
  );
}
