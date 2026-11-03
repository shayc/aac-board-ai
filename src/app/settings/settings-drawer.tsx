import { DRAWER_BASE_WIDTH } from "@app/shell/drawer-width";
import {
  BoardSettings,
  PlaybackSettings,
  SuggestionSettings,
} from "@features/board";
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
import { ExternalLink } from "@shared/ui/external-link";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { useState, type ReactNode } from "react";
import { ThemeSettings } from "./theme-settings";
import { LanguageSettings } from "./language-settings";
import { SpeechSettings } from "./speech-settings";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const t = useTranslate();
  const [isContentScrolled, setIsContentScrolled] = useState(false);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        paper: {
          "aria-label": t(m.settingsTitle),
          sx: {
            display: "flex",
            flexDirection: "column",
            width: safeAreaGutter(DRAWER_BASE_WIDTH, "right"),
          },
        },
      }}
    >
      <Toolbar
        sx={(theme) => ({
          borderBottom: 1,
          borderColor: isContentScrolled ? "divider" : "transparent",
          [theme.breakpoints.up("sm")]: {
            pr: safeAreaGutter(theme.spacing(3), "right"),
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
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box
        onScroll={(event) =>
          setIsContentScrolled(event.currentTarget.scrollTop > 0)
        }
        sx={(theme) => ({
          flexGrow: 1,
          minHeight: 0,
          px: 3,
          pb: 3,
          overflow: "auto",
          [theme.breakpoints.up("sm")]: {
            pr: safeAreaGutter(theme.spacing(3), "right"),
          },
        })}
      >
        <SettingsSection title={t(m.settingsSectionAppearance)}>
          <ThemeSettings />
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionLanguageVoice)}>
          <LanguageSettings />
          <SpeechSettings />
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionBoard)}>
          <BoardSettings />
          <PlaybackSettings />
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionSuggestions)}>
          <SuggestionSettings />
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionAbout)}>
          <ExternalLink
            href="https://github.com/shayc/aac-board-ai"
            variant="body2"
            color="text.secondary"
            sx={{ alignSelf: "flex-start" }}
          >
            <GitHubIcon
              fontSize="small"
              sx={{ mr: 2, verticalAlign: "text-bottom" }}
            />
            {t(m.aboutSourceCode)}
          </ExternalLink>
        </SettingsSection>
      </Box>
    </Drawer>
  );
}

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <>
      <Typography
        component="h3"
        variant="subtitle2"
        sx={{ mb: 2, color: "text.secondary" }}
      >
        {title}
      </Typography>
      <Stack spacing={3}>{children}</Stack>
    </>
  );
}
