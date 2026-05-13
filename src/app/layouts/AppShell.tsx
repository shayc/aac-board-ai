import { OnboardingDialog } from "@app/dialogs/OnboardingDialog";
import { useOnboarding } from "@app/dialogs/useOnboarding";
import { MenuDrawer } from "@app/drawers/MenuDrawer";
import { SettingsDrawer } from "@app/drawers/settings/SettingsDrawer";
import { AppHeader } from "@app/layouts/AppHeader";
import Box from "@mui/material/Box";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();

  return (
    <Box sx={{ height: "100svh", display: "flex", flexDirection: "column" }}>
      <AppHeader
        onMenuClick={() => setIsMenuOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <Box component="main" sx={{ flexGrow: 1, overflow: "auto" }}>
        <Outlet />
      </Box>

      <MenuDrawer open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <SettingsDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <OnboardingDialog
        open={onboarding.shouldShow}
        onClose={onboarding.dismiss}
      />
    </Box>
  );
}
