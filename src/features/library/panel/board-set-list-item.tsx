import IconButton from "@mui/material/IconButton";
import ListItem, { listItemClasses } from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import type { Theme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useUILocale } from "@shared/language/language-store";
import { type Translate, useTranslate } from "@shared/language/use-translate";
import { useEndSide } from "@shared/theme/rtl";
import { type MouseEvent, type Ref, useEffect, useId, useRef } from "react";
import { Link } from "react-router";
import type { BoardSetDownloadPhase } from "../catalog/board-set-downloads";
import { useBoardSetDownload } from "../catalog/use-board-set-download";
import type { DownloadProgress } from "../import/import-from-url";
import { BoardSetActionIcon } from "./board-set-action-icon";

const BYTES_PER_MEGABYTE = 1_000_000;

interface BoardSetListItemProps {
  menuId: string;
  name: string;
  to: string | undefined;
  downloadURL: string | undefined;
  isActive: boolean;
  isMenuOpen: boolean;
  onMenuOpen: (element: HTMLElement) => void;
}

// One row serves a board set from catalog download to stored entry, so its
// action button stays the same control while it changes state.
export function BoardSetListItem({
  menuId,
  name,
  to,
  downloadURL,
  isActive,
  isMenuOpen,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();
  const uiLocale = useUILocale();
  const endSide = useEndSide();
  const statusId = useId();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { phase, download, cancel } = useBoardSetDownload({
    name,
    url: downloadURL,
  });
  const isDownloading = phase !== undefined;
  const wasDownloadingRef = useRef(isDownloading);
  // A download keeps its row in the download state until it settles, even once
  // its set is stored.
  const linkTarget = isDownloading ? undefined : to;
  const isOpenable = linkTarget !== undefined;

  useEffect(() => {
    const hasFinishedDownload = wasDownloadingRef.current && !isDownloading;
    wasDownloadingRef.current = isDownloading;

    if (hasFinishedDownload && isOpenable) {
      linkRef.current?.focus();
    }
  }, [isDownloading, isOpenable]);

  const status = phase && describeDownloadPhase(phase, t, uiLocale);
  const isImporting = phase?.kind === "importing";
  const isCancellable = isDownloading && !isImporting;
  const buttonProps = isOpenable
    ? {
        "aria-label": t(m.libraryMoreOptionsFor, { name }),
        "aria-controls": isMenuOpen ? menuId : undefined,
        "aria-haspopup": "menu" as const,
        "aria-expanded": isMenuOpen ? ("true" as const) : undefined,
        onClick: (event: MouseEvent<HTMLElement>) =>
          onMenuOpen(event.currentTarget),
      }
    : {
        "aria-label": isCancellable
          ? t(m.libraryCancelDownloadBoardSet, { name })
          : t(m.libraryDownloadBoardSet, { name }),
        "aria-describedby": status ? statusId : undefined,
        "aria-disabled": isImporting,
        onClick: isCancellable ? cancel : () => void download(),
      };

  return (
    <ListItem
      secondaryAction={
        <Tooltip
          title={t(tooltipMessage(phase, isOpenable))}
          placement={endSide}
        >
          <IconButton {...buttonProps} edge="end" sx={{ border: "none" }}>
            <BoardSetActionIcon phase={phase} isOpenable={isOpenable} />
          </IconButton>
        </Tooltip>
      }
      disablePadding={isOpenable}
      sx={isOpenable ? secondaryActionRevealSx : undefined}
    >
      {linkTarget === undefined ? (
        <ListItemText
          primary={name}
          slotProps={{
            primary: { noWrap: true, sx: { color: "text.secondary" } },
          }}
        />
      ) : (
        <BoardSetLink
          ref={linkRef}
          name={name}
          to={linkTarget}
          isActive={isActive}
        />
      )}

      {status && (
        <span id={statusId} hidden>
          {status}
        </span>
      )}
    </ListItem>
  );
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

function tooltipMessage(
  phase: BoardSetDownloadPhase | undefined,
  isOpenable: boolean,
) {
  if (isOpenable) {
    return m.libraryMoreOptions;
  }

  if (!phase) {
    return m.libraryDownload;
  }

  if (phase.kind === "importing") {
    return m.libraryImportingStatus;
  }

  return m.libraryCancelDownload;
}

function secondaryActionRevealSx(theme: Theme) {
  return {
    "@media (hover: hover)": {
      [theme.breakpoints.up("md")]: {
        [`& .${listItemClasses.secondaryAction}`]: {
          opacity: 0,
          pointerEvents: "none",
          transition: theme.transitions.create("opacity", {
            duration: theme.transitions.duration.shortest,
          }),
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        },
        [`&:is(:hover, :focus-within, :has([aria-expanded="true"])) .${listItemClasses.secondaryAction}`]:
          { opacity: 1, pointerEvents: "auto" },
      },
    },
  };
}

interface BoardSetLinkProps {
  ref: Ref<HTMLAnchorElement>;
  name: string;
  to: string;
  isActive: boolean;
}

function BoardSetLink({ ref, name, to, isActive }: BoardSetLinkProps) {
  return (
    <ListItemButton
      ref={ref}
      aria-current={isActive ? "true" : undefined}
      component={Link}
      to={to}
      selected={isActive}
    >
      <ListItemText primary={name} slotProps={{ primary: { noWrap: true } }} />
    </ListItemButton>
  );
}
