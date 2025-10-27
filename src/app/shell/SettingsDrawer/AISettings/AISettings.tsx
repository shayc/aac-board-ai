import { useAI } from "@/shared/contexts/AIProvider/useAI";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export function AISettings() {
  const { sharedContext, setSharedContext } = useAI();

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Shared Context
      </Typography>
      <TextField
        multiline
        rows={3}
        placeholder="e.g., Sarcastic, Polite, Use simple words"
        helperText="Personalize AI suggestions"
        fullWidth
        value={sharedContext}
        onChange={(e) => setSharedContext(e.target.value)}
      />
    </Box>
  );
}
