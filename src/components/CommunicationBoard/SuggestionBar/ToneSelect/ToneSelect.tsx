import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useState } from "react";

interface ToneSelectProps {
  onChange?: (tone: string) => void;
}

export function ToneSelect({ onChange }: ToneSelectProps) {
  const [tone, setTone] = useState("neutral");

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newTone = event.target.value as string;
    setTone(newTone);
    onChange?.(newTone);
  };

  return (
    <FormControl sx={{ minWidth: 120 }} size="small">
      <InputLabel id="tone-select-label">Tone</InputLabel>
      <Select
        labelId="tone-select-label"
        id="tone-select"
        value={tone}
        label="Tone"
        onChange={handleChange}
      >
        <MenuItem value="neutral">🙂 Neutral</MenuItem>
        <MenuItem value="formal">🎩 Formal</MenuItem>
        <MenuItem value="casual">😎 Casual</MenuItem>
      </Select>
    </FormControl>
  );
}
