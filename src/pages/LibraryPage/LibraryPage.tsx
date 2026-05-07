import { usePageTitle } from "@app/usePageTitle";
import {
  removeBoardSet,
  useBoardSets,
  useImportBoardFiles,
  type BoardSetRecord,
} from "@features/board";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { useSnackbar } from "@shared/snackbar/useSnackbar";
import { useEffect, useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { BoardSetDeleteDialog } from "./components/BoardSetDeleteDialog";
import { BoardSetInfoDialog } from "./components/BoardSetInfoDialog";
import { BoardSetList } from "./components/BoardSetList";
import { LibraryEmptyState } from "./components/LibraryEmptyState";

function LibraryPage() {
  const { boardSets, isLoading } = useBoardSets();
  const { importBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const { setPageTitle } = usePageTitle();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

  useEffect(() => {
    setPageTitle("Library");
  }, [setPageTitle]);

  function handleSelect(boardSet: BoardSetRecord) {
    if (boardSet.rootBoardId) {
      void navigate(
        generatePath("/sets/:setId/boards/:boardId", {
          setId: boardSet.setId,
          boardId: boardSet.rootBoardId,
        }),
      );
    } else {
      void navigate(`/sets/${encodeURIComponent(boardSet.setId)}`);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const { setId, name } = deleteTarget;
    setDeleteTarget(null);

    try {
      await removeBoardSet(setId);
      showSnackbar({ message: `"${name}" deleted`, severity: "success" });
    } catch {
      showSnackbar({
        message: `Failed to delete "${name}"`,
        severity: "error",
      });
    }
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 6 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "flex-end", mb: 2 }}
      >
        <Button
          variant="text"
          startIcon={<AddIcon />}
          onClick={() => void importBoardFiles()}
        >
          Import
        </Button>
      </Stack>

      {!isLoading && boardSets.length === 0 && <LibraryEmptyState />}

      {!isLoading && boardSets.length > 0 && (
        <>
          <BoardSetList
            boardSets={boardSets}
            onSelect={handleSelect}
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
      )}
    </Container>
  );
}

export default LibraryPage;
