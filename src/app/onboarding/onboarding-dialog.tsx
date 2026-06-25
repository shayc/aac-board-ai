import { APP_NAME } from "@app/app-info";
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
import type { ReactNode } from "react";

export interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const highlights: {
    id: string;
    icon: ReactNode;
    primary: string;
    secondary: string;
  }[] = [
    {
      id: "rewriting",
      icon: <AutoAwesomeOutlinedIcon color="primary" fontSize="inherit" />,
      primary: m.onboardingSmartRewritingTitle(),
      secondary: m.onboardingSmartRewritingDescription(),
    },
    {
      id: "translation",
      icon: <TranslateOutlinedIcon color="primary" fontSize="inherit" />,
      primary: m.onboardingTranslationTitle(),
      secondary: m.onboardingTranslationDescription(),
    },
    {
      id: "privacy",
      icon: <LockOutlinedIcon color="primary" fontSize="inherit" />,
      primary: m.onboardingPrivacyTitle(),
      secondary: m.onboardingPrivacyDescription(),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="xs"
      aria-labelledby="onboarding-dialog-title"
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
        src="/board.svg"
        alt=""
        sx={{
          width: 80,
          height: 80,
          mx: "auto",
          mt: 4,
          mb: 2,
          display: "block",
          borderRadius: "22%",
        }}
      />

      <DialogTitle
        id="onboarding-dialog-title"
        variant="h4"
        sx={{
          textAlign: "center",
        }}
      >
        {APP_NAME}
      </DialogTitle>

      <DialogContent>
        <List>
          {highlights.map((highlight) => (
            <ListItem key={highlight.id} sx={{ alignItems: "flex-start" }}>
              <ListItemIcon sx={{ fontSize: "40px", mr: 2, mt: 1.75 }}>
                {highlight.icon}
              </ListItemIcon>
              <ListItemText
                primary={highlight.primary}
                secondary={highlight.secondary}
                slotProps={{
                  primary: {
                    variant: "h6",
                    component: "span",
                  },
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
          {m.onboardingContinue()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
