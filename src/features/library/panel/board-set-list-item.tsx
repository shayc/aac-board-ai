import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ListItem, { listItemClasses } from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { keyframes, type Theme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useEndSide } from "@shared/theme/rtl";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useIsBoardSetDownloading } from "../catalog/board-set-downloads";
import { DownloadProgressRing } from "./download-progress-ring";

const fadeIn = keyframes({ from: { opacity: 0 } });
const fadeOut = keyframes({ to: { opacity: 0 } });

interface BoardSetListItemProps {
  boardSetId: string;
  menuId: string;
  name: string;
  to: string;
  isActive: boolean;
  isMenuOpen: boolean;
  onMenuOpen: (element: HTMLElement) => void;
}

export function BoardSetListItem({
  boardSetId,
  menuId,
  name,
  to,
  isActive,
  isMenuOpen,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();
  const endSide = useEndSide();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const isDownloading = useIsBoardSetDownloading(boardSetId);
  // A download is still finishing when its stored entry first appears, and the
  // entry stays freshly downloaded after the download settles.
  const [isFreshlyDownloaded] = useState(isDownloading);

  useEffect(() => {
    if (isFreshlyDownloaded) {
      linkRef.current?.focus();
    }
  }, [isFreshlyDownloaded]);

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={t(m.libraryMoreOptions)} placement={endSide}>
          <IconButton
            aria-label={t(m.libraryMoreOptionsFor, { name })}
            aria-controls={isMenuOpen ? menuId : undefined}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen ? "true" : undefined}
            edge="end"
            onClick={(event) => onMenuOpen(event.currentTarget)}
            sx={{ border: "none" }}
          >
            {isFreshlyDownloaded ? <DownloadedMenuIcon /> : <MoreVertIcon />}
          </IconButton>
        </Tooltip>
      }
      disablePadding
      sx={secondaryActionRevealSx}
    >
      <ListItemButton
        ref={linkRef}
        aria-current={isActive ? "true" : undefined}
        component={Link}
        to={to}
        selected={isActive}
      >
        <ListItemText
          primary={name}
          slotProps={{ primary: { noWrap: true } }}
        />
      </ListItemButton>
    </ListItem>
  );
}

// Morphs the finished download ring into the menu icon so the button reads as
// one control changing state rather than a new one appearing.
function DownloadedMenuIcon() {
  return (
    <Box sx={downloadedMenuIconSx}>
      <Box sx={(theme) => crossfadeSx(theme, fadeOut, "forwards")}>
        <DownloadProgressRing variant="determinate" value={100} />
      </Box>

      <MoreVertIcon sx={(theme) => crossfadeSx(theme, fadeIn, "backwards")} />
    </Box>
  );
}

function downloadedMenuIconSx() {
  return {
    display: "grid",
    "& > *": { gridArea: "1 / 1", display: "flex" },
    "@media (prefers-reduced-motion: reduce)": {
      "& > :first-of-type": { display: "none" },
    },
  };
}

function crossfadeSx(
  theme: Theme,
  fade: ReturnType<typeof keyframes>,
  fillMode: "forwards" | "backwards",
) {
  return {
    animation: `${fade} ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeInOut} ${fillMode}`,
    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
  };
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
