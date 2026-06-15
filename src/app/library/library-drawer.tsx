import {
  BoardSetDeleteDialog,
  BoardSetInfoDialog,
  BoardSetList,
  boardSetPath,
  deleteBoardSet,
  useBoardSets,
  useImportBoardFiles,
  type BoardSetRecord,
} from "@features/board";
import AddIcon from "@mui/icons-material/Add";
import FilterNoneOutlinedIcon from "@mui/icons-material/FilterNoneOutlined";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { EmptyState } from "@shared/components/empty-state";
import { LoadingState } from "@shared/components/loading-state";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useState } from "react";
import { useNavigate } from "react-router";

export interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LibraryDrawer({ open, onClose }: LibraryDrawerProps) {
  const { boardSets, isLoading } = useBoardSets();
  const { pickAndImportBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

  function handleSelect(boardSet: BoardSetRecord) {
    onClose();
    void navigate(boardSetPath(boardSet));
  }

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

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          "aria-label": m.libraryHeading(),
          sx: { width: "calc(320px + env(safe-area-inset-left))" },
        },
      }}
    >
      <Toolbar
        sx={(theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
          },
        })}
      >
        <Typography component="div" variant="h6" noWrap>
          {m.libraryHeading()}
        </Typography>
      </Toolbar>

      <Divider />

      {isLoading ? (
        <LoadingState message={m.libraryLoading()} />
      ) : boardSets.length === 0 ? (
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
      ) : (
        <>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "flex-start",
              p: 2,
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
    </Drawer>
  );
}
