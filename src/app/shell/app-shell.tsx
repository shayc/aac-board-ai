import { LibraryDrawer } from "@app/library/library-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { useRevalidateBoardOnLanguageChange } from "@app/routing/use-revalidate-board-on-language-change";
import { useSyncBoardMediaWithActiveRoute } from "@app/routing/use-sync-board-media-with-active-route";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import { AppHeader } from "@app/shell/app-header";
import { ContentColumn } from "@app/shell/content-column";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useImportLaunchedBoardFiles,
} from "@features/board";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();

  const isPersistentLibrary = useMediaQuery((theme) =>
    theme.breakpoints.up("md"),
  );
  const isLibraryPushingContent = isPersistentLibrary && isLibraryOpen;

  useImportLaunchedBoardFiles();
  useSyncBoardMediaWithActiveRoute();
  useRevalidateBoardOnLanguageChange();

  return (
    <Box sx={{ height: "100svh", display: "flex" }} {...fileDrop.dropHandlers}>
      <LibraryDrawer
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        variant={isPersistentLibrary ? "persistent" : "temporary"}
      />

      <ContentColumn shifted={isLibraryPushingContent}>
        <AppHeader
          libraryButtonHidden={isLibraryPushingContent}
          onOpenLibrary={() => setIsLibraryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
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
