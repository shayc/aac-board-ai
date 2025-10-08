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
    <div>
      <AppBar
        onMenuClick={() => setIsMenuOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <Outlet />

      <MenuDrawer open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <SettingsDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <WelcomeDialog
        open={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
      />
    </div>
  );
}
