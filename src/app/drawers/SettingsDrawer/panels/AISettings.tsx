import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AICapabilitiesList } from "@shared/components/AICapabilitiesList";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { isRewriterSupported } from "@shared/hooks/ai/ai-capabilities";

export function AISettings() {
  const { sharedContext, setSharedContext } = useAI();

  return (
    <Box sx={{ mb: 4 }}>
      {isRewriterSupported && (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Custom Instructions
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., Sarcastic, Polite."
            helperText="Personalize AI suggestions"
            value={sharedContext}
            onChange={(e) => setSharedContext(e.target.value)}
            sx={{ mb: 2 }}
          />
        </>
      )}

      <Typography variant="subtitle1" gutterBottom>
        Built-in AI Support
      </Typography>
      <AICapabilitiesList />
    </Box>
  );
}
