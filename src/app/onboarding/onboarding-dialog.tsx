import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { locales } from "@paraglide/runtime";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaInset } from "@shared/theme/safe-area";
import { isSupported } from "@shayc/react-built-in-ai";
import type { ReactNode } from "react";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

const fullScreenSafeArea = {
  pt: safeAreaInset("top"),
  pr: safeAreaInset("right"),
  pb: safeAreaInset("bottom"),
  pl: safeAreaInset("left"),
};

interface Highlight {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const t = useTranslate();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const suggestionsOrLanguageHighlight: Highlight = isSupported("Rewriter")
    ? {
        id: "suggestions",
        icon: <AutoAwesomeOutlinedIcon color="primary" fontSize="inherit" />,
        title: t(m.onboardingSuggestionsTitle),
        description: t(m.onboardingSuggestionsDescription),
      }
    : {
        id: "language",
        icon: <TranslateOutlinedIcon color="primary" fontSize="inherit" />,
        title: t(m.onboardingLanguageTitle),
        description: t(m.onboardingLanguageDescription, {
          count: locales.length,
        }),
      };

  const highlights: Highlight[] = [
    {
      id: "tap-to-speak",
      icon: <RecordVoiceOverOutlinedIcon color="primary" fontSize="inherit" />,
      title: t(m.onboardingTapToSpeakTitle),
      description: t(m.onboardingTapToSpeakDescription),
    },
    suggestionsOrLanguageHighlight,
    {
      id: "free-private",
      icon: <LockOutlinedIcon color="primary" fontSize="inherit" />,
      title: t(m.onboardingFreePrivateTitle),
      description: t(m.onboardingFreePrivateDescription),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isSmallScreen}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: isSmallScreen ? fullScreenSafeArea : undefined,
        },
      }}
    >
      <Box sx={{ my: "auto", pt: 6 }}>
        <Box
          component="img"
          alt=""
          src={`${import.meta.env.BASE_URL}board.svg`}
          sx={{
            display: "block",
            width: 96,
            height: 96,
            mx: "auto",
            mb: 2,
            borderRadius: "22%",
            boxShadow: (theme) =>
              `0 0 0 1px ${(theme.vars ?? theme).palette.divider}`,
          }}
        />

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
            {highlights.map((highlight) => (
              <ListItem
                key={highlight.id}
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
                  {highlight.icon}
                </ListItemIcon>
                <ListItemText
                  primary={highlight.title}
                  secondary={highlight.description}
                  sx={{ my: 0 }}
                  slotProps={{
                    primary: { sx: { fontWeight: "fontWeightBold" } },
                    secondary: {
                      variant: "body1",
                      sx: { textWrap: "balance" },
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Box>

      <DialogActions sx={{ px: 3, pt: 5, pb: 4 }}>
        <Button fullWidth variant="contained" size="large" onClick={onClose}>
          {t(m.onboardingContinue)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
