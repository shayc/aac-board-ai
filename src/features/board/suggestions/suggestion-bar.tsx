import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { Fragment, type ReactNode } from "react";
import type { SuggestionStatusView } from "./derive-suggestion-status";
import { PendingDot } from "./pending-dot";
import {
  SuggestionStatus,
  type SuggestionEnableButtonProps,
} from "./suggestion-status";

export interface SuggestionBarSlotProps {
  enableButton?: SuggestionEnableButtonProps;
}

export interface SuggestionBarProps {
  status: SuggestionStatusView;
  phrases: string[];
  slotProps?: SuggestionBarSlotProps;
  renderPhrase?: (phrase: string, onClick: () => void) => ReactNode;
  onEnable: () => void;
  onPhraseClick: (phrase: string) => void;
}

export function SuggestionBar({
  status,
  phrases,
  slotProps,
  renderPhrase,
  onEnable,
  onPhraseClick,
}: SuggestionBarProps) {
  const isPending = status?.kind === "pending";

  return (
    <Stack
      direction="row"
      sx={{
        minHeight: 32,
        flex: "1",
        gap: 2,
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      {(status === null || isPending) && <PendingDot show={isPending} />}

      <SuggestionStatus
        status={status}
        enableButtonProps={slotProps?.enableButton}
        onEnable={onEnable}
      />

      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 2,
          marginInlineEnd: "auto",
          overflowX: "auto",
        }}
      >
        {phrases.map((phrase) => {
          const onClick = () => onPhraseClick(phrase);

          return renderPhrase ? (
            <Fragment key={phrase}>{renderPhrase(phrase, onClick)}</Fragment>
          ) : (
            <Chip key={phrase} label={phrase} onClick={onClick} />
          );
        })}
      </Box>
    </Stack>
  );
}
