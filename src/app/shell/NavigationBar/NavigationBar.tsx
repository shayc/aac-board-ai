import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";

export function NavigationBar() {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title="Go back">
        <IconButton disabled aria-label="Back" size="large" color="inherit">
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Go forward">
        <IconButton
          disabled
          aria-label="Forward"
          size="large"
          color="inherit"
          sx={{ mr: 2 }}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Tooltip>

      <Select
        sx={{ color: "inherit" }}
        size="small"
        value="Core 36"
        onChange={() => alert("Not implemented")}
      >
        <MenuItem value="Core 24">Core 24</MenuItem>
        <MenuItem value="Core 36">Core 36</MenuItem>
        <MenuItem value="Core 60">Core 60</MenuItem>
      </Select>
    </Box>
  );
}
