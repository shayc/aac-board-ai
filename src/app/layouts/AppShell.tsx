import { AppProviders } from "@app/AppProviders";
import { OnboardingDialog } from "@app/dialogs/OnboardingDialog";
import Box from "@mui/material/Box";
import { usePersistentState } from "@shared/hooks/usePersistentState";
import { useState } from "react";
import { Outlet } from "react-router";
import { MenuDrawer } from "../drawers/MenuDrawer";
import { SettingsDrawer } from "../drawers/SettingsDrawer/SettingsDrawer";
import { AppHeader } from "./AppHeader";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = usePersistentState(
    "onboardingSeen",
    false,
  );
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!onboardingSeen);

  return (
    <AppProviders>
      <Box sx={{ height: "100svh", display: "flex", flexDirection: "column" }}>
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

        <OnboardingDialog
          open={isOnboardingOpen}
          onClose={() => {
            setOnboardingSeen(true);
            setIsOnboardingOpen(false);
          }}
        />
      </Box>
    </AppProviders>
  );
}
