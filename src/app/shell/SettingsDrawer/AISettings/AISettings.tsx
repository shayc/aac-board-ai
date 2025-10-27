import Box from "@mui/material/Box";
import Input from "@mui/material/Input";
import Typography from "@mui/material/Typography";

export function AISettings() {
  return (
    <Box>
      <Typography gutterBottom>Custom instructions</Typography>
      <Input placeholder="Describe traits" fullWidth />
    </Box>
  );
}
