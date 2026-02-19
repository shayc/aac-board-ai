import { usePageTitle } from "@app/hooks/usePageTitle";
import { useBoardSets } from "@features/board/hooks/useBoardSets";
import { useImportBoardFiles } from "@features/board/hooks/useImportBoardFiles";
import { removeBoardSet } from "@features/board/store/board-sets-store";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { useSnackbar } from "@shared/contexts/SnackbarProvider/useSnackbar";
import { useEffect, useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { BoardSetList } from "./library/BoardSetList";
import { DeleteBoardSetDialog } from "./library/DeleteBoardSetDialog";
import { LibraryEmptyState } from "./library/LibraryEmptyState";

function LibraryPage() {
  const { boardSets, isLoading } = useBoardSets();
  const { importBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("Library");
  }, [setPageTitle]);

  const [deleteTarget, setDeleteTarget] = useState<{
    setId: string;
    name: string;
  } | null>(null);

  function handleNavigate(setId: string, rootBoardId?: string) {
    if (rootBoardId) {
      void navigate(
        generatePath("/sets/:setId/boards/:boardId", {
          setId,
          boardId: rootBoardId,
        }),
      );
    } else {
      void navigate(`/sets/${encodeURIComponent(setId)}`);
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
        alignItems="center"
        justifyContent="flex-end"
        sx={{ mb: 2 }}
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
        <BoardSetList
          boardSets={boardSets}
          onNavigate={handleNavigate}
          onDelete={(setId, name) => setDeleteTarget({ setId, name })}
        />
      )}

      <DeleteBoardSetDialog
        target={deleteTarget}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </Container>
  );
}

export default LibraryPage;
