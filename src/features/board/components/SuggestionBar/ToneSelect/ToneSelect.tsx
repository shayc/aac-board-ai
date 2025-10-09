import type { ToneOption } from "@/features/board/hooks/useSuggestions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useState } from "react";

interface ToneSelectProps {
  onChange?: (tone: ToneOption) => void;
}

export function ToneSelect({ onChange }: ToneSelectProps) {
  const [tone, setTone] = useState<ToneOption>("neutral");

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="tone-select-label">Tone</InputLabel>
      <Select
        labelId="tone-select-label"
        id="tone-select"
        value={tone}
        label="Tone"
        onChange={(event) => {
          const newTone = event.target.value;
          setTone(newTone);
          onChange?.(newTone);
        }}
      >
        <MenuItem value="neutral">🙂 Neutral</MenuItem>
        <MenuItem value="formal">🎩 Formal</MenuItem>
        <MenuItem value="casual">😎 Casual</MenuItem>
      </Select>
    </FormControl>
  );
}
