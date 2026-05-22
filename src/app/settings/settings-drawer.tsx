import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useLanguage } from "@shared/language/use-language";
import { AISettings } from "./ai-settings";
import { AppearanceSettings } from "./appearance-settings";
import { LanguageSettings } from "./language-settings";
import { SpeechSettings } from "./speech-settings";

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const { m } = useLanguage();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {m.settingsTitle()}
        </Typography>

        <Tooltip title={m.settingsClose()}>
          <IconButton
            aria-label={m.settingsClose()}
            size="large"
            edge="end"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box sx={{ width: 320, px: 3, pb: 3 }}>
        <Stack>
          <AppearanceSettings />

          <Divider sx={{ my: 3 }} />

          <Stack spacing={3}>
            <LanguageSettings />
            <SpeechSettings />
          </Stack>

          <Divider sx={{ my: 3 }} />

          <AISettings />
        </Stack>
      </Box>
    </Drawer>
  );
}
