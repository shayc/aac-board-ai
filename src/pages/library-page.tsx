import { useDeclareAppHeaderTitle } from "@app/layouts/app-header-title";
import {
  boardPath,
  boardSetPath,
  BoardSetDeleteDialog,
  BoardSetInfoDialog,
  BoardSetList,
  removeBoardSet,
  useBoardSets,
  useImportBoardFiles,
  type BoardSetRecord,
} from "@features/board";
import AddIcon from "@mui/icons-material/Add";
import FilterNoneOutlinedIcon from "@mui/icons-material/FilterNoneOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { EmptyState } from "@shared/components/empty-state";
import { LoadingState } from "@shared/components/loading-state";
import { PageContainer } from "@shared/components/page-container";
import { m } from "@paraglide/messages.js";
import { Title } from "@shared/components/title";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";

export const Component = function LibraryPage() {
  const { boardSets, isLoading } = useBoardSets();
  const { pickAndImportBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useDeclareAppHeaderTitle(m.menuLibrary());

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

  function handleSelect(boardSet: BoardSetRecord) {
    if (boardSet.rootBoardId) {
      void navigate(
        boardPath({
          setId: boardSet.setId,
          boardId: boardSet.rootBoardId,
        }),
      );
    } else {
      void navigate(boardSetPath({ setId: boardSet.setId }));
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
      showSnackbar({
        message: m.libraryDeleted({ name }),
        severity: "success",
      });
    } catch (error) {
      showSnackbar({
        message: m.libraryDeleteFailed({ name }),
        severity: "error",
      });
      throw error;
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message={m.libraryLoading()} />
      </PageContainer>
    );
  }

  if (boardSets.length === 0) {
    return (
      <PageContainer>
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
      </PageContainer>
    );
  }

  return (
    <>
      <Title>{m.menuLibrary()}</Title>
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
            {m.libraryImport()}
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
    </>
  );
};
