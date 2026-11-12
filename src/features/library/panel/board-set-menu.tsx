import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SaveAltOutlinedIcon from "@mui/icons-material/SaveAltOutlined";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";

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
          <InfoOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryInfo)}</ListItemText>
      </MenuItem>

      <MenuItem onClick={onExport}>
        <ListItemIcon>
          <SaveAltOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryExport)}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem onClick={onRequestDelete} sx={{ color: "error.main" }}>
        <ListItemIcon sx={{ color: "inherit" }}>
          <DeleteOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t(m.libraryDelete)}</ListItemText>
      </MenuItem>
    </Menu>
  );
}
