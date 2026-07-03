import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useLanguage } from "@shared/language/use-language";
import { useState } from "react";
import { useSetBoards } from "./use-set-boards";

export interface BoardSwitcherPanelProps {
  setId: string;
  selectedBoardId: string | undefined;
  onSelect: (boardId: string) => void;
}

export function BoardSwitcherPanel({
  setId,
  selectedBoardId,
  onSelect,
}: BoardSwitcherPanelProps) {
  const { language } = useLanguage();
  const { boards, isLoading, error } = useSetBoards({ setId });
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLocaleLowerCase(language);
  const filteredBoards = normalizedQuery
    ? boards.filter((board) =>
        board.name.toLocaleLowerCase(language).includes(normalizedQuery),
      )
    : boards;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}
    >
      <Box sx={{ p: 1, flexShrink: 0 }}>
        <TextField
          slotProps={{ htmlInput: { "aria-label": m.boardSearch() } }}
          type="search"
          autoFocus
          size="small"
          fullWidth
          placeholder={m.boardSearch()}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </Box>

      <List dense sx={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {filteredBoards.map((board) => (
          <ListItemButton
            key={board.boardId}
            selected={board.boardId === selectedBoardId}
            onClick={() => onSelect(board.boardId)}
          >
            <ListItemText primary={board.name} />
          </ListItemButton>
        ))}
      </List>

      {error && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, py: 1 }}
        >
          {m.errorGenericTitle()}
        </Typography>
      )}

      {!isLoading && !error && filteredBoards.length === 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, py: 1 }}
        >
          {m.boardSearchNoResults()}
        </Typography>
      )}
    </Box>
  );
}
