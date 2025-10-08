import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { LanguageSettings } from "./LanguageSettings/LanguageSettings";
import { SpeechSettings } from "./SpeechSettings/SpeechSettings";
import { ThemeSettings } from "./ThemeSettings/ThemeSettings";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Settings
        </Typography>

        <IconButton
          aria-label="Close settings drawer"
          size="large"
          edge="end"
          color="inherit"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </Toolbar>

      <Box sx={{ width: 360, paddingInline: 3 }}>
        <ThemeSettings />
        <LanguageSettings />
        <SpeechSettings />
      </Box>
    </Drawer>
  );
}
