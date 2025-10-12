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
      keepMounted
      fullWidth
      maxWidth="sm"
      scroll="paper"
      aria-labelledby="welcome-dialog-title"
      aria-describedby="welcome-dialog-description"
    >
      <DialogTitle id="welcome-dialog-title" sx={{ fontWeight: 600 }}>
        Welcome to AAC Board AI
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          id="welcome-dialog-description"
          sx={{ mb: 1.5, fontSize: "1.05rem" }}
        >
          Turn symbols into speech naturally using Chrome's built-in AI.
        </DialogContentText>

        <List dense sx={{ pt: 0.5 }}>
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <AutoAwesomeOutlinedIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Smart suggestions as you build messages" />
          </ListItem>

          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TranslateIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Translate and speak instantly" />
          </ListItem>

          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LockOutlinedIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Works offline — private by design" />
          </ListItem>
        </List>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Supports Open Board Format (.obf, .obz) files.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus variant="contained" size="large">
          Get started
        </Button>
      </DialogActions>
    </Dialog>
  );
}
