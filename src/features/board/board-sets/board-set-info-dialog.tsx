import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import type { BoardSetRecord } from "../storage/board-set-storage";

interface BoardSetInfoDialogProps {
  boardSet: BoardSetRecord | null;
  onClose: () => void;
}

export function BoardSetInfoDialog({
  boardSet,
  onClose,
}: BoardSetInfoDialogProps) {
  const t = useTranslate();
  const facts = boardSet ? buildFacts(t, boardSet) : [];

  return (
    <Dialog open={boardSet !== null} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ px: 3, py: 2 }}>
        <DialogTitle sx={{ p: 0 }}>{boardSet?.name}</DialogTitle>

        {boardSet?.author && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(m.libraryByAuthor, { author: boardSet.author })}
          </Typography>
        )}
      </Box>

      <DialogContent
        sx={{
          pt: 0,
          overflowX: "hidden",
          overflowY: "auto",
          // Descriptions carry URLs and credits people need to copy; the app
          // turns selection off globally for the board.
          userSelect: "text",
        }}
      >
        {facts.length > 0 && <FactLine facts={facts} />}

        {boardSet?.description && (
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-line" }}>
            {boardSet.description}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t(m.close)}</Button>
      </DialogActions>
    </Dialog>
  );
}

// Plain text rather than chips: chips elsewhere in the app are tappable, and
// these facts are not.
function FactLine({ facts }: { facts: string[] }) {
  return (
    <Stack
      direction="row"
      divider={
        <Typography aria-hidden="true" component="span" variant="body2">
          •
        </Typography>
      }
      useFlexGap
      sx={{ flexWrap: "wrap", columnGap: 1, color: "text.secondary" }}
    >
      {facts.map((fact) => (
        <Typography key={fact} variant="body2">
          {fact}
        </Typography>
      ))}
    </Stack>
  );
}

function buildFacts(t: Translate, boardSet: BoardSetRecord): string[] {
  const facts: string[] = [];

  if (boardSet.gridRows && boardSet.gridColumns) {
    facts.push(
      t(m.libraryGridDimensions, {
        rows: boardSet.gridRows,
        columns: boardSet.gridColumns,
      }),
    );
  }

  if (boardSet.license) {
    facts.push(boardSet.license);
  }

  return facts;
}
