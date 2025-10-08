import Box from "@mui/material/Box";
import { useState } from "react";
import { Outlet } from "react-router";
import { AppBar } from "./AppBar";
import { MenuDrawer } from "./MenuDrawer/MenuDrawer";
import { SettingsDrawer } from "./SettingsDrawer/SettingsDrawer";
import { WelcomeDialog } from "./WelcomeDialog/WelcomeDialog";

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar
        onMenuClick={() => setIsMenuOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <Box sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      <MenuDrawer open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <SettingsDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <WelcomeDialog
        open={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />
    </Box>
  );
}
