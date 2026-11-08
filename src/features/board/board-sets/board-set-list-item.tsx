import MoreVertIcon from "@mui/icons-material/MoreVert";
import IconButton from "@mui/material/IconButton";
import ListItem, { listItemClasses } from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

interface BoardSetListItemProps {
  menuId: string;
  name: string;
  to: string;
  isActive: boolean;
  isFocusRequested: boolean;
  isMenuOpen: boolean;
  onMenuOpen: (element: HTMLElement) => void;
}

export function BoardSetListItem({
  menuId,
  name,
  to,
  isActive,
  isFocusRequested,
  isMenuOpen,
  onMenuOpen,
}: BoardSetListItemProps) {
  const t = useTranslate();
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isFocusRequested) {
      linkRef.current?.focus();
    }
  }, [isFocusRequested]);

  return (
    <ListItem
      secondaryAction={
        <Tooltip title={t(m.libraryMoreOptions)} placement="right">
          <IconButton
            aria-label={t(m.libraryMoreOptionsFor, { name })}
            aria-controls={isMenuOpen ? menuId : undefined}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen ? "true" : undefined}
            edge="end"
            onClick={(event) => onMenuOpen(event.currentTarget)}
            sx={{ border: "none" }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      }
      disablePadding
      sx={(theme) => ({
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
      })}
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
