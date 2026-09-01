import { DRAWER_BASE_WIDTH } from "@app/shell/drawer-width";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import GitHubIcon from "@mui/icons-material/GitHub";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { ExternalLink } from "@shared/ui/external-link";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { AppearanceSettings } from "./appearance-settings";
import { BoardSettings } from "./board-settings";
import { LanguageSettings } from "./language-settings";
import { SpeechSettings } from "./speech-settings";
import { SuggestionsSettings } from "./suggestions-settings";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const sectionHeadingSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  mb: 2,
  fontWeight: 700,
  "& > svg": { color: "primary.main" },
} as const;

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const t = useTranslate();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        paper: {
          "aria-label": t(m.settingsTitle),
          sx: [
            {
              width: safeAreaGutter(DRAWER_BASE_WIDTH, "right"),
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
            pr: safeAreaInset("right"),
          },
        })}
      >
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
          {t(m.settingsTitle)}
        </Typography>

        <Tooltip title={t(m.settingsClose)}>
          <IconButton
            aria-label={t(m.settingsClose)}
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
              pr: safeAreaInset("right"),
            },
          }),
        ]}
      >
        <Typography component="h3" variant="subtitle1" sx={sectionHeadingSx}>
          <TuneOutlinedIcon fontSize="small" />
          {t(m.settingsSectionGeneral)}
        </Typography>
        <Stack spacing={3}>
          <AppearanceSettings />
          <LanguageSettings />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography component="h3" variant="subtitle1" sx={sectionHeadingSx}>
          <GridViewOutlinedIcon fontSize="small" />
          {t(m.settingsSectionBoard)}
        </Typography>
        <Stack spacing={3}>
          <BoardSettings />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography component="h3" variant="subtitle1" sx={sectionHeadingSx}>
          <VolumeUpOutlinedIcon fontSize="small" />
          {t(m.settingsSectionSpeech)}
        </Typography>
        <Stack spacing={3}>
          <SpeechSettings />
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography component="h3" variant="subtitle1" sx={sectionHeadingSx}>
          <AutoAwesomeIcon fontSize="small" />
          {t(m.settingsSectionSuggestions)}
        </Typography>
        <SuggestionsSettings />

        <Divider sx={{ my: 3 }} />

        <Typography component="h3" variant="subtitle1" sx={sectionHeadingSx}>
          <InfoOutlinedIcon fontSize="small" />
          {t(m.settingsSectionAbout)}
        </Typography>
        <ExternalLink
          href="https://github.com/shayc/aac-board-ai"
          color="text.secondary"
        >
          <GitHubIcon
            fontSize="small"
            sx={{ mr: 2, verticalAlign: "text-bottom" }}
          />
          {t(m.aboutSourceCode)}
        </ExternalLink>
      </Box>
    </Drawer>
  );
}
