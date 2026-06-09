import CloseIcon from "@mui/icons-material/Close";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { AISettings } from "./ai-settings";
import { AppearanceSettings } from "./appearance-settings";
import { LanguageSettings } from "./language-settings";
import { PlaybackSettings } from "./playback-settings";
import { SpeechSettings } from "./speech-settings";

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          "aria-label": m.settingsTitle(),
          sx: [
            {
              width: "calc(320px + env(safe-area-inset-right))",
            },
            (theme) => ({
              [theme.breakpoints.up("sm")]: {
                pr: 3,
              },
            }),
          ],
        },
      }}
    >
      <Toolbar
        sx={(theme) => ({
          [theme.breakpoints.up("sm")]: {
            pr: "env(safe-area-inset-right)",
          },
        })}
      >
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

      <Stack
        sx={[
          { px: 3, pb: 3 },
          (theme) => ({
            [theme.breakpoints.up("sm")]: {
              pr: "env(safe-area-inset-right)",
            },
          }),
        ]}
      >
        <AppearanceSettings />

        <Divider sx={{ my: 3 }} />

        <Stack spacing={3}>
          <LanguageSettings />
          <SpeechSettings />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <PlaybackSettings />

        <Divider sx={{ my: 3 }} />

        <AISettings />
      </Stack>
    </Drawer>
  );
}
