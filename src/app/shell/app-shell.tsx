import { LibraryDrawer } from "@app/library/library-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { useRevalidateOnLanguageChange } from "@app/routing/use-revalidate-on-language-change";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useImportBoardFilesOnLaunch,
} from "@features/board";
import Box from "@mui/material/Box";
import { PerfProfiler, usePerfSpan } from "@perf";
import { useState } from "react";
import { Outlet } from "react-router";
import { AppHeader } from "./app-header";

export function AppShell() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();
  const libraryOpenSpan = usePerfSpan("flow:library:open", isLibraryOpen);
  const settingsOpenSpan = usePerfSpan("flow:settings:open", isSettingsOpen);

  useImportBoardFilesOnLaunch();
  useRevalidateOnLanguageChange();

  function openLibrary() {
    libraryOpenSpan.start();
    setIsLibraryOpen(true);
  }

  function openSettings() {
    settingsOpenSpan.start();
    setIsSettingsOpen(true);
  }

  return (
    <Box
      {...fileDrop.rootProps}
      sx={{ display: "flex", flexDirection: "column", height: "100svh" }}
    >
      <PerfProfiler id="AppHeader">
        <AppHeader onOpenLibrary={openLibrary} onOpenSettings={openSettings} />
      </PerfProfiler>

      <Box component="main" sx={{ flexGrow: 1, overflow: "auto" }}>
        <Outlet />
      </Box>

      <PerfProfiler id="LibraryDrawer">
        <LibraryDrawer
          open={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
        />
      </PerfProfiler>

      <PerfProfiler id="SettingsDrawer">
        <SettingsDrawer
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </PerfProfiler>

      <OnboardingDialog
        open={onboarding.shouldShow}
        onClose={onboarding.dismiss}
      />

      <BoardFileDropOverlay open={fileDrop.isDraggingFiles} />
    </Box>
  );
}
