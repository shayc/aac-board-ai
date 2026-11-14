import type { SxProps, Theme } from "@mui/material/styles";
import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import { createSvgIcon } from "@mui/material/utils";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  CloudDownload,
  Delete,
  Download,
  EllipsisVertical,
  FileDown,
  FolderOpen,
  House,
  Image,
  Info,
  Languages,
  Lock,
  type LucideIcon,
  Monitor,
  Moon,
  PanelLeft,
  Play,
  Settings,
  Sparkles,
  Speech,
  Square,
  Sun,
  Trash2,
  X,
} from "lucide-react";

export type IconComponent = ReturnType<typeof lucideIcon>;

export const BackIcon = lucideIcon(ArrowLeft, "Back");
export const BackspaceIcon = lucideIcon(Delete, "Backspace");
export const CheckIcon = lucideIcon(Check, "Check");
export const CloseIcon = lucideIcon(X, "Close");
export const DarkModeIcon = lucideIcon(Moon, "DarkMode");
export const DeleteIcon = lucideIcon(Trash2, "Delete");
export const DownloadIcon = lucideIcon(Download, "Download");
export const DownloadingIcon = lucideIcon(CloudDownload, "Downloading");
export const ErrorIcon = lucideIcon(CircleAlert, "Error");
export const FileDropIcon = lucideIcon(FileDown, "FileDrop");
export const HomeIcon = lucideIcon(House, "Home");
export const ImageIcon = lucideIcon(Image, "Image");
export const ImportIcon = lucideIcon(FolderOpen, "Import");
export const InfoIcon = lucideIcon(Info, "Info");
export const LibraryIcon = lucideIcon(PanelLeft, "Library");
export const LightModeIcon = lucideIcon(Sun, "LightMode");
export const LockIcon = lucideIcon(Lock, "Lock");
export const MoreIcon = lucideIcon(EllipsisVertical, "More");
export const PlayIcon = lucideIcon(Play, "Play", { isFilled: true });
export const SettingsIcon = lucideIcon(Settings, "Settings");
export const StopIcon = lucideIcon(Square, "Stop", { isFilled: true });
export const SuggestionsIcon = lucideIcon(Sparkles, "Suggestions");
export const SystemModeIcon = lucideIcon(Monitor, "SystemMode");
export const TranslateIcon = lucideIcon(Languages, "Translate");
export const VoiceIcon = lucideIcon(Speech, "Voice");

// Lucide has no brand logos, and a brand mark keeps its own filled shape.
export const GitHubIcon = createSvgIcon(
  <path d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.28.73-.55v-1.84c-3.03.64-3.67-1.46-3.67-1.46-.55-1.29-1.28-1.65-1.28-1.65-.92-.65.1-.65.1-.65 1.1 0 1.73 1.1 1.73 1.1.92 1.65 2.57 1.2 3.21.92a2 2 0 01.64-1.47c-2.47-.27-5.04-1.19-5.04-5.5 0-1.1.46-2.1 1.2-2.84a3.76 3.76 0 010-2.93s.91-.28 3.11 1.1c1.8-.49 3.7-.49 5.5 0 2.1-1.38 3.02-1.1 3.02-1.1a3.76 3.76 0 010 2.93c.83.74 1.2 1.74 1.2 2.94 0 4.21-2.57 5.13-5.04 5.4.45.37.82.92.82 2.02v3.03c0 .27.1.64.73.55A11 11 0 0012 1.27" />,
  "GitHub",
);

interface LucideIconOptions {
  isFilled?: boolean;
}

type AppIconProps = Omit<SvgIconProps, "sx"> & {
  sx?: Exclude<SxProps<Theme>, readonly unknown[]>;
};

// Going through MUI's SvgIcon keeps size, color, sx and the classes MUI
// components target working as they do for MUI's own icons.
function lucideIcon(
  Icon: LucideIcon,
  name: string,
  { isFilled = false }: LucideIconOptions = {},
) {
  function AppIcon({ sx, ...props }: AppIconProps) {
    return (
      <SvgIcon
        data-testid={`${name}Icon`}
        {...props}
        component={Icon}
        inheritViewBox
        sx={[iconSx(isFilled), sx ?? false]}
      />
    );
  }

  AppIcon.displayName = `${name}Icon`;
  // MUI components recognize icon children by this name, as they do for
  // MUI's own icons.
  AppIcon.muiName = SvgIcon.muiName;

  return AppIcon;
}

function iconSx(isFilled: boolean) {
  return {
    // SvgIcon fills its root, which would paint over Lucide's open strokes.
    fill: isFilled ? "currentColor" : "none",
    // Lucide draws a 2px stroke on a 24px grid; keeping it 2px at every size
    // gives icons of all sizes one line weight.
    "& *": { vectorEffect: "non-scaling-stroke" },
  } as const;
}
