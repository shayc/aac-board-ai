import { AppProviders } from "@app/AppProviders";
import { OnboardingDialog } from "@app/dialogs/OnboardingDialog";
import { MenuDrawer } from "@app/drawers/MenuDrawer";
import { SettingsDrawer } from "@app/drawers/SettingsDrawer/SettingsDrawer";
import { AppHeader } from "@app/layouts/AppHeader";
import Box from "@mui/material/Box";
import { usePersistentState } from "@shared/hooks/usePersistentState";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = usePersistentState(
    "hasSeenOnboarding",
    false,
  );

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
          open={!hasSeenOnboarding}
          onClose={() => setHasSeenOnboarding(true)}
        />
      </Box>
    </AppProviders>
  );
}
