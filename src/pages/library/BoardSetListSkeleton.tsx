import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";

export function BoardSetListSkeleton() {
  return (
    <List>
      {Array.from({ length: 3 }, (_, i) => (
        <ListItem key={i}>
          <ListItemIcon>
            <Skeleton variant="circular" width={24} height={24} />
          </ListItemIcon>
          <ListItemText
            primary={<Skeleton width="60%" />}
            secondary={<Skeleton width="30%" />}
          />
        </ListItem>
      ))}
    </List>
  );
}
