import { AppProviders } from "@app/AppProviders";
import { WelcomeDialog } from "@app/dialogs/WelcomeDialog/WelcomeDialog";
import Box from "@mui/material/Box";
import { useState } from "react";
import { Outlet } from "react-router";
import { AppHeader } from "./AppHeader";
import { MenuDrawer } from "./MenuDrawer/MenuDrawer";
import { SettingsDrawer } from "./SettingsDrawer/SettingsDrawer";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [headerContent, setHeaderContent] = useState<React.ReactNode>(null);

  return (
    <AppProviders>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <AppHeader
          onMenuClick={() => setIsMenuOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
        >
          {headerContent}
        </AppHeader>

        <Box sx={{ flexGrow: 1 }}>
          <Outlet context={{ setHeaderContent }} />
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
