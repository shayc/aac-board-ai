import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { m } from "@paraglide/messages.js";
import { EmptyState } from "@shared/components/empty-state";
import { LoadingState } from "@shared/components/loading-state";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useState } from "react";
import { useImportBoardFiles } from "../import/use-import-board-files";
import type { BoardSetRecord } from "../storage/boards-db";
import { BoardSetDeleteDialog } from "./board-set-delete-dialog";
import { BoardSetInfoDialog } from "./board-set-info-dialog";
import { BoardSetList } from "./board-set-list";
import { deleteBoardSet } from "./board-sets-store";
import { useBoardSets } from "./use-board-sets";

export interface BoardSetLibraryProps {
  selectedSetId?: string;
  onSelect: (boardSet: BoardSetRecord) => void;
}

export function BoardSetLibrary({
  selectedSetId,
  onSelect,
}: BoardSetLibraryProps) {
  const { boardSets, isLoading } = useBoardSets();
  const { pickAndImportBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const { setId, name } = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteBoardSet(setId);
      showSnackbar({
        message: m.libraryDeleted({ name }),
        severity: "success",
      });
    } catch {
      showSnackbar({
        message: m.libraryDeleteFailed({ name }),
        severity: "error",
      });
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ px: 2, height: "100%" }}>
        <LoadingState message={m.libraryLoading()} />
      </Box>
    );
  }

  if (boardSets.length === 0) {
    return (
      <Box sx={{ px: 2, height: "100%" }}>
        <EmptyState
          title={m.libraryEmptyTitle()}
          description={m.libraryEmptyDescription()}
          action={
            <Button
              variant="contained"
              startIcon={<LibraryAddOutlinedIcon />}
              onClick={() => void pickAndImportBoardFiles()}
            >
              {m.libraryImportBoards()}
            </Button>
          }
        />
      </Box>
    );
  }

  return (
    <>
      <List sx={{ px: 1, mb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => void pickAndImportBoardFiles()}>
            <ListItemIcon>
              <LibraryAddOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={m.libraryImportBoards()} />
          </ListItemButton>
        </ListItem>
      </List>

      <BoardSetList
        boardSets={boardSets}
        selectedSetId={selectedSetId}
        onSelect={onSelect}
        onDelete={setDeleteTarget}
        onInfo={setInfoTarget}
      />

      <BoardSetInfoDialog
        boardSet={infoTarget}
        onClose={() => setInfoTarget(null)}
      />

      <BoardSetDeleteDialog
        boardSet={deleteTarget}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
