import Cancel from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  isProofreaderSupported,
  isRewriterSupported,
  isTranslatorSupported,
} from "@shared/ai/capabilities";
import { useAI } from "@shared/ai/useAI";

const AI_FEATURES = [
  { isSupported: isProofreaderSupported, label: "Proofreader" },
  { isSupported: isRewriterSupported, label: "Rewriter" },
  { isSupported: isTranslatorSupported, label: "Translator" },
];

export function AISettings() {
  const { sharedContext, setSharedContext } = useAI();

  return (
    <Stack spacing={3}>
      {isRewriterSupported && (
        <TextField
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          label="Custom Instructions"
          slotProps={{ inputLabel: { shrink: true } }}
          placeholder="e.g., Sarcastic, Polite."
          helperText="Personalize AI suggestions"
          value={sharedContext}
          onChange={(e) => setSharedContext(e.target.value)}
        />
      )}

      <Stack spacing={1}>
        <Typography variant="body2" color="text.secondary">
          Built-in AI Support
        </Typography>
        <List dense>
          {AI_FEATURES.map(({ isSupported, label }) => (
            <ListItem key={label}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isSupported ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <Cancel color="error" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
