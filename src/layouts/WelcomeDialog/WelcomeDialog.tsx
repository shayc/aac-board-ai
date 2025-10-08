import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
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
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
    >
      <DialogTitle id="welcome-dialog-title">
        Welcome to AAC Board AI
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="welcome-dialog-description">
          Turn symbols into speech, naturally with built-in AI.
        </DialogContentText>

        <ul>
          <li>Smart suggestions as you build messages</li>
          <li>Translate and speak instantly</li>
          <li>
            Works offline, private by design<sup>1</sup>
          </li>
        </ul>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          gutterBottom
        >
          <sup>1</sup> Supports Open Board Format
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Get Started
        </Button>
      </DialogActions>
    </Dialog>
  );
}
