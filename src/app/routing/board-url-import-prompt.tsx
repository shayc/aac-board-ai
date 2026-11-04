import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
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
        description={
          <BoardUrlImportDescription
            text={t(m.boardUrlImportDescription, { host: boardUrlHost })}
            host={boardUrlHost}
          />
        }
        action={
          <Form method="post">
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                width: 288,
                maxWidth: "100%",
                gap: 1.5,
              }}
            >
              <Button component={Link} to="/" replace size="large">
                {t(m.libraryCancel)}
              </Button>
              <Button type="submit" variant="contained" size="large">
                {t(m.boardUrlImportConfirm)}
              </Button>
            </Box>
          </Form>
        }
      />
    </>
  );
}

function BoardUrlImportDescription({
  text,
  host,
}: {
  text: string;
  host: string;
}) {
  const hostIndex = text.indexOf(host);
  if (hostIndex === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, hostIndex)}
      <Box
        component="strong"
        dir="ltr"
        sx={{ fontWeight: "fontWeightBold", color: "text.primary" }}
      >
        {host}
      </Box>
      {text.slice(hostIndex + host.length)}
    </>
  );
}
