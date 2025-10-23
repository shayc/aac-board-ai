import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Input from "@mui/material/Input";
import Typography from "@mui/material/Typography";

export function AISettings() {
  return (
    <Box>
      <Typography gutterBottom>Custom instructions</Typography>
      <Input placeholder="Describe or select traits" />
      <Chip label="Sarcastic" sx={{ mt: 1 }} />
      <Chip label="Professional" sx={{ mt: 1, ml: 1 }} />
      <Chip label="Friendly" sx={{ mt: 1, ml: 1 }} />
      <Chip label="Concise" sx={{ mt: 1, ml: 1 }} />
      <Chip label="Detailed" sx={{ mt: 1, ml: 1 }} />
    </Box>
  );
}
