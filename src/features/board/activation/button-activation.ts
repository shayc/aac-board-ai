import { assertNever } from "@shared/utils/assert-never";
import type { CommunicationSession } from "../session/communication-session";
import type { BoardButton } from "../types";

interface ButtonActivatorOptions {
  session: CommunicationSession;
  navigation: {
    goToBoard: (boardId: string) => void;
    goHome: () => void;
  };
}

export function createButtonActivator({
  session,
  navigation,
}: ButtonActivatorOptions) {
  return (button: BoardButton) => {
    const { behavior } = button;

    switch (behavior.kind) {
      case "navigate":
        navigation.goToBoard(behavior.boardId);
        break;
      case "compose":
        session.appendAndPlay({
          label: button.label,
          vocalization: button.vocalization,
          image: button.image,
          sound: button.sound,
        });
        break;
      case "actions":
        void session.runActions(behavior.actions, navigation.goHome);
        break;
      default:
        assertNever(behavior);
    }
  };
}
