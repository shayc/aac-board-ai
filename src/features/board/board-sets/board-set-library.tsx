import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useTranslate } from "@shared/language/use-translate";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { ErrorState } from "@shared/ui/error-state";
import { LoadingState } from "@shared/ui/loading-state";
import { useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { useImportBoardFiles } from "../import/use-import-board-files";
import { BOARD_SET_SEGMENT } from "../navigation/board-paths";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { listDownloadableBoardSets } from "./board-set-catalog";
import { BoardSetDeleteDialog } from "./board-set-delete-dialog";
import { BoardSetInfoDialog } from "./board-set-info-dialog";
import { BoardSetList } from "./board-set-list";
import {
  boardSetNameInLanguage,
  deleteBoardSet,
  useBoardSets,
} from "./board-sets-store";

export function BoardSetLibrary() {
  const t = useTranslate();
  const { language } = useLanguage();
  const activeBoardSetId = useMatch({
    path: `/${BOARD_SET_SEGMENT}`,
    end: false,
  })?.params.boardSetId;
  const { boardSets: storedBoardSets, isLoading, error } = useBoardSets();
  const { pickAndImport } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

  const boardSets = storedBoardSets.map((boardSet) => ({
    ...boardSet,
    name: boardSetNameInLanguage(boardSet, language),
  }));
  const downloadableBoardSets = listDownloadableBoardSets(storedBoardSets, t);

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    const { id, name } = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteBoardSet(id);
    } catch {
      showSnackbar({
        message: (t) => t(m.libraryDeleteFailed, { name }),
        severity: "error",
      });
      return;
    }

    if (id === activeBoardSetId) {
      void navigate("/", { replace: true });
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ height: "100%", px: 2 }}>
        <LoadingState message={t(m.libraryLoading)} />
      </Box>
    );
  }

  if (error && boardSets.length === 0) {
    return (
      <Box sx={{ height: "100%", px: 2 }}>
        <ErrorState icon={null} title={t(m.libraryLoadFailed)} />
      </Box>
    );
  }

  return (
    <>
      <List sx={{ mb: 2, px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => void pickAndImport()}>
            <ListItemIcon>
              <LibraryAddOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={t(m.libraryImportBoardFiles)} />
          </ListItemButton>
        </ListItem>
      </List>

      <BoardSetList
        boardSets={boardSets}
        downloadableBoardSets={downloadableBoardSets}
        activeBoardSetId={activeBoardSetId}
        onRequestDelete={setDeleteTarget}
        onShowInfo={setInfoTarget}
      />

      <BoardSetInfoDialog
        boardSet={infoTarget}
        onClose={() => setInfoTarget(null)}
      />

      <BoardSetDeleteDialog
        boardSet={deleteTarget}
        onDelete={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
