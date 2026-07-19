import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import Backdrop from "@mui/material/Backdrop";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";

interface BoardFileDropOverlayProps {
  open: boolean;
}

export function BoardFileDropOverlay({ open }: BoardFileDropOverlayProps) {
  return (
    <Backdrop
      open={open}
      aria-hidden
      sx={(theme) => ({
        zIndex: theme.zIndex.modal,
        pointerEvents: "none",
        backgroundColor: alpha(theme.palette.background.default, 0.7),
        backdropFilter: "blur(2px)",
      })}
    >
      <Grow in={open}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            px: 6,
            py: 5,
            borderRadius: 4,
            border: `2px dashed ${theme.palette.primary.main}`,
          })}
        >
          <FileDownloadOutlinedIcon color="primary" sx={{ fontSize: 56 }} />
          <Typography variant="h6">{m.libraryDropToImport()}</Typography>
        </Paper>
      </Grow>
    </Backdrop>
  );
}
