import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useState } from "react";

export function ToneSelect() {
  const [tone, setTone] = useState("neutral");

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="tone-select-label">Tone</InputLabel>
      <Select
        labelId="tone-select-label"
        id="tone-select"
        value={tone}
        label="Tone"
        onChange={(event) => setTone(event.target.value)}
      >
        <MenuItem value="neutral">🙂 Neutral</MenuItem>
        <MenuItem value="formal">🎩 Formal</MenuItem>
        <MenuItem value="casual">😎 Casual</MenuItem>
      </Select>
    </FormControl>
  );
}
