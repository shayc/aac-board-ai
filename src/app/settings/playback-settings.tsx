import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { m } from "@paraglide/messages.js";
import {
  setHighlightActivePart,
  usePlaybackConfig,
} from "@shared/playback/playback-store";

export function PlaybackSettings() {
  const { highlightActivePart } = usePlaybackConfig();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={highlightActivePart}
          onChange={(event) => setHighlightActivePart(event.target.checked)}
        />
      }
      label={m.playbackHighlight()}
      labelPlacement="start"
      sx={{ justifyContent: "space-between" }}
    />
  );
}
