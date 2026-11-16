import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { useRevalidateBoardSet } from "@app/routing/use-revalidate-board-set";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useImportBoardFilesOnLaunch,
  useTranslateBoardSets,
} from "@features/library";
import Box from "@mui/material/Box";
import { ErrorBoundary } from "@shared/ui/error-boundary";
import { useState } from "react";
import { Outlet } from "react-router";
import { AppHeader } from "./app-header";
import { LibraryDrawer } from "./library-drawer";

export function AppShell() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();
  const revalidateBoardSet = useRevalidateBoardSet();

  useImportBoardFilesOnLaunch();
  useTranslateBoardSets({ onBoardSetTranslated: revalidateBoardSet });

  return (
    <Box
      {...fileDrop.rootProps}
      sx={{ display: "flex", flexDirection: "column", height: "100svh" }}
    >
      <AppHeader
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <Box component="main" sx={{ flex: 1, overflow: "auto" }}>
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

      <ErrorBoundary fallback={null}>
        <OnboardingDialog
          open={onboarding.shouldShow}
          onClose={onboarding.dismiss}
        />
      </ErrorBoundary>

      <BoardFileDropOverlay open={fileDrop.isDraggingFiles} />
    </Box>
  );
}
