import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadingIcon from "@mui/icons-material/Downloading";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "@shared/built-in-ai/engine-language-options";
import {
  setAISharedContext,
  useAISharedContext,
} from "@shared/built-in-ai/shared-context-store";
import { useLanguage } from "@shared/language/use-language";
import {
  isSupported,
  useProofreader,
  useRewriter,
  type Status,
} from "@shayc/react-built-in-ai";
import { useState } from "react";

export function AISettings() {
  const [helpOpen, setHelpOpen] = useState(false);
  const sharedContext = useAISharedContext();
  const { language } = useLanguage();
  const proofreader = useProofreader(proofreaderLanguageOptions(language));
  const rewriter = useRewriter(rewriterLanguageOptions(language));

  const capabilities: {
    title: string;
    status: Status;
  }[] = [
    {
      title: m.aiFeatureProofreading(),
      status: proofreader.status,
    },
    {
      title: m.aiFeatureRewriting(),
      status: rewriter.status,
    },
    {
      title: m.aiFeatureTranslation(),
      status: isSupported("Translator") ? "ready" : "unsupported",
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
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {m.aiBuiltInSupport()}
          </Typography>

          <Tooltip
            title={m.aiBuiltInSupportHelp()}
            open={helpOpen}
            onOpen={() => setHelpOpen(true)}
            onClose={() => setHelpOpen(false)}
          >
            <IconButton
              aria-label={m.aiBuiltInSupportHelp()}
              size="small"
              onClick={() => setHelpOpen(true)}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <List dense>
          {capabilities.map(({ title, status }) => (
            <ListItem key={title} sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {statusIcon(status)}
              </ListItemIcon>
              <ListItemText primary={title} secondary={statusLabel(status)} />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Stack>
  );
}

function statusLabel(status: Status) {
  switch (status) {
    case "ready":
      return m.aiStatusAvailable();
    case "downloading":
      return m.aiStatusDownloading();
    case "downloadable":
      return m.aiStatusDownloadRequired();
    case "checking":
    case "unavailable":
    case "error":
    case "unsupported":
      return m.aiStatusUnavailable();
    default:
      return status satisfies never;
  }
}

function statusIcon(status: Status) {
  const title = statusLabel(status);
  switch (status) {
    case "ready":
      return (
        <CheckCircleIcon color="success" fontSize="small" titleAccess={title} />
      );
    case "downloading":
    case "downloadable":
      return (
        <DownloadingIcon color="action" fontSize="small" titleAccess={title} />
      );
    case "checking":
    case "unavailable":
    case "error":
    case "unsupported":
      return <CancelIcon color="error" fontSize="small" titleAccess={title} />;
    default:
      return status satisfies never;
  }
}
