import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadingIcon from "@mui/icons-material/Downloading";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "@shared/built-in-ai/engine-language-options";
import {
  deriveEngineView,
  type EngineView,
} from "@shared/built-in-ai/engine-view";
import { prepareQuietly } from "@shared/built-in-ai/prepare-quietly";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/built-in-ai/shared-context-store";
import { useLanguage } from "@shared/language/use-language";
import {
  isSupported,
  useProofreader,
  useRewriter,
} from "@shayc/react-built-in-ai";

function statusLabel(view: EngineView): string {
  switch (view.kind) {
    case "ready":
      return m.aiStatusAvailable();
    case "downloading":
      return m.aiStatusDownloading({
        progress: Math.round(view.progress * 100),
      });
    case "awaits-gesture":
      return m.aiStatusDownloadRequired();
    case "initializing":
    case "unavailable":
    case "unsupported":
      return m.aiStatusUnavailable();
  }
}

function statusIcon(view: EngineView) {
  const title = statusLabel(view);
  switch (view.kind) {
    case "ready":
      return (
        <CheckCircleIcon color="success" fontSize="small" titleAccess={title} />
      );
    case "downloading":
    case "awaits-gesture":
      return (
        <DownloadingIcon color="action" fontSize="small" titleAccess={title} />
      );
    case "initializing":
    case "unavailable":
    case "unsupported":
      return <CancelIcon color="error" fontSize="small" titleAccess={title} />;
  }
}

export function AISettings() {
  const sharedContext = useAISharedContext();
  const { language } = useLanguage();
  const proofreader = useProofreader(proofreaderLanguageOptions(language));
  const rewriter = useRewriter(rewriterLanguageOptions(language));
  const proofreaderView = deriveEngineView(proofreader);
  const rewriterView = deriveEngineView(rewriter);

  const capabilities: {
    title: string;
    view: EngineView;
    onDownload?: () => void;
  }[] = [
    {
      title: m.aiFeatureProofreading(),
      view: proofreaderView,
      onDownload: () => prepareQuietly(proofreader),
    },
    {
      title: m.aiFeatureRewriting(),
      view: rewriterView,
      onDownload: () => prepareQuietly(rewriter),
    },
    {
      title: m.aiFeatureTranslation(),
      view: isSupported("Translator")
        ? { kind: "ready" }
        : { kind: "unsupported" },
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
          {capabilities.map(({ title, view, onDownload }) => (
            <ListItem
              key={title}
              sx={{ px: 0 }}
              secondaryAction={
                view.kind === "awaits-gesture" &&
                onDownload && (
                  <Button size="small" onClick={onDownload}>
                    {m.aiDownloadAction()}
                  </Button>
                )
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {statusIcon(view)}
              </ListItemIcon>
              <ListItemText primary={title} secondary={statusLabel(view)} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}
