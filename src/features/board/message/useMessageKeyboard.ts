import { useKeyboard } from "react-aria";

export interface UseMessageKeyboardOptions {
  onBackspace: () => void;
}

export interface UseMessageKeyboardReturn {
  keyboardProps: ReturnType<typeof useKeyboard>["keyboardProps"];
}

export function useMessageKeyboard({
  onBackspace,
}: UseMessageKeyboardOptions): UseMessageKeyboardReturn {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }

      if (event.key !== "Backspace") {
        return;
      }

      event.preventDefault();
      onBackspace();
    },
  });

  return { keyboardProps };
}
