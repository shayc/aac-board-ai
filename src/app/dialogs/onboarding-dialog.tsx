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
import type { ReactNode } from "react";

const highlights: { icon: ReactNode; primary: string; secondary: string }[] = [
  {
    icon: <AutoAwesomeOutlinedIcon color="primary" fontSize="large" />,
    primary: "Smart Rewriting",
    secondary: "Turn short phrases into clear sentences.",
  },
  {
    icon: <TranslateOutlinedIcon color="primary" fontSize="large" />,
    primary: "Real-time Translation",
    secondary: "Translate messages instantly.",
  },
  {
    icon: <LockOutlinedIcon color="primary" fontSize="large" />,
    primary: "Private by Design",
    secondary: "Works offline, on your device. No cloud.",
  },
];

export interface OnboardingDialogProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingDialog({ open, onClose }: OnboardingDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 6,
            p: 1,
          },
        },
      }}
    >
      <DialogContent sx={{ pt: 4, pb: 4 }}>
        <DialogTitle
          id="welcome-dialog-title"
          variant="h4"
          sx={{
            fontWeight: 800,
            textAlign: "center",
            mb: 1,
            letterSpacing: "-0.02em",
            p: 0,
          }}
        >
          {APP_NAME}
        </DialogTitle>

        <DialogContentText
          id="welcome-dialog-description"
          variant="body1"
          sx={{ textAlign: "center", mb: 3, px: 2, lineHeight: 1.4 }}
        >
          Communicate more easily and naturally.
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
                    sx: { fontWeight: 700, mb: 0 },
                  },
                  secondary: {
                    variant: "body2",
                    sx: { lineHeight: 1.3 },
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 4 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            borderRadius: 4,
            py: 1.5,
            fontWeight: 800,
            fontSize: "1.1rem",
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
