import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { LoadingState } from "@shared/ui/loading-state";
import { StatusLayout } from "@shared/ui/status-layout";
import { Form, Link, useLoaderData, useNavigation } from "react-router";
import type { BoardUrlImportPromptData } from "./loaders/root-index-loader";

export function BoardUrlImportPrompt() {
  const t = useTranslate();
  const { boardUrlHost } = useLoaderData<BoardUrlImportPromptData>();
  const navigation = useNavigation();

  if (navigation.formData) {
    return (
      <LoadingState message={t(m.libraryImportingBoardFiles, { count: 1 })} />
    );
  }

  const title = t(m.boardUrlImportTitle);

  return (
    <>
      <title>{title}</title>
      <StatusLayout
        kind="empty"
        icon={<LibraryAddOutlinedIcon />}
        title={title}
        titleComponent="h1"
        description={t(m.boardUrlImportDescription)}
        action={
          <Form method="post">
            <Stack direction="row" sx={{ justifyContent: "center", gap: 1 }}>
              <Button component={Link} to="/" replace>
                {t(m.libraryCancel)}
              </Button>
              <Button type="submit" variant="contained">
                {t(m.boardUrlImportConfirm)}
              </Button>
            </Stack>
          </Form>
        }
      >
        <BoardUrlHost host={boardUrlHost} />
      </StatusLayout>
    </>
  );
}

function BoardUrlHost({ host }: { host: string }) {
  return (
    <Typography
      component="p"
      dir="ltr"
      variant="subtitle1"
      sx={{
        display: "inline-block",
        maxWidth: "100%",
        mt: 1.5,
        mb: 1,
        px: 2,
        py: 0.5,
        overflowWrap: "anywhere",
        fontWeight: "fontWeightMedium",
        bgcolor: "action.selected",
        borderRadius: 1,
      }}
    >
      {host}
    </Typography>
  );
}
