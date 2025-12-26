import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WelcomeDialog({ open, onClose }: WelcomeDialogProps) {
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
      <DialogTitle id="welcome-dialog-title" sx={{ pt: 4, pb: 0 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            textAlign: "center",
            mb: 1,
            letterSpacing: "-0.02em",
          }}
        >
          Your Voice, Enhanced
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography
          id="welcome-dialog-description"
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", mb: 4, px: 2, lineHeight: 1.5 }}
        >
          AAC Board AI helps you communicate naturally and privately using
          on-device intelligence.
        </Typography>

        <List sx={{ pt: 0 }}>
          <ListItem disableGutters sx={{ alignItems: "flex-start", mb: 3 }}>
            <ListItemIcon sx={{ minWidth: 48, mt: 0.5 }}>
              <AutoAwesomeOutlinedIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary="Smart Rewriting"
              secondary="Turn short phrases into natural sentences and adjust your tone instantly."
              slotProps={{
                primary: {
                  fontWeight: 700,
                  variant: "h6",
                  sx: { mb: 0.5 },
                },
              }}
            />
          </ListItem>

          <ListItem disableGutters sx={{ alignItems: "flex-start", mb: 3 }}>
            <ListItemIcon sx={{ minWidth: 48, mt: 0.5 }}>
              <TranslateIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary="Real-time Translation"
              secondary="Translate and speak your messages in multiple languages, fully offline."
              slotProps={{
                primary: {
                  fontWeight: 700,
                  variant: "h6",
                  sx: { mb: 0.5 },
                },
              }}
            />
          </ListItem>

          <ListItem disableGutters sx={{ alignItems: "flex-start" }}>
            <ListItemIcon sx={{ minWidth: 48, mt: 0.5 }}>
              <LockOutlinedIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary="Private by Design"
              secondary="No servers. No cloud. All AI processing stays safely on your device."
              slotProps={{
                primary: {
                  fontWeight: 700,
                  variant: "h6",
                  sx: { mb: 0.5 },
                },
              }}
            />
          </ListItem>
        </List>

        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ mt: 4, display: "block", textAlign: "center", fontWeight: 500 }}
        >
          Winner of the Google Chrome Built-in AI Challenge 2025
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth
          size="large"
          sx={{
            borderRadius: 4,
            py: 2,
            textTransform: "none",
            fontWeight: 800,
            fontSize: "1.1rem",
            boxShadow: "0 4px 14px 0 rgba(0,118,255,0.39)",
          }}
        >
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
}
