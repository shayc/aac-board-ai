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
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
  useEngineAvailability,
} from "@features/board";
import { m } from "@paraglide/messages.js";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/hooks/use-ai-shared-context";
import { useLanguage } from "@shared/language/use-language";
import {
  isSupported,
  MissingUserActivationError,
  useProofreader,
  useRewriter,
  type BaseHookReturn,
} from "@shayc/react-built-in-ai";

type CapabilityView =
  | { kind: "available" }
  | { kind: "downloading"; progress: number }
  | { kind: "needs-download"; onDownload: () => void }
  | { kind: "unavailable" };

function engineView(
  engine: BaseHookReturn,
  availability: Availability | undefined,
): CapabilityView {
  if (engine.status === "ready") {
    return { kind: "available" };
  }

  if (engine.status === "downloading") {
    return { kind: "downloading", progress: engine.progress };
  }

  // Idle + downloadable means the lifecycle is parked awaiting the user
  // gesture Chrome requires before a model download.
  const awaitsGesture =
    (engine.status === "idle" && availability === "downloadable") ||
    engine.error instanceof MissingUserActivationError;

  if (awaitsGesture) {
    return {
      kind: "needs-download",
      onDownload: () => void engine.prepare().catch(() => undefined),
    };
  }

  return { kind: "unavailable" };
}

function statusIcon(view: CapabilityView) {
  const newLocal = "unavailable";
  switch (view.kind) {
    case "available":
      return (
        <CheckCircleIcon
          color="success"
          fontSize="small"
          titleAccess={m.aiStatusAvailable()}
        />
      );
    case "downloading":
    case "needs-download":
      return <DownloadingIcon color="action" fontSize="small" />;
    case newLocal:
      return (
        <CancelIcon
          color="error"
          fontSize="small"
          titleAccess={m.aiStatusUnavailable()}
        />
      );
  }
}

function statusLabel(view: CapabilityView): string | null {
  switch (view.kind) {
    case "available":
      return m.aiStatusAvailable();
    case "downloading":
      return m.aiStatusDownloading({
        progress: Math.round(view.progress * 100),
      });
    case "needs-download":
      return null;
    case "unavailable":
      return m.aiStatusUnavailable();
  }
}

export function AISettings() {
  const sharedContext = useAISharedContext();
  const { language } = useLanguage();
  const proofreader = useProofreader(proofreaderLanguageOptions(language));
  const rewriter = useRewriter(rewriterLanguageOptions(language));
  const proofreaderAvailability = useEngineAvailability(
    "Proofreader",
    language,
  );
  const rewriterAvailability = useEngineAvailability("Rewriter", language);

  const capabilities: { title: string; view: CapabilityView }[] = [
    {
      title: m.aiFeatureProofreading(),
      view: engineView(proofreader, proofreaderAvailability),
    },
    {
      title: m.aiFeatureRewriting(),
      view: engineView(rewriter, rewriterAvailability),
    },
    {
      title: m.aiFeatureTranslation(),
      view: isSupported("Translator")
        ? { kind: "available" }
        : { kind: "unavailable" },
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
          {capabilities.map(({ title, view }) => (
            <ListItem
              key={title}
              sx={{ px: 0 }}
              secondaryAction={
                view.kind === "needs-download" && (
                  <Button size="small" onClick={view.onDownload}>
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
