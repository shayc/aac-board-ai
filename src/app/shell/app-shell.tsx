import { LibraryDrawer } from "@app/library/library-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { useRevalidateOnLanguageChange } from "@app/routing/use-revalidate-on-language-change";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import { AppHeader } from "@app/shell/app-header";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useImportBoardFilesOnLaunch,
} from "@features/board";
import Box from "@mui/material/Box";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();

  useImportBoardFilesOnLaunch();
  useRevalidateOnLanguageChange();

  return (
    <Box
      {...fileDrop.rootProps}
      sx={{ display: "flex", flexDirection: "column", height: "100svh" }}
    >
      <AppHeader
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <Box component="main" sx={{ flexGrow: 1, overflow: "auto" }}>
        <Outlet />
      </Box>

      <LibraryDrawer
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

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
