import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AISettings } from "./panels/AISettings";
import { AppearanceSettings } from "./panels/AppearanceSettings";
import { LanguageSettings } from "./panels/LanguageSettings";
import { SpeechSettings } from "./panels/SpeechSettings";

export interface SettingsDrawerProps {
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

        <Tooltip title="Close settings">
          <span>
            <IconButton
              aria-label="Close settings"
              size="large"
              edge="end"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>

      <Box sx={{ width: 320, px: 3 }}>
        <AppearanceSettings />
        <LanguageSettings />
        <SpeechSettings />
        <AISettings />
      </Box>
    </Drawer>
  );
}
