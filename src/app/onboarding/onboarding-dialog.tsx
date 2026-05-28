import { APP_NAME } from "@app/app-info";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
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

  const highlights: { icon: ReactNode; primary: string; secondary: string }[] =
    [
      {
        icon: <AutoAwesomeOutlinedIcon color="primary" fontSize="large" />,
        primary: m.onboardingSmartRewritingTitle(),
        secondary: m.onboardingSmartRewritingDescription(),
      },
      {
        icon: <TranslateOutlinedIcon color="primary" fontSize="large" />,
        primary: m.onboardingTranslationTitle(),
        secondary: m.onboardingTranslationDescription(),
      },
      {
        icon: <LockOutlinedIcon color="primary" fontSize="large" />,
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
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullScreen ? 0 : 6,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle
        id="welcome-dialog-title"
        variant="h4"
        sx={{
          textAlign: "center",
          mt: 3,
          mb: 1,
          p: 0,
        }}
      >
        {APP_NAME}
      </DialogTitle>

      <DialogContent sx={{ pt: 0, pb: 4 }}>
        <DialogContentText
          id="welcome-dialog-description"
          variant="body1"
          sx={{ textAlign: "center", mb: 3, px: 2 }}
        >
          {m.onboardingTagline()}
        </DialogContentText>

        <List sx={{ py: 0 }}>
          {highlights.map((highlight) => (
            <ListItem
              key={highlight.primary}
              disableGutters
              sx={{ alignItems: "flex-start" }}
            >
              <ListItemIcon sx={{ minWidth: 44, mt: 1.5 }}>
                {highlight.icon}
              </ListItemIcon>
              <ListItemText
                primary={highlight.primary}
                secondary={highlight.secondary}
                slotProps={{
                  primary: {
                    variant: "subtitle1",
                    sx: { fontWeight: "bold", mb: 0 },
                  },
                  secondary: {
                    variant: "body2",
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{ borderRadius: 6 }}
        >
          {m.onboardingContinue()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
