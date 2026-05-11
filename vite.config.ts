/// <reference types="vitest/config" />
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const MUI_DEPS = [
  // Core
  "react-dom/client",
  "react-error-boundary",

  // Icons
  "@mui/icons-material/AutoAwesomeOutlined",
  "@mui/icons-material/Cancel",
  "@mui/icons-material/CheckCircle",
  "@mui/icons-material/Close",
  "@mui/icons-material/CollectionsBookmarkOutlined",
  "@mui/icons-material/Downloading",
  "@mui/icons-material/InfoOutlined",
  "@mui/icons-material/LockOutlined",
  "@mui/icons-material/Menu",
  "@mui/icons-material/SettingsOutlined",
  "@mui/icons-material/Translate",

  // Components
  "@mui/material/Alert",
  "@mui/material/AlertTitle",
  "@mui/material/AppBar",
  "@mui/material/CssBaseline",
  "@mui/material/Dialog",
  "@mui/material/DialogActions",
  "@mui/material/DialogContent",
  "@mui/material/DialogContentText",
  "@mui/material/DialogTitle",
  "@mui/material/Divider",
  "@mui/material/Drawer",
  "@mui/material/Fade",
  "@mui/material/FormControl",
  "@mui/material/FormControlLabel",
  "@mui/material/FormLabel",
  "@mui/material/InputLabel",
  "@mui/material/List",
  "@mui/material/ListItem",
  "@mui/material/ListItemButton",
  "@mui/material/ListItemIcon",
  "@mui/material/ListItemText",
  "@mui/material/ListSubheader",
  "@mui/material/MenuItem",
  "@mui/material/Radio",
  "@mui/material/RadioGroup",
  "@mui/material/Select",
  "@mui/material/Slider",
  "@mui/material/Snackbar",
  "@mui/material/TextField",
  "@mui/material/Toolbar",
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["board.svg"],
      manifest: {
        name: "AAC Board AI",
        short_name: "AAC Board",
        description:
          "AAC Board AI helps people who can't speak communicate naturally with Built-in AI — proofreading, rephrasing, and translating safely on their device.",
      },
    }),
  ],
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@pages": path.resolve(__dirname, "./src/pages"),
    },
  },
  optimizeDeps: {
    include: MUI_DEPS,
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      // https://vitest.dev/guide/browser/playwright
      instances: [{ browser: "chromium" }],
    },
  },
});
