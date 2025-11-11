import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { type PipelineStep } from "@features/ai/hooks";

export interface AIAnnouncementRegionProps {
  step: PipelineStep;
}

/**
 * ARIA live region for announcing AI transformation steps
 *
 * Provides accessible feedback for screen reader users during
 * the message transformation pipeline.
 */
export function AIAnnouncementRegion({ step }: AIAnnouncementRegionProps) {
  const previousStepRef = useRef<PipelineStep>("idle");

  useEffect(() => {
    previousStepRef.current = step;
  }, [step]);

  const getMessage = (): string => {
    switch (step) {
      case "idle":
        return "";
      case "proofreading":
        return "Checking grammar and spelling...";
      case "rewriting":
        return "Adjusting tone...";
      case "translating":
        return "Translating message...";
      case "done":
        return "Message transformation complete.";
      case "error":
        return "An error occurred during message transformation.";
    }
  };

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-atomic="true"
      sx={{
        position: "absolute",
        left: "-10000px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      {getMessage()}
    </Box>
  );
}
