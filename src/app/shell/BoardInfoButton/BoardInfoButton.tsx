import { useBoard } from "@features/board/context/useBoard";
import InfoIcon from "@mui/icons-material/InfoOutline";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";

export function BoardInfoButton() {
  const { board } = useBoard();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
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
    </>
  );
}
