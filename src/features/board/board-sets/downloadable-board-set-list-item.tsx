import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useBoardSetDownload } from "../import/use-board-set-download";

interface DownloadableBoardSetListItemProps {
  name: string;
  url: string;
  onDownloaded: (boardSetId: string) => void;
}

export function DownloadableBoardSetListItem({
  name,
  url,
  onDownloaded,
}: DownloadableBoardSetListItemProps) {
  const t = useTranslate();
  const { isDownloading, download } = useBoardSetDownload({ name, url });

  async function handleDownload() {
    const importedBoardSet = await download();

    if (importedBoardSet) {
      onDownloaded(importedBoardSet.id);
    }
  }

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={t(m.libraryDownload)} placement="right">
          <IconButton
            aria-label={t(m.libraryDownloadBoardSet, { name })}
            aria-disabled={isDownloading}
            edge="end"
            onClick={() => void handleDownload()}
            sx={{ border: "none" }}
          >
            {isDownloading ? (
              <CircularProgress aria-hidden color="inherit" size={24} />
            ) : (
              <DownloadOutlinedIcon />
            )}
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemText primary={name} slotProps={{ primary: { noWrap: true } }} />
    </ListItem>
  );
}
