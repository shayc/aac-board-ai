import AddIcon from "@mui/icons-material/Add";
import FilterNoneOutlinedIcon from "@mui/icons-material/FilterNoneOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
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
  onSelect: (boardSet: BoardSetRecord) => void;
  activeSetId?: string;
  onActiveSetDeleted?: () => void;
}

export function BoardSetLibrary({
  onSelect,
  activeSetId,
  onActiveSetDeleted,
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

      if (setId === activeSetId) {
        onActiveSetDeleted?.();
      }
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
          icon={<FilterNoneOutlinedIcon />}
          title={m.libraryEmptyTitle()}
          description={m.libraryEmptyDescription()}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
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
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "flex-start",
          px: 2,
          pt: 1,
        }}
      >
        <Button
          variant="text"
          startIcon={<AddIcon />}
          onClick={() => void pickAndImportBoardFiles()}
        >
          {m.libraryImportBoards()}
        </Button>
      </Stack>

      <BoardSetList
        boardSets={boardSets}
        selectedSetId={activeSetId}
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
