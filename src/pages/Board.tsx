import Button from "@mui/material/Button";
import { useParams } from "react-router";

export function Board() {
  const { setId, boardId } = useParams<{ setId: string; boardId: string }>();

  return (
    <Button variant="contained">
      Board {boardId} in Set {setId}
    </Button>
  );
}
