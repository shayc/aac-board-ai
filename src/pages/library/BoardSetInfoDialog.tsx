import type { BoardSetRecord } from "@features/board/db/boards-db";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

export interface BoardSetInfoDialogProps {
  boardSet: BoardSetRecord | null;
  onClose: () => void;
}

export function BoardSetInfoDialog({
  boardSet,
  onClose,
}: BoardSetInfoDialogProps) {
  const rows = boardSet ? buildInfoRows(boardSet) : [];

  return (
    <Dialog
      open={boardSet !== null}
      onClose={onClose}
      aria-labelledby="info-dialog-title"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="info-dialog-title">{boardSet?.name}</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableBody>
            {rows.map(({ label, value }) => (
              <TableRow key={label}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  {label}
                </TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function buildInfoRows(
  boardSet: BoardSetRecord,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  rows.push({ label: "Boards", value: String(boardSet.boardCount) });

  if (boardSet.gridRows && boardSet.gridColumns) {
    rows.push({
      label: "Grid size",
      value: `${boardSet.gridRows} × ${boardSet.gridColumns}`,
    });
  }

  if (boardSet.author) {
    rows.push({ label: "Author", value: boardSet.author });
  }

  if (boardSet.locale) {
    rows.push({ label: "Locale", value: boardSet.locale });
  }

  rows.push({
    label: "Last updated",
    value: new Date(boardSet.updatedAt).toLocaleDateString(),
  });

  return rows;
}
