import DeleteIcon from "@material-symbols/svg-600/rounded/delete.svg?react";
import FileExportIcon from "@material-symbols/svg-600/rounded/file_export.svg?react";
import InfoIcon from "@material-symbols/svg-600/rounded/info.svg?react";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { MaterialIcon } from "@shared/ui/material-icon";

interface BoardSetMenuProps {
  id: string;
  anchorElement: HTMLElement | undefined;
  onClose: () => void;
  onShowInfo: () => void;
  onExport: () => void;
  onRequestDelete: () => void;
}

export function BoardSetMenu({
  id,
  anchorElement,
  onClose,
  onShowInfo,
  onExport,
  onRequestDelete,
}: BoardSetMenuProps) {
  const t = useTranslate();

  return (
    <Menu
      id={id}
      open={Boolean(anchorElement)}
      onClose={onClose}
      anchorEl={anchorElement}
    >
      <MenuItem onClick={onShowInfo}>
        <ListItemIcon>
          <MaterialIcon svg={InfoIcon} fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryInfo)}</ListItemText>
      </MenuItem>

      <MenuItem onClick={onExport}>
        <ListItemIcon>
          <MaterialIcon svg={FileExportIcon} fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryExport)}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem onClick={onRequestDelete} sx={{ color: "error.main" }}>
        <ListItemIcon sx={{ color: "inherit" }}>
          <MaterialIcon svg={DeleteIcon} fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryDelete)}</ListItemText>
      </MenuItem>
    </Menu>
  );
}
