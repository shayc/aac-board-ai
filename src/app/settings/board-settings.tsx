import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { m } from "@paraglide/messages.js";
import {
  setHighlightActivePart,
  useHighlightConfig,
} from "@shared/highlight/highlight-store";

export function BoardSettings() {
  const { highlightActivePart } = useHighlightConfig();

  return (
    <FormControlLabel
      label={m.playbackHighlight()}
      control={
        <Switch
          checked={highlightActivePart}
          onChange={(event) => setHighlightActivePart(event.target.checked)}
        />
      }
    />
  );
}
