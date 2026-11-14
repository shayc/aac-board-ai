import { areSuggestionsSupported } from "@features/board";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
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
import type SvgIcon from "@mui/material/SvgIcon";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { locales } from "@paraglide/runtime";
import { useTranslate } from "@shared/language/use-translate";
import { AppIcon } from "./app-icon";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Highlight {
  id: string;
  Icon: typeof SvgIcon;
  title: string;
  description: string;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const t = useTranslate();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const isShortLandscape = useMediaQuery(shortLandscape);

  const suggestionsOrLanguageHighlight: Highlight = areSuggestionsSupported()
    ? {
        id: "suggestions",
        Icon: AutoAwesomeOutlinedIcon,
        title: t(m.onboardingSuggestionsTitle),
        description: t(m.onboardingSuggestionsDescription),
      }
    : {
        id: "language",
        Icon: TranslateOutlinedIcon,
        title: t(m.onboardingLanguageTitle),
        description: t(m.onboardingLanguageDescription, {
          count: locales.length,
        }),
      };

  const highlights: Highlight[] = [
    {
      id: "tap-to-speak",
      Icon: RecordVoiceOverOutlinedIcon,
      title: t(m.onboardingTapToSpeakTitle),
      description: t(m.onboardingTapToSpeakDescription),
    },
    suggestionsOrLanguageHighlight,
    {
      id: "free-private",
      Icon: LockOutlinedIcon,
      title: t(m.onboardingFreePrivateTitle),
      description: t(m.onboardingFreePrivateDescription),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isSmallScreen || isShortLandscape}
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
            {highlights.map(({ id, Icon, title, description }) => (
              <HighlightItem
                key={id}
                Icon={Icon}
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

// A width breakpoint cannot see a screen that is wide but short, such as a
// phone on its side. The `sm` value keeps the threshold on the theme's scale.
// Portrait screens are excluded so a small upright phone keeps its own layout.
function shortLandscape(theme: Theme): string {
  const maxHeight = theme.breakpoints.values.sm - 0.05;

  return `@media (orientation: landscape) and (max-height:${maxHeight}px)`;
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

function HighlightItem({ Icon, title, description }: HighlightItemProps) {
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
        <Icon color="primary" fontSize="inherit" />
      </ListItemIcon>

      <ListItemText
        primary={title}
        secondary={description}
        sx={{ my: 0 }}
        slotProps={{
          primary: { sx: { fontWeight: "fontWeightBold" } },
          secondary: { variant: "body1", sx: { textWrap: "balance" } },
        }}
      />
    </ListItem>
  );
}
