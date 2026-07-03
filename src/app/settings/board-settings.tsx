import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { m } from "@paraglide/messages.js";
import {
  setHighlightActivePart,
  usePlaybackConfig,
} from "@shared/playback/playback-store";

export function BoardSettings() {
  const { highlightActivePart } = usePlaybackConfig();

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
