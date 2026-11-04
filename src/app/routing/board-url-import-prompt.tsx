import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
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
        title={title}
        titleComponent="h1"
        description={t(m.boardUrlImportDescription, { host: boardUrlHost })}
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
      />
    </>
  );
}
