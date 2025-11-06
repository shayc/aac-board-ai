import {
  deleteBoardset,
  getBoardsBatch,
  listBoardsets,
  openBoardsDB,
  type BoardsetRecord,
} from "@features/board/db/boards-db";
import DeleteIcon from "@mui/icons-material/Delete";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Fade from "@mui/material/Fade";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { OBFLicense } from "@shared/open-board-format/schema";
import { useSnackbar } from "@shared/contexts/SnackbarProvider/useSnackbar";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router";

type ViewMode = "grid" | "list";

interface BoardSetWithMetadata extends BoardsetRecord {
  license?: OBFLicense;
}

export function LibraryPage() {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [boardSets, setBoardSets] = useState<BoardSetWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    async function loadBoardSets() {
      try {
        const db = await openBoardsDB();
        const sets = await listBoardsets(db);

        // Fetch license info from root boards
        const setsWithMetadata = await Promise.all(
          sets.map(async (set) => {
            if (!set.rootBoardId) {
              return set;
            }

            const boards = await getBoardsBatch(db, set.setId, [
              set.rootBoardId,
            ]);
            const rootBoard = boards[0];

            return {
              ...set,
              license: rootBoard?.json.license,
            };
          })
        );

        setBoardSets(setsWithMetadata);
        db.close();
      } catch (error) {
        console.error("Failed to load board sets:", error);
        showSnackbar({ message: "Failed to load library" });
      } finally {
        setLoading(false);
      }
    }

    void loadBoardSets();
  }, [showSnackbar]);

  function handleDeleteClick(setId: string) {
    setSetToDelete(setId);
    setDeleteDialogOpen(true);
  }

  function handleDeleteCancel() {
    setDeleteDialogOpen(false);
    setSetToDelete(null);
  }

  async function handleDeleteConfirm() {
    if (!setToDelete) return;

    try {
      const db = await openBoardsDB();
      await deleteBoardset(db, setToDelete);
      db.close();

      setBoardSets((prev) => prev.filter((set) => set.setId !== setToDelete));
      showSnackbar({ message: "Board set deleted" });
    } catch (error) {
      console.error("Failed to delete board set:", error);
      showSnackbar({ message: "Failed to delete board set" });
    } finally {
      setDeleteDialogOpen(false);
      setSetToDelete(null);
    }
  }

  function handleViewModeChange(_event: React.MouseEvent, newMode: ViewMode) {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }

  if (loading) {
    return (
      <Container component="main" maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  const setToDeleteName = boardSets.find(
    (set) => set.setId === setToDelete
  )?.name;

  return (
    <Container component="main" maxWidth="lg">
      <Fade in timeout={reduceMotion ? 0 : 400}>
        <Box sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4" component="h1">
              Library
            </Typography>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              aria-label="view mode"
              size="small"
            >
              <ToggleButton value="grid" aria-label="grid view">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
                <ViewListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {boardSets.length === 0 ? (
            <Typography color="text.secondary">
              No board sets in library. Import a board set to get started.
            </Typography>
          ) : viewMode === "grid" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {boardSets.map((set) => (
                <Card
                  key={set.setId}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <CardContent
                    component={RouterLink}
                    to={`/sets/${encodeURIComponent(set.setId)}`}
                    sx={{
                      flexGrow: 1,
                      textDecoration: "none",
                      color: "inherit",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <Typography variant="h6" component="h2" gutterBottom>
                      {set.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {set.boardCount}{" "}
                      {set.boardCount === 1 ? "board" : "boards"}
                    </Typography>
                    {set.license?.author_name && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        By {set.license.author_name}
                      </Typography>
                    )}
                    {set.license?.type && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        License: {set.license.type}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                    <Tooltip title="Delete board set">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(set.setId)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
            <Stack spacing={1}>
              {boardSets.map((set) => (
                <Card key={set.setId} variant="outlined">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      p: 2,
                    }}
                  >
                    <Box
                      component={RouterLink}
                      to={`/sets/${encodeURIComponent(set.setId)}`}
                      sx={{
                        flexGrow: 1,
                        textDecoration: "none",
                        color: "inherit",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      <Typography variant="h6" component="h2">
                        {set.name}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          flexWrap: "wrap",
                          mt: 0.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {set.boardCount}{" "}
                          {set.boardCount === 1 ? "board" : "boards"}
                        </Typography>
                        {set.license?.author_name && (
                          <Typography variant="body2" color="text.secondary">
                            By {set.license.author_name}
                          </Typography>
                        )}
                        {set.license?.type && (
                          <Typography variant="body2" color="text.secondary">
                            License: {set.license.type}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Tooltip title="Delete board set">
                      <IconButton
                        onClick={() => handleDeleteClick(set.setId)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </Fade>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Board Set?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete "{setToDeleteName}"? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button
            onClick={() => void handleDeleteConfirm()}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
