import ButtonBase, { buttonBaseClasses } from "@mui/material/ButtonBase";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { CSSProperties } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import type { BoardButton } from "../board-types";
import { useTilePreferences } from "./tile-preferences-store";

interface TileProps {
  button: BoardButton;
  tabIndex: number;
  onActivate: (button: BoardButton) => void;
}

type TileColorStyle = CSSProperties & {
  "--tile-background-color"?: string;
  "--tile-border-color"?: string;
};

function channelOntoWhite(channel: "r" | "g" | "b"): string {
  return `calc(${channel} * alpha + 255 * (1 - alpha))`;
}

function flattenOntoWhite(color: string): string {
  return `rgb(from ${color} ${channelOntoWhite("r")} ${channelOntoWhite("g")} ${channelOntoWhite("b")} / 1)`;
}

function desaturate(color: string, saturation: number): string {
  return `oklch(from ${color} l calc(c * ${saturation}) h)`;
}

interface TileColorOptions {
  backgroundColor: string | undefined;
  borderColor: string | undefined;
  isBorderVisible: boolean;
  saturation: number;
}

function tileColorStyle({
  backgroundColor,
  borderColor,
  isBorderVisible,
  saturation,
}: TileColorOptions): TileColorStyle {
  const visibleBorderColor = isBorderVisible ? borderColor : undefined;

  return {
    "--tile-background-color":
      backgroundColor &&
      desaturate(flattenOntoWhite(backgroundColor), saturation),
    "--tile-border-color":
      visibleBorderColor && desaturate(visibleBorderColor, saturation),
  };
}

function mixWithTextColor(color: string, amount: string): string {
  return `color-mix(in oklab, ${color}, currentColor ${amount})`;
}

function tileSx(theme: Theme) {
  const background = `var(--tile-background-color, ${theme.vars.palette.background.paper})`;

  return {
    position: "relative",
    display: "grid",
    alignItems: "stretch",
    justifyContent: "stretch",
    width: "100%",
    height: "100%",
    p: 1,
    overflow: "hidden",
    ...theme.typography.button,
    color: `contrast-color(${background})`,
    backgroundColor: background,
    border: "4px solid var(--tile-border-color, transparent)",
    borderRadius: theme.vars.shape.borderRadius,
    boxShadow: theme.vars.shadows[2],
    transition: theme.transitions.create(
      ["background-color", "box-shadow", "border-color", "color"],
      {
        duration: theme.transitions.duration.shortest,
        easing: theme.transitions.easing.easeOut,
      },
    ),
    "&::before": {
      display: "none",
    },
    "&:hover": {
      "@media (hover: hover)": {
        backgroundColor: mixWithTextColor(background, "8%"),
        boxShadow: theme.vars.shadows[4],
      },
    },
    "&:active": {
      backgroundColor: mixWithTextColor(background, "16%"),
      boxShadow: theme.vars.shadows[8],
      transitionDuration: "0ms",
    },
    [`&.${buttonBaseClasses.focusVisible}`]: {
      outlineWidth: 3,
      boxShadow: theme.vars.shadows[6],
    },
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  } as const;
}

const folderTileSx = {
  "&::after": {
    content: '""',
    position: "absolute",
    top: -2,
    insetInlineEnd: -2,
    width: 0,
    height: 0,
    borderInlineEnd:
      "32px solid color-mix(in srgb, currentColor 75%, transparent)",
    borderBottom: "32px solid transparent",
  },
} as const;

export function Tile({ button, tabIndex, onActivate }: TileProps) {
  const t = useTranslate();
  const { saturation, areBordersVisible, labelPlacement } =
    useTilePreferences();

  const ariaLabel = button.label ? undefined : button.vocalization;
  const isFolder = Boolean(button.linkedBoardId);
  const colorStyle = tileColorStyle({
    backgroundColor: button.backgroundColor,
    borderColor: button.borderColor,
    isBorderVisible: areBordersVisible,
    saturation,
  });

  const symbolLabelPlacement = labelPlacement === "top" ? "top" : "bottom";
  const isLabelHidden = labelPlacement === "hidden";

  return (
    <ButtonBase
      aria-label={ariaLabel}
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
        isLabelHidden={isLabelHidden}
      />
    </ButtonBase>
  );
}
