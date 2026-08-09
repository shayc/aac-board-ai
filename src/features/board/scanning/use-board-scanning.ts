import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
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

interface UseBoardScanningOptions {
  hasMessage: boolean;
  isMessagePlaying: boolean;
  navigation: {
    canGoBack: boolean;
    canGoHome: boolean;
  };
  suggestions: {
    needsActivation: boolean;
  };
}

interface UseBoardScanningReturn {
  playTarget: ScanTargetProps;
  backTarget: ScanTargetProps;
  homeTarget: ScanTargetProps;
  suggestionsEnableTarget: ScanTargetProps;
  backspaceTarget: ScanTargetProps;
}

export function useBoardScanning({
  hasMessage,
  isMessagePlaying,
  navigation,
  suggestions,
}: UseBoardScanningOptions): UseBoardScanningReturn {
  const t = useTranslate();
  const playTarget = useScanTarget({
    id: PLAY_SCAN_ID,
    label: isMessagePlaying ? t(m.messageStop) : t(m.messagePlay),
    disabled: !hasMessage,
  });

  const backTarget = useScanTarget({
    id: BACK_SCAN_ID,
    label: t(m.navBack),
    disabled: !navigation.canGoBack,
  });

  const homeTarget = useScanTarget({
    id: HOME_SCAN_ID,
    label: t(m.navHome),
    disabled: !navigation.canGoHome,
  });

  const suggestionsEnableTarget = useScanTarget({
    id: SUGGESTIONS_ENABLE_SCAN_ID,
    label: t(m.suggestionsEnable),
    disabled: !suggestions.needsActivation,
  });

  const backspaceTarget = useScanTarget({
    id: BACKSPACE_SCAN_ID,
    label: t(m.messageBackspace),
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
