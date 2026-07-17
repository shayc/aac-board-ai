import { m } from "@paraglide/messages.js";
import {
  type ScanGroupProps,
  type ScanTargetProps,
  useScanGroup,
  useScanTarget,
} from "@shayc/switch-scanning/react";
import {
  ACTIONS_SCAN_ID,
  BACK_SCAN_ID,
  BACKSPACE_SCAN_ID,
  getSuggestionScanId,
  HOME_SCAN_ID,
  PLAY_SCAN_ID,
  SUGGESTIONS_ENABLE_SCAN_ID,
} from "./board-scanning-ids";

export interface UseBoardScanningOptions {
  boardId: string;
  hasMessage: boolean;
  isPlaying: boolean;
  navigation: {
    isInBoardSet: boolean;
    canGoBack: boolean;
    canGoHome: boolean;
    isHome: boolean;
  };
  suggestions: {
    isSupported: boolean;
    needsActivation: boolean;
    phrases: readonly string[];
  };
}

export interface UseBoardScanningReturn {
  playTarget: ScanTargetProps;
  backTarget: ScanTargetProps;
  homeTarget: ScanTargetProps;
  suggestionsEnableTarget: ScanTargetProps;
  backspaceTarget: ScanTargetProps;
  actionsGroup: ScanGroupProps;
}

export function useBoardScanning({
  boardId,
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
    parentId: ACTIONS_SCAN_ID,
    label: m.navBack(),
    disabled: !navigation.canGoBack,
  });

  const homeTarget = useScanTarget({
    id: HOME_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.navHome(),
    disabled: !navigation.canGoHome || navigation.isHome,
  });

  const suggestionsEnableTarget = useScanTarget({
    id: SUGGESTIONS_ENABLE_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.suggestionsEnable(),
    disabled: !suggestions.needsActivation,
  });

  const backspaceTarget = useScanTarget({
    id: BACKSPACE_SCAN_ID,
    parentId: ACTIONS_SCAN_ID,
    label: m.messageBackspace(),
    disabled: !hasMessage,
  });

  const suggestionScanIds = suggestions.isSupported
    ? suggestions.phrases.map((phrase) => getSuggestionScanId(boardId, phrase))
    : [];

  const actionSequence = [
    ...(navigation.isInBoardSet ? [BACK_SCAN_ID, HOME_SCAN_ID] : []),
    ...(suggestions.needsActivation ? [SUGGESTIONS_ENABLE_SCAN_ID] : []),
    ...suggestionScanIds,
    BACKSPACE_SCAN_ID,
  ];

  const actionsGroup = useScanGroup({
    id: ACTIONS_SCAN_ID,
    label: m.switchScanningActions(),
    exitLabel: m.switchScanningActionsExit(),
    sequence: actionSequence,
  });

  return {
    playTarget,
    backTarget,
    homeTarget,
    suggestionsEnableTarget,
    backspaceTarget,
    actionsGroup,
  };
}
