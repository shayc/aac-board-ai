import Cancel from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import {
  isProofreaderSupported,
  isRewriterSupported,
  isTranslatorSupported,
} from "@shared/hooks/ai/ai-capabilities";

const AI_FEATURES = [
  { isSupported: isProofreaderSupported, label: "Proofreader" },
  { isSupported: isRewriterSupported, label: "Rewriter" },
  { isSupported: isTranslatorSupported, label: "Translator" },
];

export function AICapabilitiesList() {
  return (
    <List dense>
      {AI_FEATURES.map(({ isSupported, label }) => {
        return (
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
        );
      })}
    </List>
  );
}
