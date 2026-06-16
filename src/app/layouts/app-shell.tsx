import { AppHeader } from "@app/layouts/app-header";
import {
  LibraryDrawer,
  LIBRARY_DRAWER_WIDTH,
} from "@app/library/library-drawer";
import { OnboardingDialog } from "@app/onboarding/onboarding-dialog";
import { useOnboarding } from "@app/onboarding/use-onboarding";
import { SettingsDrawer } from "@app/settings/settings-drawer";
import {
  BoardFileDropOverlay,
  useBoardFileDrop,
  useFileHandlerLaunch,
} from "@features/board";
import Box from "@mui/material/Box";
import { useRevalidateOnLanguageChange } from "@shared/language/use-revalidate-on-language-change";
import { useState } from "react";
import { Outlet } from "react-router";

export function AppShell() {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onboarding = useOnboarding();
  const fileDrop = useBoardFileDrop();

  useFileHandlerLaunch();
  useRevalidateOnLanguageChange();

  return (
    <Box
      sx={{ height: "100svh", display: "flex", overflow: "hidden" }}
      {...fileDrop.dropHandlers}
    >
      <LibraryDrawer
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
      />

      <Box
        sx={[
          {
            flexGrow: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          },
          (theme) => ({
            [theme.breakpoints.up("md")]: {
              marginInlineStart: `calc(${LIBRARY_DRAWER_WIDTH} * -1)`,
              transition: theme.transitions.create("margin", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              ...(isLibraryOpen && {
                marginInlineStart: 0,
                transition: theme.transitions.create("margin", {
                  easing: theme.transitions.easing.easeOut,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              }),
            },
          }),
        ]}
      >
        <AppHeader
          onLibraryClick={() => setIsLibraryOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

        <Box
          component="main"
          sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}
        >
          <Outlet />
        </Box>
      </Box>

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
