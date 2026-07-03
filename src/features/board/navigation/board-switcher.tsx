import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import { useTheme } from "@mui/material/styles";
import { useId, useState } from "react";
import { BoardSwitcherPanel } from "./board-switcher-panel";
import { useBoardNavigation } from "./use-board-navigation";

export interface BoardSwitcherProps {
  label: string;
}

export function BoardSwitcher({ label }: BoardSwitcherProps) {
  const { setId, boardId, goToBoard } = useBoardNavigation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const popoverId = useId();
  const inlineStart = useTheme().direction === "rtl" ? "right" : "left";

  if (!setId) {
    return null;
  }

  const open = Boolean(anchorEl);

  function handleSelect(targetBoardId: string) {
    goToBoard(targetBoardId);
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        color="inherit"
        aria-haspopup="dialog"
        aria-expanded={open || undefined}
        aria-controls={open ? popoverId : undefined}
        endIcon={<ArrowDropDownIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          font: "inherit",
          textTransform: "none",
          px: 2,
          marginInlineStart: -1,
          maxWidth: "100%",
        }}
      >
        <Box
          component="span"
          sx={{
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Box>
      </Button>

      <Popover
        id={popoverId}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: inlineStart }}
        transformOrigin={{ vertical: "top", horizontal: inlineStart }}
        slotProps={{
          paper: {
            sx: {
              width: 320,
              maxWidth: "calc(100vw - 32px)",
              maxHeight: "min(60vh, 480px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            },
          },
        }}
      >
        <BoardSwitcherPanel
          setId={setId}
          selectedBoardId={boardId}
          onSelect={handleSelect}
        />
      </Popover>
    </>
  );
}
