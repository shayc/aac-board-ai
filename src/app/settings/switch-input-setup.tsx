import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import {
  setSwitchInput,
  type SwitchInput,
  type SwitchInputAssignments,
  type SwitchInputRole,
  type SwitchScanningMethod,
} from "@shared/switch-scanning/switch-scanning-store";
import { useEffect, useState } from "react";
import { formatSwitchInput } from "./switch-input-presentation";

interface SwitchInputSetupProps {
  inputs: SwitchInputAssignments;
  method: SwitchScanningMethod;
}

interface SwitchInputButtonProps {
  input: SwitchInput;
  isListening: boolean;
  label: string;
  onListen: () => void;
}

function getKeyboardLabel(event: KeyboardEvent): string {
  if (event.key === " " || event.key === "Unidentified") {
    return event.code;
  }

  return event.key.length === 1 ? event.key.toLocaleUpperCase() : event.key;
}

function SwitchInputButton({
  input,
  isListening,
  label,
  onListen,
}: SwitchInputButtonProps) {
  return (
    <Stack spacing={0.5} sx={{ flex: 1 }} role="group" aria-label={label}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Button
        fullWidth
        variant="outlined"
        onClick={onListen}
        aria-live="polite"
        aria-pressed={isListening}
        sx={{
          minHeight: 40,
          px: 1.5,
          py: 0.75,
          color: "text.primary",
          borderColor: isListening ? "primary.main" : "divider",
          justifyContent: "space-between",
          textTransform: "none",
          "&:hover": {
            borderColor: "text.secondary",
            backgroundColor: "action.hover",
          },
          "&.Mui-focusVisible": {
            borderColor: "primary.main",
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
      >
        {isListening ? (
          m.switchScanningAssign()
        ) : (
          <>
            <span>{formatSwitchInput(input)}</span>
            <Typography component="span" variant="body2" color="primary.main">
              {m.switchScanningChange()}
            </Typography>
          </>
        )}
      </Button>
    </Stack>
  );
}

export function SwitchInputSetup({ inputs, method }: SwitchInputSetupProps) {
  const [listeningRole, setListeningRole] = useState<SwitchInputRole | null>(
    null,
  );
  const roles: readonly SwitchInputRole[] =
    method === "step" ? ["next", "select"] : ["single"];

  useEffect(() => {
    if (!listeningRole) {
      return;
    }

    const role = listeningRole;

    function assignInput(input: SwitchInput): void {
      setSwitchInput(role, input);
      setListeningRole(null);
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.repeat || event.code.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      assignInput({
        kind: "keyboard",
        code: event.code,
        label: getKeyboardLabel(event),
      });
    }

    function onMouseInput(event: MouseEvent): void {
      event.preventDefault();
      event.stopPropagation();
      assignInput({ kind: "mouse", button: event.button });
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("click", onMouseInput, true);
    document.addEventListener("auxclick", onMouseInput, true);
    document.addEventListener("contextmenu", onMouseInput, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("click", onMouseInput, true);
      document.removeEventListener("auxclick", onMouseInput, true);
      document.removeEventListener("contextmenu", onMouseInput, true);
    };
  }, [listeningRole]);

  function getRoleLabel(role: SwitchInputRole): string {
    switch (role) {
      case "single":
        if (method === "auto") {
          return m.switchScanningSelectSwitch();
        }

        if (method === "dwell") {
          return m.switchScanningNextItemSwitch();
        }

        return m.switchScanningScanSwitch();
      case "next":
        return m.switchScanningNextItemSwitch();
      case "select":
        return m.switchScanningSelectSwitch();
    }
  }

  return (
    <Stack spacing={1.5} sx={{ pt: 1 }}>
      {roles.map((role) => (
        <SwitchInputButton
          key={role}
          input={inputs[role]}
          isListening={listeningRole === role}
          label={getRoleLabel(role)}
          onListen={() => setListeningRole(role)}
        />
      ))}
    </Stack>
  );
}
