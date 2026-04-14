import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AICapabilitiesList } from "@shared/ai/AICapabilitiesList";
import { isRewriterSupported } from "@shared/ai/capabilities";
import { useAI } from "@shared/ai/useAI";

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
        <AICapabilitiesList />
      </Stack>
    </Stack>
  );
}
