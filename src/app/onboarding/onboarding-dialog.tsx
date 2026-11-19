import { areSuggestionsSupported } from "@features/board";
import LockIcon from "@material-symbols/svg-600/rounded/lock.svg?react";
import RecordVoiceOverIcon from "@material-symbols/svg-600/rounded/record_voice_over.svg?react";
import StarShineIcon from "@material-symbols/svg-600/rounded/star_shine.svg?react";
import TranslateIcon from "@material-symbols/svg-600/rounded/translate.svg?react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent, {
  dialogContentClasses,
} from "@mui/material/DialogContent";
import DialogTitle, { dialogTitleClasses } from "@mui/material/DialogTitle";
import List, { listClasses } from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText, { listItemTextClasses } from "@mui/material/ListItemText";
import type { Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { locales } from "@paraglide/runtime";
import { useTranslate } from "@shared/language/use-translate";
import { shortLandscape } from "@shared/theme/short-landscape";
import { Icon, type IconSvg } from "@shared/ui/icon";
import { AppIcon } from "./app-icon";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Highlight {
  id: string;
  icon: IconSvg;
  title: string;
  description: string;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const t = useTranslate();
  const isNarrowScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const isShortLandscape = useMediaQuery(shortLandscape);

  const suggestionsOrLanguageHighlight: Highlight = areSuggestionsSupported()
    ? {
        id: "suggestions",
        icon: StarShineIcon,
        title: t(m.onboardingSuggestionsTitle),
        description: t(m.onboardingSuggestionsDescription),
      }
    : {
        id: "language",
        icon: TranslateIcon,
        title: t(m.onboardingLanguageTitle),
        description: t(m.onboardingLanguageDescription, {
          count: locales.length,
        }),
      };

  const highlights: Highlight[] = [
    {
      id: "tap-to-speak",
      icon: RecordVoiceOverIcon,
      title: t(m.onboardingTapToSpeakTitle),
      description: t(m.onboardingTapToSpeakDescription),
    },
    suggestionsOrLanguageHighlight,
    {
      id: "free-private",
      icon: LockIcon,
      title: t(m.onboardingFreePrivateTitle),
      description: t(m.onboardingFreePrivateDescription),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isNarrowScreen || isShortLandscape}
      fullWidth
      maxWidth="xs"
    >
      <Box sx={introductionSx}>
        <Box>
          <AppIcon />

          <DialogTitle
            variant="h4"
            sx={{
              maxWidth: 320,
              mx: "auto",
              py: 0,
              fontWeight: "fontWeightBold",
              textAlign: "center",
              textWrap: "balance",
            }}
          >
            {t(m.onboardingTitle)}
          </DialogTitle>
        </Box>

        <DialogContent sx={{ flex: "none", pb: 0, overflowY: "visible" }}>
          <List
            disablePadding
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 4,
              pl: 2,
            }}
          >
            {highlights.map(({ id, icon, title, description }) => (
              <HighlightItem
                key={id}
                icon={icon}
                title={title}
                description={description}
              />
            ))}
          </List>
        </DialogContent>
      </Box>

      <DialogActions sx={actionsSx}>
        <Button fullWidth variant="contained" size="large" onClick={onClose}>
          {t(m.onboardingContinue)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function introductionSx(theme: Theme) {
  return {
    minHeight: 0,
    my: "auto",
    pt: 6,
    // The action stays in view while a tall introduction scrolls.
    overflowY: "auto",
    [shortLandscape(theme)]: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      alignItems: "center",
      gap: 4,
      width: "100%",
      maxWidth: theme.breakpoints.values.md,
      mx: "auto",
      pt: 1,
      px: 6,
      [`& .${dialogTitleClasses.root}`]: {
        fontSize: theme.typography.h5.fontSize,
      },
      [`& .${dialogContentClasses.root}`]: { p: 0 },
      [`& .${listClasses.root}`]: { gap: 1, mt: 0, pl: 0 },
      [`& .${listItemTextClasses.secondary}`]: theme.typography.body2,
    },
  };
}

function actionsSx(theme: Theme) {
  return {
    px: 3,
    pt: 5,
    pb: 4,
    [shortLandscape(theme)]: {
      width: "100%",
      maxWidth: theme.breakpoints.values.md,
      mx: "auto",
      px: 6,
      py: 1,
    },
  };
}

type HighlightItemProps = Omit<Highlight, "id">;

function HighlightItem({ icon, title, description }: HighlightItemProps) {
  return (
    <ListItem
      disableGutters
      disablePadding
      sx={{ alignItems: "flex-start", gap: 2 }}
    >
      <ListItemIcon
        sx={{
          justifyContent: "center",
          width: 40,
          minWidth: 0,
          pt: 0.5,
          fontSize: "36px",
        }}
      >
        <Icon svg={icon} color="primary" fontSize="inherit" />
      </ListItemIcon>

      <ListItemText
        primary={title}
        secondary={description}
        slotProps={{
          primary: { sx: { fontWeight: "fontWeightBold" } },
          secondary: { variant: "body1", sx: { textWrap: "balance" } },
        }}
        sx={{ my: 0 }}
      />
    </ListItem>
  );
}
