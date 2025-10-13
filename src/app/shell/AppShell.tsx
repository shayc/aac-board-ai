import Box from "@mui/material/Box";
import { useState } from "react";
import { Outlet } from "react-router";
import { AppProviders } from "../AppProviders";
import { WelcomeDialog } from "../dialogs/WelcomeDialog/WelcomeDialog";
import { AppHeader } from "./AppHeader";
import { MenuDrawer } from "./MenuDrawer/MenuDrawer";
import { SettingsDrawer } from "./SettingsDrawer/SettingsDrawer";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  return (
    <AppProviders>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <AppHeader
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
    </AppProviders>
  );
}
