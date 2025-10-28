import Cancel from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useAICapabilities } from "@/shared/hooks/ai";

const AI_FEATURES = [
  { key: "languageModel" as const, label: "Language Model" },
  { key: "translator" as const, label: "Translator" },
  { key: "writer" as const, label: "Writer" },
  { key: "rewriter" as const, label: "Rewriter" },
  { key: "languageDetector" as const, label: "Language Detector" },
  { key: "proofreader" as const, label: "Proofreader" },
];

export function AICapabilitiesList() {
  const capabilities = useAICapabilities();

  return (
    <List dense>
      {AI_FEATURES.map(({ key, label }) => {
        const isSupported = capabilities[key];
        return (
          <ListItem key={key}>
            <ListItemIcon sx={{ minWidth: 36 }}>
              {isSupported ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <Cancel color="error" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItem>
        );
      })}
    </List>
  );
}
