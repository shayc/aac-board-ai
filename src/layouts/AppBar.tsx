import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import { default as MUIAppBar } from "@mui/material/AppBar";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

interface AppBarProps {
  setIsNavigationOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export function AppBar({
  setIsNavigationOpen,
  setIsSettingsOpen,
}: AppBarProps) {
  return (
    <MUIAppBar position="static">
      <Toolbar>
        <IconButton
          aria-label="Menu"
          size="large"
          edge="start"
          color="inherit"
          onClick={() => setIsNavigationOpen(true)}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          disabled
          aria-label="Back"
          size="large"
          color="inherit"
          onClick={() => {
            alert("Not implemented");
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <IconButton
          disabled
          aria-label="Forward"
          size="large"
          color="inherit"
          sx={{ mr: 2 }}
          onClick={() => {
            alert("Not implemented");
          }}
        >
          <ArrowBackIcon style={{ transform: "rotate(180deg)" }} />
        </IconButton>

        <FormControl sx={{ m: 1, minWidth: 80 }}>
          <Select
            displayEmpty
            sx={{ color: "inherit" }}
            size="small"
            value={"AI Communication Board"}
            onChange={() => {
              alert("Not implemented");
            }}
          >
            <MenuItem value={"Core 24"}>Core 24</MenuItem>
            <MenuItem value={"Core 36"}>Core 36</MenuItem>
            <MenuItem value={"Core 60"}>Core 60</MenuItem>
          </Select>
        </FormControl>
        <Typography component="div" sx={{ flexGrow: 1 }}></Typography>

        <IconButton
          aria-label="Settings"
          size="large"
          edge="end"
          color="inherit"
          onClick={() => setIsSettingsOpen(true)}
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </MUIAppBar>
  );
}
