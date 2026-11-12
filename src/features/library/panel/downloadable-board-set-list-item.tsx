import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import Box from "@mui/material/Box";
import CircularProgress, {
  circularProgressClasses,
} from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import { useEndSide } from "@shared/theme/rtl";
import { useId } from "react";
import type { BoardSetDownloadPhase } from "../catalog/board-set-downloads";
import { useBoardSetDownload } from "../catalog/use-board-set-download";
import type { DownloadProgress } from "../import/import-from-url";

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

  const isCancellable = phase !== undefined && phase.kind !== "importing";
  const status = phase && describeDownloadPhase(phase, t, uiLocale);

  function handleClick() {
    if (isCancellable) {
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
              isCancellable
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
      <ListItemText
        primary={name}
        slotProps={{
          primary: { noWrap: true, sx: { color: "text.secondary" } },
        }}
      />

      {status && (
        <span id={statusId} hidden>
          {status}
        </span>
      )}
    </ListItem>
  );
}

interface DownloadButtonIconProps {
  phase: BoardSetDownloadPhase | undefined;
}

function DownloadButtonIcon({ phase }: DownloadButtonIconProps) {
  if (!phase) {
    return <DownloadOutlinedIcon />;
  }

  const isImporting = phase.kind === "importing";

  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        aria-hidden
        color="inherit"
        size={PROGRESS_RING_SIZE}
        enableTrackSlot
        {...ringProgress(phase)}
        sx={{
          // Downloads can update faster than MUI's default 300ms transition.
          [`& .${circularProgressClasses.circle}`]: { transition: "none" },
        }}
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
  if (!phase) {
    return m.libraryDownload;
  }

  if (phase.kind === "importing") {
    return m.libraryImportingStatus;
  }

  return m.libraryCancelDownload;
}

type RingProgress =
  | { variant: "determinate"; value: number }
  | { variant: "indeterminate" };

function ringProgress(phase: BoardSetDownloadPhase): RingProgress {
  // Wait for response headers to avoid flashing an indeterminate spinner.
  if (phase.kind === "connecting") {
    return { variant: "determinate", value: 0 };
  }

  if (phase.kind === "importing") {
    return { variant: "determinate", value: 100 };
  }

  if (phase.total === undefined) {
    return { variant: "indeterminate" };
  }

  return {
    variant: "determinate",
    value: Math.min(100, (phase.loaded / phase.total) * 100),
  };
}

function describeDownloadPhase(
  phase: BoardSetDownloadPhase,
  t: Translate,
  locale: string,
): string {
  switch (phase.kind) {
    case "connecting":
      return t(m.libraryDownloadingStatus);
    case "downloading":
      return describeDownloadProgress(phase, t, locale);
    case "importing":
      return t(m.libraryImportingStatus);
  }
}

function describeDownloadProgress(
  { loaded, total }: DownloadProgress,
  t: Translate,
  locale: string,
): string {
  if (total === undefined) {
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
    loaded: megabytes.format(loaded / BYTES_PER_MEGABYTE),
    total: megabytesWithUnit.format(total / BYTES_PER_MEGABYTE),
  });
}
