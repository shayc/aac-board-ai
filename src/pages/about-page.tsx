import { APP_NAME } from "@app/app-info";
import GitHubIcon from "@mui/icons-material/GitHub";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@app/layouts/page-container";
import { PageTitle } from "@app/layouts/page-title";
import { ParaglideMessage } from "@inlang/paraglide-js-react";
import { m } from "@paraglide/messages.js";
import { ExternalLink } from "@shared/components/external-link";

export const Component = function AboutPage() {
  return (
    <PageContainer>
      <PageTitle>{m.aboutHeading()}</PageTitle>
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Typography component="p" variant="body1">
          {m.aboutAppDescription({ appName: APP_NAME })}
        </Typography>

        <Typography component="h2" variant="h6" sx={{ pt: 2 }}>
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

        <Typography variant="h6" component="h2" sx={{ pt: 2 }}>
          {m.aboutOpenSourceHeading()}
        </Typography>

        <Button
          variant="text"
          startIcon={<GitHubIcon />}
          href="https://github.com/shayc/aac-board-ai"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ alignSelf: "flex-start" }}
        >
          {m.aboutViewSource()}
        </Button>
      </Stack>
    </PageContainer>
  );
};
