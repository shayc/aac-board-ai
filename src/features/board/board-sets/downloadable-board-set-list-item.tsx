import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import { useEndSide } from "@shared/theme/rtl";
import { useId } from "react";
import type { DownloadProgress } from "../import/import-from-url";
import type { BoardSetDownloadPhase } from "./board-set-downloads";
import { useBoardSetDownload } from "./use-board-set-download";

const PROGRESS_RING_SIZE = 24;
const BYTES_PER_MEGABYTE = 1_000_000;

interface DownloadableBoardSetListItemProps {
  name: string;
  url: string;
}

export function DownloadableBoardSetListItem({
  name,
  url,
}: DownloadableBoardSetListItemProps) {
  const t = useTranslate();
  const endSide = useEndSide();
  const uiLocale = useUILocale();
  const statusId = useId();
  const { phase, download, cancel } = useBoardSetDownload({ name, url });

  const isDownloading = phase?.kind === "downloading";
  const status = phase && describeDownloadPhase(phase, t, uiLocale);

  function handleClick() {
    if (isDownloading) {
      cancel();
      return;
    }

    void download();
  }

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={t(tooltipMessage(phase))} placement={endSide}>
          <IconButton
            aria-label={t(
              isDownloading
                ? m.libraryCancelDownloadBoardSet
                : m.libraryDownloadBoardSet,
              { name },
            )}
            aria-describedby={status ? statusId : undefined}
            aria-disabled={phase?.kind === "importing"}
            edge="end"
            onClick={handleClick}
            sx={{ border: "none" }}
          >
            <DownloadButtonIcon phase={phase} />
          </IconButton>
        </Tooltip>
      }
    >
      <ListItemText primary={name} slotProps={{ primary: { noWrap: true } }} />
      {status && (
        <span id={statusId} hidden>
          {status}
        </span>
      )}
    </ListItem>
  );
}

function DownloadButtonIcon({
  phase,
}: {
  phase: BoardSetDownloadPhase | undefined;
}) {
  if (!phase) {
    return <DownloadOutlinedIcon />;
  }

  const isImporting = phase.kind === "importing";
  const percent = isImporting ? 100 : downloadPercent(phase);

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        aria-hidden
        color="inherit"
        size={PROGRESS_RING_SIZE}
        variant={percent === undefined ? "indeterminate" : "determinate"}
        value={percent}
        enableTrackSlot
      />
      {!isImporting && (
        <StopRoundedIcon
          sx={{ position: "absolute", inset: 0, margin: "auto", fontSize: 14 }}
        />
      )}
    </Box>
  );
}

function tooltipMessage(phase: BoardSetDownloadPhase | undefined) {
  if (phase?.kind === "downloading") {
    return m.libraryCancelDownload;
  }

  if (phase?.kind === "importing") {
    return m.libraryImportingStatus;
  }

  return m.libraryDownload;
}

function downloadPercent({
  loaded,
  total,
}: DownloadProgress): number | undefined {
  // The size is unknown until the response headers arrive, so an empty ring
  // that then fills avoids a spinner flashing before every download.
  if (loaded === 0) {
    return 0;
  }

  if (total === undefined) {
    return undefined;
  }

  return Math.min(100, (loaded / total) * 100);
}

function describeDownloadPhase(
  phase: BoardSetDownloadPhase,
  t: Translate,
  locale: string,
): string {
  if (phase.kind === "importing") {
    return t(m.libraryImportingStatus);
  }

  if (phase.total === undefined) {
    return t(m.libraryDownloadingStatus);
  }

  const megabytes = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  });
  const megabytesWithUnit = new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "megabyte",
    maximumFractionDigits: 1,
  });

  return t(m.libraryDownloadProgress, {
    loaded: megabytes.format(phase.loaded / BYTES_PER_MEGABYTE),
    total: megabytesWithUnit.format(phase.total / BYTES_PER_MEGABYTE),
  });
}
