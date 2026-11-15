import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { type Translate, useTranslate } from "@shared/language/use-translate";
import { useEndSide } from "@shared/theme/rtl";
import { useId } from "react";
import type { BoardSetDownloadPhase } from "../catalog/board-set-downloads";
import { useBoardSetDownload } from "../catalog/use-board-set-download";
import type { DownloadProgress } from "../import/import-from-url";
import {
  DownloadProgressRing,
  type RingProgress,
} from "./download-progress-ring";

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
  const uiLocale = useUILocale();
  const statusId = useId();
  const { phase, download, cancel } = useBoardSetDownload({ name, url });

  const status = phase && describeDownloadPhase(phase, t, uiLocale);

  return (
    <ListItem
      secondaryAction={
        <DownloadButton
          statusId={status ? statusId : undefined}
          name={name}
          phase={phase}
          onDownload={() => void download()}
          onCancel={cancel}
        />
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

interface DownloadButtonProps {
  statusId: string | undefined;
  name: string;
  phase: BoardSetDownloadPhase | undefined;
  onDownload: () => void;
  onCancel: () => void;
}

function DownloadButton({
  statusId,
  name,
  phase,
  onDownload,
  onCancel,
}: DownloadButtonProps) {
  const t = useTranslate();
  const endSide = useEndSide();

  const isImporting = phase?.kind === "importing";
  const isCancellable = phase !== undefined && !isImporting;
  const label = isCancellable
    ? t(m.libraryCancelDownloadBoardSet, { name })
    : t(m.libraryDownloadBoardSet, { name });
  const handleClick = isCancellable ? onCancel : onDownload;

  return (
    <Tooltip title={t(tooltipMessage(phase))} placement={endSide}>
      <IconButton
        aria-label={label}
        aria-describedby={statusId}
        aria-disabled={isImporting}
        edge="end"
        onClick={handleClick}
        sx={{ border: "none" }}
      >
        <DownloadButtonIcon phase={phase} />
      </IconButton>
    </Tooltip>
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
      <DownloadProgressRing {...ringProgress(phase)} />

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
