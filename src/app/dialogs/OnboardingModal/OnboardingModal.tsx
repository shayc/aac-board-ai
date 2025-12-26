import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
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

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
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
      <DialogContent sx={{ pt: 4, pb: 0 }}>
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
          Your Voice, Enhanced
        </DialogTitle>

        <DialogContentText
          id="welcome-dialog-description"
          variant="body1"
          sx={{ textAlign: "center", mb: 3, px: 2, lineHeight: 1.4 }}
        >
          AAC Board AI helps you communicate naturally and privately using
          on-device intelligence.
        </DialogContentText>

        <List sx={{ pt: 0, pb: 0 }}>
          <ListItem disableGutters sx={{ alignItems: "flex-start", mb: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 44, mt: 0.75 }}>
              <AutoAwesomeOutlinedIcon color="primary" fontSize="medium" />
            </ListItemIcon>
            <ListItemText
              primary="Smart Rewriting"
              secondary="Turn short phrases into natural sentences and adjust your tone instantly."
              slotProps={{
                primary: {
                  fontWeight: 700,
                  variant: "subtitle1",
                  sx: { mb: 0 },
                },
                secondary: {
                  variant: "body2",
                  sx: { lineHeight: 1.3 },
                },
              }}
            />
          </ListItem>

          <ListItem disableGutters sx={{ alignItems: "flex-start", mb: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 44, mt: 0.75 }}>
              <TranslateIcon color="primary" fontSize="medium" />
            </ListItemIcon>
            <ListItemText
              primary="Real-time Translation"
              secondary="Translate and speak your messages in multiple languages, fully offline."
              slotProps={{
                primary: {
                  fontWeight: 700,
                  variant: "subtitle1",
                  sx: { mb: 0 },
                },
                secondary: {
                  variant: "body2",
                  sx: { lineHeight: 1.3 },
                },
              }}
            />
          </ListItem>

          <ListItem disableGutters sx={{ alignItems: "flex-start", mb: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 44, mt: 0.75 }}>
              <LockOutlinedIcon color="primary" fontSize="medium" />
            </ListItemIcon>
            <ListItemText
              primary="Private by Design"
              secondary="No servers. No cloud. All AI processing stays safely on your device."
              slotProps={{
                primary: {
                  fontWeight: 700,
                  variant: "subtitle1",
                  sx: { mb: 0 },
                },
                secondary: {
                  variant: "body2",
                  sx: { lineHeight: 1.3 },
                },
              }}
            />
          </ListItem>
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, pb: 4 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            borderRadius: 4,
            py: 1.5,
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.1rem",
          }}
        >
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
}
