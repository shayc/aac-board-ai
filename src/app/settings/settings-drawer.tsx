import { AppDrawer } from "@app/shell/app-drawer";
import {
  MessageSettings,
  ScanningSettings,
  SuggestionSettings,
  TileSettings,
} from "@features/board";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import GithubLogoIcon from "@phosphor-icons/core/fill/github-logo-fill.svg?react";
import { useTranslate } from "@shared/language/use-translate";
import { ExternalLink } from "@shared/ui/external-link";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";
import { type ReactNode, useId } from "react";
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
      errorTitle={t(m.settingsLoadFailed)}
      open={open}
      onClose={onClose}
      anchor="right"
      // Tile settings are judged against the board behind the drawer.
      hasInvisibleBackdrop
    >
      <Stack divider={<Divider />} spacing={3} sx={{ px: 3, pb: 3 }}>
        <SettingsSection title={t(m.settingsSectionAppearance)}>
          <ThemeSettings />
        </SettingsSection>

        <SettingsSection title={t(m.settingsSectionLanguageVoice)}>
          <LanguageSettings />
          <SpeechSettings />
        </SettingsSection>

        <SettingsSection title={t(m.settingsSectionBoard)}>
          <TileSettings />
        </SettingsSection>

        <SettingsSection title={t(m.settingsSectionMessage)}>
          <MessageSettings />
        </SettingsSection>

        <SettingsSection title={t(m.settingsSectionSuggestions)}>
          <SuggestionSettings />
        </SettingsSection>

        <SettingsSection title={t(m.settingsSectionSwitchAccess)}>
          <ScanningSettings />
        </SettingsSection>

        <SettingsSection title={t(m.settingsSectionAbout)}>
          <Stack spacing={1}>
            <ExternalLink
              href="https://github.com/shayc/aac-board-ai"
              variant="body2"
              sx={{ alignSelf: "flex-start" }}
            >
              <PhosphorIcon
                icon={GithubLogoIcon}
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
      </Stack>
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
