import { APP_NAME } from "@app/app-info";
import { useDeclareAppHeaderTitle } from "@app/layouts/app-header-title";
import GitHubIcon from "@mui/icons-material/GitHub";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PageContainer } from "@shared/components/page-container";
import { m } from "@paraglide/messages.js";
import { Title } from "@shared/components/title";

export const Component = function AboutPage() {
  useDeclareAppHeaderTitle(m.aboutHeading());

  return (
    <>
      <Title>{m.aboutHeading()}</Title>
      <PageContainer>
        <Stack spacing={{ xs: 3, sm: 4 }}>
          <Typography variant="body1" component="p">
            {m.aboutAppDescription({ appName: APP_NAME })}
          </Typography>

          <Typography variant="h6" component="h2" sx={{ pt: 2 }}>
            {m.aboutAcknowledgmentsHeading()}
          </Typography>

          <Typography
            variant="body2"
            component="p"
            color="text.secondary"
            sx={{
              "& a": {
                color: "primary.main",
                textDecorationColor: "currentColor",
                textUnderlineOffset: 4,
                textDecorationThickness: "from-font",
              },
              "& em": { fontStyle: "italic" },
            }}
          >
            <Link
              href="https://developer.chrome.com/blog/ai-challenge-winners-2025/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {m.aboutWinnerOfChallenge()}
            </Link>{" "}
            <Link
              href="https://www.openboardformat.org/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {m.aboutBuiltOnObf()}
            </Link>{" "}
            {m.aboutFeaturingQuickCore()}
            <Link
              href="https://www.openaac.org"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              {m.aboutOpenAacLinkText()}
            </Link>
            .
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
    </>
  );
};
