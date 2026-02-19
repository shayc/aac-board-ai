import { useBoardSets } from "@features/board/hooks/useBoardSets";
import { useImportBoardFiles } from "@features/board/hooks/useImportBoardFiles";
import { removeBoardSet } from "@features/board/store/board-sets-store";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSnackbar } from "@shared/contexts/SnackbarProvider/useSnackbar";
import { useState } from "react";
import { generatePath, useNavigate } from "react-router";

function LibraryPage() {
  const { boardSets, isLoading } = useBoardSets();
  const { importBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

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
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" component="h1">
          Library
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => void importBoardFiles()}
        >
          Import
        </Button>
      </Stack>

      {isLoading && (
        <List>
          {Array.from({ length: 3 }, (_, i) => (
            <ListItem key={i}>
              <ListItemIcon>
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton width="60%" />}
                secondary={<Skeleton width="30%" />}
              />
            </ListItem>
          ))}
        </List>
      )}

      {!isLoading && boardSets.length === 0 && (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", py: 8 }}
        >
          No board sets imported yet. Click &ldquo;Import&rdquo; to add one.
        </Typography>
      )}

      {!isLoading && boardSets.length > 0 && (
        <List>
          {boardSets.map((set) => (
            <ListItem
              key={set.setId}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`Delete ${set.name}`}
                  onClick={() =>
                    setDeleteTarget({ setId: set.setId, name: set.name })
                  }
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton
                onClick={() => handleNavigate(set.setId, set.rootBoardId)}
              >
                <ListItemIcon>
                  <FolderOpenIcon />
                </ListItemIcon>
                <ListItemText
                  primary={set.name}
                  secondary={`${set.boardCount} ${set.boardCount === 1 ? "board" : "boards"}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete board set?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{deleteTarget?.name}&rdquo; and all its boards will be
            permanently deleted. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={() => void handleDelete()} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LibraryPage;
