import { useBoard } from "@features/board/context/useBoard";
import type { BoardsetRecord } from "@features/board/db/boards-db";
import InfoIcon from "@mui/icons-material/InfoOutline";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useNavigate } from "react-router";

interface BoardSetSelectorProps {
  boardsets: BoardsetRecord[];
  setId: string;
}

export function BoardSetSelector({ boardsets, setId }: BoardSetSelectorProps) {
  const { board } = useBoard();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>
      <Select
        sx={{ color: "inherit" }}
        size="small"
        value={setId}
        onChange={(e) => {
          const selectedSet = boardsets.find((s) => s.setId === e.target.value);
          if (selectedSet?.rootBoardId) {
            void navigate(
              `/sets/${selectedSet.setId}/boards/${selectedSet.rootBoardId}`,
            );
          }
        }}
      >
        {boardsets.map((set) => (
          <MenuItem key={set.setId} value={set.setId}>
            {set.name}
          </MenuItem>
        ))}
      </Select>

      <Typography noWrap sx={{ ml: 2, mr: 1 }}>
        {board?.name}
      </Typography>

      <Tooltip title="View board information">
        <IconButton aria-label="View board information" onClick={handleClick}>
          <InfoIcon />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        <Box sx={{ p: 2, width: "300px" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {board?.name}
          </Typography>

          <Typography>
            Author:{" "}
            <Link
              href={board?.license?.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {board?.license?.authorName}
            </Link>
          </Typography>

          <Typography>
            License:{" "}
            <Link
              href={board?.license?.copyrightNoticeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {board?.license?.type}
            </Link>
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
}
