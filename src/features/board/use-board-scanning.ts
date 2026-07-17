import { m } from "@paraglide/messages.js";
import {
  type ScanTargetProps,
  useScanTarget,
} from "@shayc/switch-scanning/react";
import {
  BACK_SCAN_ID,
  BACKSPACE_SCAN_ID,
  HOME_SCAN_ID,
  PLAY_SCAN_ID,
  SUGGESTIONS_ENABLE_SCAN_ID,
} from "./board-scanning-ids";

export interface UseBoardScanningOptions {
  hasMessage: boolean;
  isPlaying: boolean;
  navigation: {
    canGoBack: boolean;
    canGoHome: boolean;
    isHome: boolean;
  };
  suggestions: {
    needsActivation: boolean;
  };
}

export interface UseBoardScanningReturn {
  playTarget: ScanTargetProps;
  backTarget: ScanTargetProps;
  homeTarget: ScanTargetProps;
  suggestionsEnableTarget: ScanTargetProps;
  backspaceTarget: ScanTargetProps;
}

export function useBoardScanning({
  hasMessage,
  isPlaying,
  navigation,
  suggestions,
}: UseBoardScanningOptions): UseBoardScanningReturn {
  const playTarget = useScanTarget({
    id: PLAY_SCAN_ID,
    label: isPlaying ? m.messageStop() : m.messagePlay(),
    disabled: !hasMessage,
  });

  const backTarget = useScanTarget({
    id: BACK_SCAN_ID,
    label: m.navBack(),
    disabled: !navigation.canGoBack,
  });

  const homeTarget = useScanTarget({
    id: HOME_SCAN_ID,
    label: m.navHome(),
    disabled: !navigation.canGoHome || navigation.isHome,
  });

  const suggestionsEnableTarget = useScanTarget({
    id: SUGGESTIONS_ENABLE_SCAN_ID,
    label: m.suggestionsEnable(),
    disabled: !suggestions.needsActivation,
  });

  const backspaceTarget = useScanTarget({
    id: BACKSPACE_SCAN_ID,
    label: m.messageBackspace(),
    disabled: !hasMessage,
  });

  return {
    playTarget,
    backTarget,
    homeTarget,
    suggestionsEnableTarget,
    backspaceTarget,
  };
}
