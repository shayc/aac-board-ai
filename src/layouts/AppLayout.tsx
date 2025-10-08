import { useState } from "react";
import { Outlet } from "react-router";
import { AppBar } from "./AppBar";
import { NavigationDrawer } from "./NavigationDrawer/NavigationDrawer";
import { SettingsDrawer } from "./SettingsDrawer/SettingsDrawer";

export function AppLayout() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div>
      <AppBar
        setIsNavigationOpen={setIsNavigationOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />

      <NavigationDrawer
        open={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      />

      <SettingsDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <Outlet />
    </div>
  );
}
