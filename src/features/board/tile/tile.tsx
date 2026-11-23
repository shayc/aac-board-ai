import type { BoardAction, BoardButton } from "@features/library";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { type Translate, useTranslate } from "@shared/language/use-translate";
import { assertNever } from "@shared/utils/assert-never";
import { AACSymbol } from "../aac-symbol";
import { folderTileSx, tileColorStyle, tileSx } from "./tile-appearance";
import { useTilePreferences } from "./tile-preferences-store";

interface TileProps {
  button: BoardButton;
  language: string | undefined;
  tabIndex: number;
  onActivate: (button: BoardButton) => void;
}

export function Tile({ button, language, tabIndex, onActivate }: TileProps) {
  const t = useTranslate();
  const { saturation, brightness, areBordersVisible, labelPlacement } =
    useTilePreferences();

  const nameProps = getTileNameProps(button, language, t);
  const isFolder = Boolean(button.linkedBoardId);
  const colorStyle = tileColorStyle({
    backgroundColor: button.backgroundColor,
    borderColor: button.borderColor,
    isBorderVisible: areBordersVisible,
    saturation,
    brightness,
  });

  const symbolLabelPlacement = labelPlacement === "top" ? "top" : "bottom";
  const isLabelVisible = labelPlacement !== "hidden";

  return (
    <Button
      {...nameProps}
      aria-description={isFolder ? t(m.tileOpensBoard) : undefined}
      tabIndex={tabIndex}
      style={colorStyle}
      onClick={() => onActivate(button)}
      sx={[tileSx, isFolder && folderTileSx]}
    >
      <AACSymbol
        label={button.label}
        imageSrc={button.imageSrc}
        labelPlacement={symbolLabelPlacement}
        isLabelVisible={isLabelVisible}
      />
    </Button>
  );
}

function getTileNameProps(
  button: BoardButton,
  language: string | undefined,
  t: Translate,
) {
  if (button.label) {
    return { lang: language };
  }

  if (button.vocalization || button.linkedBoardId) {
    return { "aria-label": button.vocalization, lang: language };
  }

  const actionName = getActionName(button.actions, t);
  if (actionName === undefined) {
    return { lang: language };
  }

  // A generated name inherits the document's UI language.
  return { "aria-label": actionName };
}

function getActionName(
  actions: readonly BoardAction[],
  t: Translate,
): string | undefined {
  const supportedActions = actions.filter(
    (action) => action.kind !== "unsupported",
  );
  const [action] = supportedActions;
  if (!action || supportedActions.length !== 1) {
    return undefined;
  }

  switch (action.kind) {
    case "space":
      return t(m.tileSpace);
    case "backspace":
      return t(m.messageBackspace);
    case "clear":
      return t(m.messageClear);
    case "home":
      return t(m.navHome);
    case "play":
      return t(m.messagePlay);
    case "spell":
      return undefined;
    default:
      return assertNever(action);
  }
}
