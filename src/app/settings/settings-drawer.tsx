import { AppDrawer } from "@app/shell/app-drawer";
import {
  BoardSettings,
  MessageSettings,
  SuggestionSettings,
} from "@features/board";
import GitHubIcon from "@mui/icons-material/GitHub";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { ExternalLink } from "@shared/ui/external-link";
import { useId, type ReactNode } from "react";
import { version } from "../../../package.json";
import { LanguageSettings } from "./language-settings";
import { SpeechSettings } from "./speech-settings";
import { ThemeSettings } from "./theme-settings";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const t = useTranslate();

  return (
    <AppDrawer
      title={t(m.settingsTitle)}
      closeLabel={t(m.settingsClose)}
      open={open}
      onClose={onClose}
      anchor="right"
    >
      <Box sx={{ px: 3, pb: 3 }}>
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
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionMessage)}>
          <MessageSettings />
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionSuggestions)}>
          <SuggestionSettings />
        </SettingsSection>

        <Divider sx={{ my: 3 }} />

        <SettingsSection title={t(m.settingsSectionAbout)}>
          <Stack spacing={1}>
            <ExternalLink
              href="https://github.com/shayc/aac-board-ai"
              variant="body2"
              color="text.secondary"
              sx={{ alignSelf: "flex-start" }}
            >
              <GitHubIcon
                fontSize="small"
                sx={{ mr: 1, verticalAlign: "text-bottom" }}
              />
              {t(m.aboutSourceCode)}
            </ExternalLink>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {t(m.aboutVersion, { version })}
            </Typography>
          </Stack>
        </SettingsSection>
      </Box>
    </AppDrawer>
  );
}

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  const headingId = useId();

  return (
    <Box role="group" aria-labelledby={headingId}>
      <Typography
        id={headingId}
        component="h3"
        variant="subtitle2"
        sx={{ mb: 1.5, color: "text.secondary" }}
      >
        {title}
      </Typography>
      <Stack spacing={3}>{children}</Stack>
    </Box>
  );
}
