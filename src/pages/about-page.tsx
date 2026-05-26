import { APP_NAME } from "@app/app-info";
import { PageContainer } from "@app/layouts/page-container";
import { PageTitle } from "@app/layouts/page-title";
import { ParaglideMessage } from "@inlang/paraglide-js-react";
import GitHubIcon from "@mui/icons-material/GitHub";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { ExternalLink } from "@shared/components/external-link";

export const Component = function AboutPage() {
  return (
    <PageContainer maxWidth="sm">
      <PageTitle>{m.aboutHeading()}</PageTitle>

      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Typography component="p" variant="h6" sx={{ pt: 6 }}>
          {m.aboutAppDescription({ appName: APP_NAME })}
        </Typography>

        <Typography component="h2" variant="h6">
          {m.aboutAcknowledgmentsHeading()}
        </Typography>

        <Typography
          component="p"
          variant="body2"
          sx={{ color: "text.secondary" }}
        >
          <ParaglideMessage
            message={m.aboutAcknowledgments}
            markup={{
              challenge: ({ children }) => (
                <ExternalLink href="https://developer.chrome.com/blog/ai-challenge-winners-2025/">
                  {children}
                </ExternalLink>
              ),
              obf: ({ children }) => (
                <ExternalLink href="https://www.openboardformat.org/">
                  {children}
                </ExternalLink>
              ),
              openaac: ({ children }) => (
                <ExternalLink href="https://www.openaac.org">
                  {children}
                </ExternalLink>
              ),
            }}
          />
        </Typography>

        <ExternalLink
          href="https://github.com/shayc/aac-board-ai"
          sx={{ display: "inline-flex", gap: 1 }}
        >
          <GitHubIcon />
          {m.aboutViewSource()}
        </ExternalLink>
      </Stack>
    </PageContainer>
  );
};
