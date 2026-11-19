import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { m } from "@paraglide/messages.js";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/csr/DownloadSimple";
import { InfoIcon } from "@phosphor-icons/react/dist/csr/Info";
import { TrashIcon } from "@phosphor-icons/react/dist/csr/Trash";
import { useTranslate } from "@shared/language/use-translate";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";

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
          <PhosphorIcon icon={InfoIcon} fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryInfo)}</ListItemText>
      </MenuItem>

      <MenuItem onClick={onExport}>
        <ListItemIcon>
          <PhosphorIcon icon={DownloadSimpleIcon} fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryExport)}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem onClick={onRequestDelete} sx={{ color: "error.main" }}>
        <ListItemIcon sx={{ color: "inherit" }}>
          <PhosphorIcon icon={TrashIcon} fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryDelete)}</ListItemText>
      </MenuItem>
    </Menu>
  );
}
