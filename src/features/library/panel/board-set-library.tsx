import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/use-communication-language";
import { useTranslate } from "@shared/language/use-translate";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { ErrorState } from "@shared/ui/error-state";
import { LoadingState } from "@shared/ui/loading-state";
import { useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { BOARD_SET_SEGMENT } from "../board-paths";
import { deleteBoardSet, useBoardSets } from "../board-sets/board-sets-store";
import { listDownloadableBoardSets } from "../catalog/board-set-catalog";
import { exportBoardSet } from "../export/board-set-export";
import { useImportBoardFiles } from "../import/use-import-board-files";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { boardSetInLanguage } from "../translation/board-translations";
import { BoardSetDeleteDialog } from "./board-set-delete-dialog";
import { BoardSetInfoDialog } from "./board-set-info-dialog";
import { BoardSetList } from "./board-set-list";

export function BoardSetLibrary() {
  const t = useTranslate();
  const activeBoardSetId = useMatch({
    path: `/${BOARD_SET_SEGMENT}`,
    end: false,
  })?.params.boardSetId;
  const { language } = useCommunicationLanguage();
  const { boardSets: storedBoardSets, isLoading, error } = useBoardSets();
  const { pickAndImport } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [deleteTarget, setDeleteTarget] = useState<BoardSetRecord | null>(null);
  const [infoTarget, setInfoTarget] = useState<BoardSetRecord | null>(null);

  const boardSets = storedBoardSets.map((boardSet) =>
    boardSetInLanguage(boardSet, language),
  );
  const downloadableBoardSets = listDownloadableBoardSets(boardSets);

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

  async function handleExport(boardSet: BoardSetRecord) {
    try {
      await exportBoardSet(boardSet);
    } catch {
      showSnackbar({
        message: (t) => t(m.libraryExportFailed, { name: boardSet.name }),
        severity: "error",
      });
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
        onShowInfo={setInfoTarget}
        onExport={(boardSet) => void handleExport(boardSet)}
        onRequestDelete={setDeleteTarget}
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
