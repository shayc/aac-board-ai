import { AppDrawer } from "@app/shell/app-drawer";
import { BoardSetLibrary } from "@features/board";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LibraryDrawer({ open, onClose }: LibraryDrawerProps) {
  const t = useTranslate();

  return (
    <AppDrawer
      title={t(m.libraryTitle)}
      closeLabel={t(m.libraryClose)}
      open={open}
      anchor="left"
      onClose={onClose}
    >
      <BoardSetLibrary />
    </AppDrawer>
  );
}
