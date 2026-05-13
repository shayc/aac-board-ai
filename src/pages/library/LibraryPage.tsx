import { useDeclareHeaderTitle } from "@app/useHeaderTitle";
import {
  removeBoardSet,
  useBoardSets,
  useImportBoardFiles,
  type BoardSetRecord,
} from "@features/board";
import AddIcon from "@mui/icons-material/Add";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { PageContainer } from "@shared/components/PageContainer";
import { useSnackbar } from "@shared/snackbar/useSnackbar";
import { useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { BoardSetDeleteDialog } from "./components/BoardSetDeleteDialog";
import { BoardSetInfoDialog } from "./components/BoardSetInfoDialog";
import { BoardSetList } from "./components/BoardSetList";

function LibraryPage() {
  const { boardSets, isLoading } = useBoardSets();
  const { pickAndImportBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useDeclareHeaderTitle("Library");

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

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
        message: `Couldn't delete "${name}"`,
        severity: "error",
      });
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading board sets..." />
      </PageContainer>
    );
  }

  if (boardSets.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          icon={<CollectionsBookmarkOutlinedIcon />}
          title="Your library is empty"
          description="Import communication boards to get started."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => void pickAndImportBoardFiles()}
            >
              Import board set
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "flex-end", mb: 2 }}
      >
        <Button
          variant="text"
          startIcon={<AddIcon />}
          onClick={() => void pickAndImportBoardFiles()}
        >
          Import
        </Button>
      </Stack>

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
    </PageContainer>
  );
}

export default LibraryPage;
