import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  type BuiltInAIName,
  isSupported,
} from "@shared/ai/built-in-ai/namespaces";
import { useSharedContext } from "@shared/ai/sharedContext";

const AI_FEATURES = [
  "Proofreader",
  "Rewriter",
  "Translator",
] as const satisfies readonly BuiltInAIName[];

export function AISettings() {
  const [sharedContext, setSharedContext] = useSharedContext();

  return (
    <Stack spacing={3}>
      {isSupported("Rewriter") && (
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
          {AI_FEATURES.map((name) => (
            <ListItem key={name}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isSupported(name) ? (
                  <CheckCircleIcon color="success" fontSize="small" />
                ) : (
                  <CancelIcon color="error" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={name} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
