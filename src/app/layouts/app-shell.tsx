import { AppHeader } from "@app/layouts/app-header";
import { ContentColumn } from "@app/layouts/content-column";
import { MenuDrawer } from "@app/menu/menu-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useFileHandlerLaunch,
} from "@features/board";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRevalidateOnLanguageChange } from "@shared/language/use-revalidate-on-language-change";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();

  const isPersistentMenu = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isMenuPushingContent = isPersistentMenu && isMenuOpen;

  useFileHandlerLaunch();
  useRevalidateOnLanguageChange();

  return (
    <Box sx={{ height: "100svh", display: "flex" }} {...fileDrop.dropHandlers}>
      <MenuDrawer
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        variant={isPersistentMenu ? "persistent" : "temporary"}
      />

      <ContentColumn shifted={isMenuPushingContent}>
        <AppHeader
          menuButtonHidden={isMenuPushingContent}
          onMenuClick={() => setIsMenuOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        <Box component="main" sx={{ flexGrow: 1, overflow: "auto" }}>
          <Outlet />
        </Box>
      </ContentColumn>

      <SettingsDrawer
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <OnboardingDialog
        open={onboarding.shouldShow}
        onClose={onboarding.dismiss}
      />

      <BoardFileDropOverlay open={fileDrop.isDraggingFiles} />
    </Box>
  );
}
