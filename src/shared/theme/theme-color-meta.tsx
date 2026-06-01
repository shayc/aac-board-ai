import { useColorScheme } from "@mui/material/styles";
import { SHELL_DARK, SHELL_LIGHT } from "@shared/theme/theme-colors";

// Syncs the theme-color meta to the active scheme so Android chrome tracks the
// manual toggle (a static media-scoped tag would follow the OS instead). React 19
// hoists the <meta> to <head>; Safari ignores it and samples <body>.
export function ThemeColorMeta() {
  const { mode, systemMode } = useColorScheme();
  const resolved = mode === "system" ? systemMode : mode;

  return (
    <meta
      name="theme-color"
      content={resolved === "dark" ? SHELL_DARK : SHELL_LIGHT}
    />
  );
}
