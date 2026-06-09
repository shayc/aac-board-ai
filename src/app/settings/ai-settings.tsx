import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/hooks/use-ai-shared-context";
import { type BuiltInAIName, isSupported } from "@shayc/react-built-in-ai";

export function AISettings() {
  const sharedContext = useAISharedContext();

  const capabilities: {
    apiName: BuiltInAIName;
    title: string;
  }[] = [
    {
      apiName: "Proofreader",
      title: m.aiFeatureProofreading(),
    },
    {
      apiName: "Rewriter",
      title: m.aiFeatureRewriting(),
    },
    {
      apiName: "Translator",
      title: m.aiFeatureTranslation(),
    },
  ];

  return (
    <Stack spacing={3}>
      {isSupported("Rewriter") && (
        <TextField
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          label={m.aiCustomInstructions()}
          slotProps={{ inputLabel: { shrink: true } }}
          placeholder={m.aiCustomInstructionsPlaceholder()}
          helperText={m.aiCustomInstructionsHelper()}
          value={sharedContext}
          onChange={(event) => setAISharedContext(event.target.value)}
        />
      )}

      <Stack spacing={1}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {m.aiBuiltInSupport()}
        </Typography>

        <List dense>
          {capabilities.map(({ apiName, title }) => (
            <ListItem key={apiName} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isSupported(apiName) ? (
                  <CheckCircleIcon
                    color="success"
                    fontSize="small"
                    titleAccess={m.aiStatusAvailable()}
                  />
                ) : (
                  <CancelIcon
                    color="error"
                    fontSize="small"
                    titleAccess={m.aiStatusUnavailable()}
                  />
                )}
              </ListItemIcon>
              <ListItemText primary={title} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
