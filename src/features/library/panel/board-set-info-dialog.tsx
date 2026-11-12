import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLastNonNull } from "@shared/hooks/use-last-non-null";
import { type Translate, useTranslate } from "@shared/language/use-translate";
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
  const shownBoardSet = useLastNonNull(boardSet);
  const facts = shownBoardSet ? buildFacts(t, shownBoardSet) : [];

  return (
    <Dialog open={boardSet !== null} onClose={onClose} fullWidth maxWidth="sm">
      <Box sx={{ px: 3, py: 2 }}>
        <DialogTitle sx={{ p: 0 }}>{shownBoardSet?.name}</DialogTitle>

        {shownBoardSet?.author && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(m.libraryByAuthor, { author: shownBoardSet.author })}
          </Typography>
        )}
      </Box>

      <DialogContent
        sx={{
          pt: 0,
          overflowX: "hidden",
          overflowY: "auto",
          // The app disables selection globally; descriptions carry URLs and
          // credits people need to copy.
          userSelect: "text",
        }}
      >
        {facts.length > 0 && <FactLine facts={facts} />}

        {shownBoardSet?.description && (
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-line" }}>
            {shownBoardSet.description}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t(m.close)}</Button>
      </DialogActions>
    </Dialog>
  );
}

interface FactLineProps {
  facts: string[];
}

function FactLine({ facts }: FactLineProps) {
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
