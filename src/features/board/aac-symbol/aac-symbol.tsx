import { styled } from "@mui/material/styles";
import visuallyHidden from "@mui/utils/visuallyHidden";

export type SymbolLabelPlacement = "top" | "bottom";

interface AACSymbolProps {
  imageSrc?: string;
  label: string;
  labelPlacement?: SymbolLabelPlacement;
  isLabelHidden?: boolean;
  isImageHidden?: boolean;
}

interface SymbolRootOwnerState {
  labelPlacement: SymbolLabelPlacement;
}

interface SymbolLabelOwnerState {
  isImageShown: boolean;
  isLabelShown: boolean;
}

const SymbolRoot = styled("span")<{ ownerState: SymbolRootOwnerState }>(
  ({ theme, ownerState }) => ({
    display: "flex",
    flexDirection:
      ownerState.labelPlacement === "top" ? "column-reverse" : "column",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gap: theme.spacing(0.5),
    overflow: "hidden",
    textAlign: "center",
  }),
);

const SymbolImageFrame = styled("span")({
  position: "relative",
  flexGrow: 1,
  height: "54px",
  aspectRatio: "1 / 1",
});

const SymbolImage = styled("img")({
  position: "absolute",
  top: 0,
  insetInlineStart: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  pointerEvents: "none",
});

const SymbolLabel = styled("span")<{ ownerState: SymbolLabelOwnerState }>(
  ({ theme, ownerState }) => ({
    margin: 0,
    overflow: "hidden",
    ...theme.typography[ownerState.isImageShown ? "body2" : "h5"],
    lineHeight: 1.2,
    fontWeight: theme.typography.fontWeightBold,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ...(!ownerState.isLabelShown && visuallyHidden),
  }),
);

export function AACSymbol({
  imageSrc,
  label,
  labelPlacement = "bottom",
  isLabelHidden = false,
  isImageHidden = false,
}: AACSymbolProps) {
  const hasLabel = label.trim() !== "";
  const isImageShown = Boolean(imageSrc) && !(isImageHidden && hasLabel);
  const isLabelShown = !(isLabelHidden && isImageShown);

  return (
    <SymbolRoot ownerState={{ labelPlacement }}>
      {isImageShown && (
        <SymbolImageFrame>
          <SymbolImage alt="" src={imageSrc} />
        </SymbolImageFrame>
      )}
      <SymbolLabel ownerState={{ isImageShown, isLabelShown }}>
        {label}
      </SymbolLabel>
    </SymbolRoot>
  );
}
