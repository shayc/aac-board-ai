import { DRAWER_BASE_WIDTH } from "@app/layouts/drawer-width";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { ExternalLink } from "@shared/components/external-link";
import { isSupported } from "@shayc/react-built-in-ai";
import { SuggestionsSettings } from "./suggestions-settings";
import { AppearanceSettings } from "./appearance-settings";
import { LanguageSettings } from "./language-settings";
import { PlaybackSettings } from "./playback-settings";
import { SpeechSettings } from "./speech-settings";

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const sectionHeadingSx = { fontWeight: 700, mb: 2 } as const;

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
              width: `calc(${DRAWER_BASE_WIDTH} + env(safe-area-inset-right))`,
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
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
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

      <Box
        sx={[
          { px: 3, pb: 3 },
          (theme) => ({
            [theme.breakpoints.up("sm")]: {
              pr: "env(safe-area-inset-right)",
            },
          }),
        ]}
      >
        <Typography component="h3" variant="subtitle2" sx={sectionHeadingSx}>
          {m.settingsSectionAppearance()}
        </Typography>
        <Stack spacing={3}>
          <AppearanceSettings />
          <LanguageSettings />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography component="h3" variant="subtitle2" sx={sectionHeadingSx}>
          {m.settingsSectionSpeech()}
        </Typography>
        <Stack spacing={3}>
          <SpeechSettings />
          <PlaybackSettings />
        </Stack>

        {isSupported("Rewriter") && (
          <>
            <Divider sx={{ my: 3 }} />

            <Typography
              component="h3"
              variant="subtitle2"
              sx={sectionHeadingSx}
            >
              {m.settingsSectionSuggestions()}
            </Typography>
            <SuggestionsSettings />
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography component="h3" variant="subtitle2" sx={sectionHeadingSx}>
          {m.settingsSectionAbout()}
        </Typography>
        <ExternalLink
          href="https://github.com/shayc/aac-board-ai"
          color="text.secondary"
        >
          <GitHubIcon
            fontSize="small"
            sx={{ verticalAlign: "text-bottom", mr: 2 }}
          />
          {m.librarySourceCode()}
        </ExternalLink>
      </Box>
    </Drawer>
  );
}
