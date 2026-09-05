import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
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
import { useTranslate } from "@shared/language/use-translate";
import type { ReactNode } from "react";

interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const t = useTranslate();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const highlights: {
    id: string;
    icon: ReactNode;
    text: string;
  }[] = [
    {
      id: "rewriting",
      icon: <AutoAwesomeOutlinedIcon color="primary" fontSize="inherit" />,
      text: t(m.onboardingSmartRewritingDescription),
    },
    {
      id: "translation",
      icon: <TranslateOutlinedIcon color="primary" fontSize="inherit" />,
      text: t(m.onboardingTranslationDescription),
    },
    {
      id: "privacy",
      icon: <LockOutlinedIcon color="primary" fontSize="inherit" />,
      text: t(m.onboardingPrivacyDescription),
    },
  ];

  return (
    <Dialog
      aria-labelledby="onboarding-dialog-title"
      open={open}
      onClose={onClose}
      fullScreen={isSmallScreen}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            p: 1,
          },
        },
      }}
    >
      <Box
        component="img"
        alt=""
        src={`${import.meta.env.BASE_URL}board.svg`}
        sx={{
          display: "block",
          width: 96,
          height: 96,
          mx: "auto",
          mt: 4,
          mb: 2,
          borderRadius: "22%",
        }}
      />

      <DialogTitle
        id="onboarding-dialog-title"
        variant="h4"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {t(m.appName)}
      </DialogTitle>

      <DialogContent>
        <List>
          {highlights.map((highlight) => (
            <ListItem key={highlight.id} sx={{ alignItems: "center", py: 1.5 }}>
              <ListItemIcon sx={{ mr: 2, fontSize: "40px" }}>
                {highlight.icon}
              </ListItemIcon>
              <ListItemText
                secondary={highlight.text}
                slotProps={{
                  secondary: {
                    variant: "body1",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button fullWidth variant="contained" size="large" onClick={onClose}>
          {t(m.onboardingContinue)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
