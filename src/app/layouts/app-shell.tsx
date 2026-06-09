import { AppHeader } from "@app/layouts/app-header";
import { MenuDrawer } from "@app/menu/menu-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useFileHandlerLaunch,
  warmUpSuggestionModels,
} from "@features/board";
import Box from "@mui/material/Box";
import { useRevalidateOnLanguageChange } from "@shared/language/use-revalidate-on-language-change";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();

  useFileHandlerLaunch();
  useRevalidateOnLanguageChange();

  return (
    <Box
      sx={{ height: "100svh", display: "flex", flexDirection: "column" }}
      {...fileDrop.dropHandlers}
    >
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
        onClose={() => {
          // Dismissal is a user gesture, which model downloads require.
          warmUpSuggestionModels();
          onboarding.dismiss();
        }}
      />

      <BoardFileDropOverlay open={fileDrop.isDraggingFiles} />
    </Box>
  );
}
