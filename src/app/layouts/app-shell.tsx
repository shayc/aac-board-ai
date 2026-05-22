import { MenuDrawer } from "@app/menu/menu-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import { AppHeader } from "@app/layouts/app-header";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";

const FADE_DURATION_MS = 400;

// Collapse all in-board navigation to one key so switching between boards
// does not re-trigger the page fade.
function getFadeKey(pathname: string): string {
  if (pathname.startsWith("/sets/")) {
    return "/sets";
  }
  return pathname;
}

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const location = useLocation();
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );

  return (
    <Box sx={{ height: "100svh", display: "flex", flexDirection: "column" }}>
      <ScrollRestoration />

      <AppHeader
        onMenuClick={() => setIsMenuOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <Fade
        key={getFadeKey(location.pathname)}
        in
        timeout={prefersReducedMotion ? 0 : FADE_DURATION_MS}
      >
        <Box component="main" sx={{ flexGrow: 1, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Fade>

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
